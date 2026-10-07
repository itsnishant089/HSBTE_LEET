/**
 * Admin: Premium / Ultra and Counselling user maintenance (runs with the service key, so Row-Level-Security
 * can't silently block it the way it did with the browser key).
 *   GET  /api/admin/users?view=duplicates&product=premium|counseling      preview of what would be removed
 *   POST /api/admin/users { action:'dedupe', product }                      remove duplicates (keeps the best account of each person)
 *   POST /api/admin/users { action:'reset_password', product, userId, password }   admin sets a new password (never shown anywhere)
 */
import { json, fail, body, adminAuth, rest, patch, eq, clean, normMobile } from '../../_lib/book-core.js';

const TABLES = {
  premium: { users: 'premium_users', cols: 'id,full_name,mobile,email,created_at' },
  counseling: { users: 'counseling_users', cols: 'id,full_name,mobile,email,created_at' }
};

async function all(env, table, cols, extra = '') {
  const out = [];
  for (let from = 0; from < 20000; from += 1000) {
    const r = await rest(env, table, 'select=' + cols + (extra ? '&' + extra : '') + '&order=created_at.desc', { headers: { range: from + '-' + (from + 999) } });
    if (!r.ok || !Array.isArray(r.data)) break;
    out.push(...r.data);
    if (r.data.length < 1000) break;
  }
  return out;
}

/** group accounts that belong to the same person (same mobile OR same email) */
function groupDuplicates(users) {
  const parent = new Map(users.map(u => [u.id, u.id]));
  const find = x => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
  const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent.set(a, b); };
  const byMobile = new Map(), byEmail = new Map();
  for (const u of users) {
    const m = normMobile(u.mobile), e = String(u.email || '').trim().toLowerCase();
    if (m.length === 10) { if (byMobile.has(m)) union(u.id, byMobile.get(m)); else byMobile.set(m, u.id); }
    if (e) { if (byEmail.has(e)) union(u.id, byEmail.get(e)); else byEmail.set(e, u.id); }
  }
  const groups = new Map();
  for (const u of users) { const k = find(u.id); (groups.get(k) || groups.set(k, []).get(k)).push(u); }
  return [...groups.values()].filter(g => g.length > 1);
}

async function plan(env, product) {
  const T = TABLES[product];
  const users = await all(env, T.users, T.cols);
  const groups = groupDuplicates(users);
  let score = () => 0;
  if (product === 'premium') {
    const [pay, acc, ult] = await Promise.all([
      all(env, 'premium_payments', 'user_id,status', 'status=in.(paid,free_coupon)').catch(() => []),
      all(env, 'premium_access', 'user_id,is_active').catch(() => []),
      all(env, 'ultra_premium_users', 'user_id').catch(() => [])
    ]);
    const paid = new Set(pay.map(p => String(p.user_id))), act = new Set(acc.filter(a => a.is_active).map(a => String(a.user_id))), ul = new Set(ult.map(x => String(x.user_id)));
    score = u => (ul.has(String(u.id)) ? 4 : 0) + (paid.has(String(u.id)) ? 2 : 0) + (act.has(String(u.id)) ? 1 : 0);
  } else {
    const pay = await all(env, 'counseling_payments', 'user_id').catch(() => []);
    const paid = new Set(pay.map(p => String(p.user_id)));
    score = u => (paid.has(String(u.id)) ? 2 : 0);
  }
  return groups.map(g => {
    const sorted = g.slice().sort((a, b) => score(b) - score(a) || new Date(b.created_at) - new Date(a.created_at));
    return { keep: sorted[0], remove: sorted.slice(1) };
  });
}

export async function onRequest(context) {
  try { await adminAuth(context); } catch (r) { return r; }
  const { env, request } = context;

  if (request.method === 'GET') {
    const u = new URL(request.url), product = u.searchParams.get('product');
    if (!TABLES[product]) return fail('Unknown product.');
    const groups = await plan(env, product);
    return json({ ok: true, groups: groups.map(g => ({ keep: { name: g.keep.full_name, mobile: g.keep.mobile, email: g.keep.email }, remove: g.remove.map(r => ({ id: r.id, name: r.full_name, mobile: r.mobile, email: r.email })) })), count: groups.reduce((n, g) => n + g.remove.length, 0) });
  }

  if (request.method === 'POST') {
    const b = await body(request), product = b.product;
    if (!TABLES[product]) return fail('Unknown product.');

    if (b.action === 'dedupe') {
      const groups = await plan(env, product);
      let removed = 0;
      for (const g of groups) {
        for (const r of g.remove) {
          const id = String(r.id);
          if (product === 'premium') {
            // keep every payment record (move it to the account we keep), drop the duplicate's access rows
            await patch(env, 'premium_payments', 'user_id=' + eq(id), { user_id: g.keep.id });
            await rest(env, 'premium_access', 'user_id=' + eq(id), { method: 'DELETE' });
            await rest(env, 'ultra_premium_users', 'user_id=' + eq(id), { method: 'DELETE' });
          } else {
            await patch(env, 'counseling_payments', 'user_id=' + eq(id), { user_id: g.keep.id });
            await rest(env, 'counseling_requests', 'user_id=' + eq(id), { method: 'DELETE' });
            await rest(env, 'counseling_chats', 'user_id=' + eq(id), { method: 'DELETE' });
          }
          const d = await rest(env, TABLES[product].users, 'id=' + eq(id), { method: 'DELETE' });
          if (d.ok) removed++;
        }
      }
      return json({ ok: true, removed, groups: groups.length });
    }

    if (b.action === 'reset_password') {
      const pw = String(b.password || '');
      if (pw.length < 6 || pw.length > 100) return fail('Password must be 6 to 100 characters.');
      const r = await patch(env, TABLES[product].users, 'id=' + eq(clean(b.userId, 64)), { password_hash: pw });
      return r.ok && r.data && r.data.length ? json({ ok: true }) : fail('Could not update the password (user not found?).', 404);
    }
    return fail('Unknown action.');
  }
  return fail('Method not allowed.', 405);
}
