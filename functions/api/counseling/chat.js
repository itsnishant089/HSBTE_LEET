/**
 * GET  /api/counseling/chat           → my conversation with the expert
 * POST /api/counseling/chat {message} → send a message (as the student)
 */
import { json, fail, body, throttle, rest, insert, eq, clean } from '../../_lib/book-core.js';
import { cnsAuth } from '../../_lib/cns-core.js';

export async function onRequest(context) {
  let a;
  try { a = await cnsAuth(context); } catch (r) { return r; }
  const { env, request } = context, uid = a.user.id;
  if (request.method === 'GET') {
    const r = await rest(env, 'counseling_chats', 'select=*&user_id=' + eq(uid) + '&order=created_at.asc&limit=500');
    return r.ok ? json({ ok: true, messages: r.data || [] }) : fail('Could not load messages.', 500, 'db');
  }
  if (request.method === 'POST') {
    if (!(await throttle(env, 'cnschat:' + uid, 10, 200))) return fail('You are sending messages too fast.', 429, 'rate');
    const b = await body(request), message = clean(b.message, 1000);
    if (!message) return fail('Message is empty.');
    const r = await insert(env, 'counseling_chats', { user_id: uid, sender: 'student', message });
    return r.ok ? json({ ok: true }) : fail('Could not send the message.', 500, 'db');
  }
  return fail('Method not allowed.', 405);
}
