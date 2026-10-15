/**
 * Admin: Book accounts, purchases, devices, violations and the Premium/Ultra device log.
 *   GET  /api/admin/book?view=overview|users|purchases|violations|devices|logins|notes|trials&q=
 *   POST /api/admin/book { action, ... }
 *        actions: ban, suspend, unban, reset_devices, revoke_device, grant_full, revoke_full, grant_notes, revoke_notes, fine, note, mark_delivered, reset_points, set_password, delete_user
 */
import { hashPassword, cfg, json, fail, body, adminAuth, rest, patch, insert, eq, clean, normMobile } from '../../_lib/book-core.js';

const count = async (env, table, q = '') => {
  const r = await rest(env, table, (q ? q + '&' : '') + 'select=id', { headers: { prefer: 'count=exact', range: '0-0' } });
  return parseInt((r.headers.get('content-range') || '').split('/')[1] || '0', 10) || 0;
};

export async function onRequest(context) {
  try { await adminAuth(context); } catch (r) { return r; }
  const { env, request } = context, c = cfg(env);

  if (request.method === 'GET') {
    const url = new URL(request.url), view = url.searchParams.get('view') || 'overview', q = clean(url.searchParams.get('q'), 60);
    if (view === 'overview') {
      const since = new Date(Date.now() - 86400000).toISOString();
      const [users, full, pending, banned, viol, sales, notesUsers] = await Promise.all([
        count(env, 'book_users'), count(env, 'book_users', 'has_full=eq.true'),
        count(env, 'book_purchases', 'plan=eq.pdf&status=in.(paid,free)&delivered=eq.false'),
        count(env, 'book_users', 'status=in.(banned,suspended)'), count(env, 'book_violations', 'created_at=gt.' + since),
        rest(env, 'book_purchases', 'status=in.(paid,free)&select=final_amount'),
        count(env, 'book_users', 'has_notes=eq.true')
      ]);
      const revenue = (sales.data || []).reduce((s, p) => s + (p.final_amount || 0), 0);
      return json({ ok: true, users, full, notesUsers, pendingPdf: pending, restricted: banned, violations24h: viol, revenue, config: { maxDevices: c.maxDevices, accessUntil: c.accessUntil, suspendAt: c.suspendAt, banAt: c.banAt } });
    }
    if (view === 'users') {
      let query = 'select=*,book_devices(id,label,active,last_seen,ip),book_purchases(id,plan,final_amount,status,created_at)&order=created_at.desc&limit=300';
      if (q) { const m = normMobile(q); query += '&or=(full_name.ilike.*' + encodeURIComponent(q) + '*,email.ilike.*' + encodeURIComponent(q) + '*' + (m.length >= 4 ? ',mobile.like.*' + m + '*' : '') + ')'; }
      const r = await rest(env, 'book_users', query);
      return json({ ok: r.ok, users: (r.data || []).map(u => { delete u.pass_hash; return u; }) });
    }
    if (view === 'purchases') {
      const r = await rest(env, 'book_purchases', 'select=*,book_users(full_name,mobile,email)&order=created_at.desc&limit=300');
      return json({ ok: r.ok, purchases: r.data || [] });
    }
    if (view === 'violations') {
      const r = await rest(env, 'book_violations', 'select=*,book_users(full_name,mobile,status)&order=created_at.desc&limit=300');
      return json({ ok: r.ok, violations: r.data || [] });
    }
    if (view === 'devices') {
      const r = await rest(env, 'book_devices', 'select=*,book_users(full_name,mobile)&order=last_seen.desc&limit=300');
      return json({ ok: r.ok, devices: r.data || [] });
    }
    if (view === 'logins') {
      const r = await rest(env, 'device_logins', 'select=*&order=last_seen.desc&limit=500');
      return json({ ok: r.ok, logins: r.data || [] });
    }
    if (view === 'notes') {
      // Short Notes analytics: who bought them alone, who got them free with the book, readers, sales per day
      const [purch, owners, opens, signups] = await Promise.all([
        rest(env, 'book_purchases', 'plan=eq.notes&select=*,book_users(full_name,mobile,email,college,city)&order=created_at.desc&limit=500'),
        rest(env, 'book_users', 'or=(has_notes.eq.true,has_full.eq.true)&select=id,full_name,mobile,email,city,college,branch,has_full,has_notes,plan,access_until,created_at,last_login&order=created_at.desc&limit=500'),
        rest(env, 'book_opens', 'kind=eq.notes&select=user_id,created_at&order=created_at.desc&limit=5000'),
        count(env, 'book_users')
      ]);
      const purchases = purch.data || [], owner = owners.data || [], op = opens.ok && Array.isArray(opens.data) ? opens.data : [];
      const paidRows = purchases.filter(p => p.status === 'paid' || p.status === 'free');
      const standalone = new Set(paidRows.map(p => p.user_id));
      const viaBook = owner.filter(u => u.has_full && !standalone.has(u.id)).length;
      const revenue = paidRows.reduce((t, p) => t + (p.final_amount || 0), 0);
      const day = new Date(Date.now() - 7 * 86400000).toISOString();
      const readers = new Set(op.map(o => o.user_id));
      const daily = {};
      paidRows.forEach(p => { const d = String(p.paid_at || p.created_at).slice(0, 10); const e = daily[d] || (daily[d] = { day: d, sales: 0, revenue: 0 }); e.sales++; e.revenue += p.final_amount || 0; });
      const openCount = {}; op.forEach(o => { openCount[o.user_id] = (openCount[o.user_id] || 0) + 1; });
      return json({
        ok: true,
        kpis: {
          accounts: signups, standaloneBuyers: standalone.size, includedWithBook: viaBook, totalWithNotes: owner.filter(u => u.has_notes || u.has_full).length,
          revenue, attempts: purchases.length, abandoned: purchases.filter(p => p.status === 'created' || p.status === 'failed').length,
          opens: op.length, opens7d: op.filter(o => o.created_at > day).length, uniqueReaders: readers.size,
          conversion: signups ? Math.round(standalone.size * 1000 / signups) / 10 : 0
        },
        daily: Object.values(daily).sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, 30),
        purchases,
        owners: owner.map(u => ({ ...u, via: standalone.has(u.id) ? 'notes' : u.has_full ? 'book' : 'admin', opens: openCount[u.id] || 0 })),
        trackingReady: opens.ok
      });
    }
    if (view === 'trials') {
      // free-trial Premium sign-ups: account data + what they unlocked + whether they converted
      const [uses, users, access] = await Promise.all([
        rest(env, 'premium_trial_uses', 'select=user_id,kind,resource,meta,ip,created_at&order=created_at.desc&limit=5000'),
        rest(env, 'premium_users', 'select=id,full_name,mobile,email,created_at&order=created_at.desc&limit=3000'),
        rest(env, 'premium_access', 'select=user_id,is_active&limit=5000')
      ]);
      if (!uses.ok) return json({ ok: false, error: 'Free-trial table missing. Run sql/supabase_trial.sql in Supabase.' });
      const byUser = {};
      (uses.data || []).forEach(r => { const e = byUser[r.user_id] || (byUser[r.user_id] = { papers: [], tools: [], college: '', ip: '', joined: null }); if (r.kind === 'signup') { e.college = r.meta || ''; e.ip = r.ip || ''; e.joined = r.created_at; } else if (r.kind === 'paper') e.papers.push(r.resource); else e.tools.push(r.resource); });
      const accMap = {}; (access.data || []).forEach(a => { accMap[String(a.user_id)] = a.is_active; });
      const uMap = {}; (users.data || []).forEach(u => { uMap[String(u.id)] = u; });
      const list = Object.keys(byUser).filter(id => byUser[id].joined).map(id => {
        const u = uMap[id] || {}, e = byUser[id];
        return { id, name: u.full_name || '', mobile: u.mobile || '', email: u.email || '', college: e.college, ip: e.ip, joined: e.joined, papers: e.papers, tools: e.tools, converted: accMap[id] === true };
      });
      return json({ ok: true, trials: list, kpis: { total: list.length, converted: list.filter(t => t.converted).length, usedPaper: list.filter(t => t.papers.length).length, usedTool: list.filter(t => t.tools.length).length } });
    }
    return fail('Unknown view.');
  }

  if (request.method === 'POST') {
    const b = await body(request), id = b.userId;
    const uq = 'id=' + eq(id || '');
    switch (b.action) {
      case 'ban': await patch(env, 'book_users', uq, { status: 'banned', status_reason: clean(b.reason, 200) || 'Banned by admin' }); break;
      case 'suspend': await patch(env, 'book_users', uq, { status: 'suspended', status_reason: clean(b.reason, 200) || 'Suspended by admin' }); break;
      case 'unban': await patch(env, 'book_users', uq, { status: 'active', status_reason: null, violation_points: 0 }); break;
      case 'reset_points': await patch(env, 'book_users', uq, { violation_points: 0 }); break;
      case 'reset_devices': await patch(env, 'book_devices', 'user_id=' + eq(id || ''), { active: false }); break;
      case 'revoke_device': await patch(env, 'book_devices', 'id=' + eq(b.deviceId || '') , { active: false }); break;
      case 'grant_full': await patch(env, 'book_users', uq, { has_full: true, has_notes: true, plan: b.plan === 'pdf' ? 'pdf' : 'reader', access_until: new Date(c.accessUntil + 'T23:59:59+05:30').toISOString() }); break;
      case 'revoke_full': await patch(env, 'book_users', uq, { has_full: false, has_notes: false }); break;
      case 'grant_notes': await patch(env, 'book_users', uq, { has_notes: true, access_until: new Date(c.accessUntil + 'T23:59:59+05:30').toISOString() }); break;
      case 'revoke_notes': await patch(env, 'book_users', uq, { has_notes: false }); break;
      case 'fine': await patch(env, 'book_users', uq, { fine_amount: Math.max(0, Math.round(+b.amount || 0)) }); break;
      case 'note': await patch(env, 'book_users', uq, { admin_note: clean(b.note, 500) }); break;
      case 'mark_delivered': await patch(env, 'book_purchases', 'id=' + eq(b.purchaseId || ''), { delivered: b.delivered !== false }); break;
      case 'set_password': {
        const pw = String(b.password || '');
        if (pw.length < 6 || pw.length > 100) return fail('Password must be 6 to 100 characters.');
        const r = await patch(env, 'book_users', uq, { pass_hash: await hashPassword(pw) });
        if (!r.ok || !r.data || !r.data.length) return fail('User not found.', 404);
        await patch(env, 'book_devices', 'user_id=' + eq(id || ''), { active: false }); // sign out everywhere
        break;
      }
      case 'delete_user': {
        const u = await rest(env, 'book_users', uq + '&select=id,has_full');
        if (!u.ok || !u.data || !u.data[0]) return fail('User not found.', 404);
        const pur = await rest(env, 'book_purchases', 'user_id=' + eq(id || '') + '&select=id&limit=1');
        if (u.data[0].has_full || (pur.data && pur.data.length)) return fail('This user has bought the book. Revoke access instead of deleting (purchase records are kept).');
        await rest(env, 'book_users', uq, { method: 'DELETE' });
        break;
      }
      default: return fail('Unknown action.');
    }
    return json({ ok: true });
  }
  return fail('Method not allowed.', 405);
}
