/**
 * GET    /api/counseling/requests            → my requests (with the expert's responses)
 * POST   /api/counseling/requests {…}        → submit a new request (needs a paid / free-coupon payment)
 * DELETE /api/counseling/requests {id}       → delete one of my requests
 */
import { json, fail, body, throttle, rest, insert, eq, clean } from '../../_lib/book-core.js';
import { cnsAuth, hasPaid } from '../../_lib/cns-core.js';

export async function onRequest(context) {
  let a;
  try { a = await cnsAuth(context); } catch (r) { return r; }
  const { env, request } = context, uid = a.user.id;

  if (request.method === 'GET') {
    const r = await rest(env, 'counseling_requests', 'select=' + encodeURIComponent('*,counseling_responses(*)') + '&user_id=' + eq(uid) + '&order=submitted_at.desc');
    if (!r.ok) return fail('Could not load your requests.', 500, 'db');
    return json({ ok: true, requests: r.data || [] });
  }

  if (request.method === 'POST') {
    if (!(await throttle(env, 'cnsreq:' + uid, 3, 15))) return fail('Too many submissions. Please wait.', 429, 'rate');
    if (!(await hasPaid(env, uid))) return fail('Please complete the payment first.', 402, 'unpaid');
    const cnt = await rest(env, 'counseling_requests', 'user_id=' + eq(uid) + '&select=id', { headers: { prefer: 'count=exact', range: '0-0' } });
    const total = parseInt((cnt.headers.get('content-range') || '').split('/')[1] || '0', 10) || 0;
    if (total >= 10) return fail('You already have 10 requests. Please delete an old one first.', 400, 'limit');
    const b = await body(request);
    const rank = parseInt(b.rank, 10);
    if (!(rank > 0 && rank < 10000000)) return fail('Please enter your LEET/Entrance Rank.');
    const branches = [b.branch_1, b.branch_2, b.branch_3, b.branch_4, b.branch_5].map(x => clean(x, 80) || null);
    if (!branches[0]) return fail('Please provide at least one Branch Choice.');
    let colleges = null;
    if (Array.isArray(b.college_preferences) && b.college_preferences.length) {
      colleges = b.college_preferences.slice(0, 15).map(c => ({ college: clean(c && c.college, 120), branch: clean(c && c.branch, 80) }));
    }
    const r = await insert(env, 'counseling_requests', {
      user_id: uid, rank, branch_1: branches[0], branch_2: branches[1], branch_3: branches[2], branch_4: branches[3], branch_5: branches[4],
      college_preferences: colleges, notes: clean(b.notes, 1500) || null, status: 'pending'
    });
    if (!r.ok) return fail('Could not submit your request. Please try again.', 500, 'db');
    return json({ ok: true });
  }

  if (request.method === 'DELETE') {
    const b = await body(request);
    const id = clean(b.id, 64);
    if (!id) return fail('Bad request.');
    const r = await rest(env, 'counseling_requests', 'id=' + eq(id) + '&user_id=' + eq(uid), { method: 'DELETE', prefer: 'return=representation' });
    return r.ok && r.data && r.data.length ? json({ ok: true }) : fail('Request not found.', 404);
  }
  return fail('Method not allowed.', 405);
}
