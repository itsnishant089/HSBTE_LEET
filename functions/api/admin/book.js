/**
 * Admin: Book accounts, purchases, devices, violations and the Premium/Ultra device log.
 *   GET  /api/admin/book?view=overview|users|purchases|violations|devices|logins&q=
 *   POST /api/admin/book { action, ... }
 *        actions: ban, suspend, unban, reset_devices, revoke_device, grant_full, revoke_full, fine, note, mark_delivered, reset_points
 */
import { cfg, json, fail, body, adminAuth, rest, patch, insert, eq, clean, normMobile } from '../../_lib/book-core.js';

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
      const [users, full, pending, banned, viol, sales] = await Promise.all([
        count(env, 'book_users'), count(env, 'book_users', 'has_full=eq.true'),
        count(env, 'book_purchases', 'plan=eq.pdf&status=in.(paid,free)&delivered=eq.false'),
        count(env, 'book_users', 'status=in.(banned,suspended)'), count(env, 'book_violations', 'created_at=gt.' + since),
        rest(env, 'book_purchases', 'status=in.(paid,free)&select=final_amount')
      ]);
      const revenue = (sales.data || []).reduce((s, p) => s + (p.final_amount || 0), 0);
      return json({ ok: true, users, full, pendingPdf: pending, restricted: banned, violations24h: viol, revenue, config: { maxDevices: c.maxDevices, accessUntil: c.accessUntil, suspendAt: c.suspendAt, banAt: c.banAt } });
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
      case 'grant_full': await patch(env, 'book_users', uq, { has_full: true, plan: b.plan === 'pdf' ? 'pdf' : 'reader', access_until: new Date(c.accessUntil + 'T23:59:59+05:30').toISOString() }); break;
      case 'revoke_full': await patch(env, 'book_users', uq, { has_full: false }); break;
      case 'fine': await patch(env, 'book_users', uq, { fine_amount: Math.max(0, Math.round(+b.amount || 0)) }); break;
      case 'note': await patch(env, 'book_users', uq, { admin_note: clean(b.note, 500) }); break;
      case 'mark_delivered': await patch(env, 'book_purchases', 'id=' + eq(b.purchaseId || ''), { delivered: b.delivered !== false }); break;
      default: return fail('Unknown action.');
    }
    return json({ ok: true });
  }
  return fail('Method not allowed.', 405);
}
