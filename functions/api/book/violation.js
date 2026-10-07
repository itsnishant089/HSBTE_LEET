import { cfg, json, body, bookAuth, recordViolation, clientInfo, throttle } from '../../_lib/book-core.js';

export async function onRequestPost(context) {
  let a;
  try { a = await bookAuth(context, { allowRestricted: true }); } catch (r) { return r; }
  const { env, request } = context, c = cfg(env), b = await body(request), info = clientInfo(request);
  if (!(await throttle(env, 'viol:' + a.user.id, 20, 200))) return json({ ok: true, throttled: true });
  const r = await recordViolation(env, c, a.user, { type: b.type, detail: b.detail, deviceId: a.payload.did }, info);
  const msg = r.status === 'banned' ? 'Your account has been banned for repeated violations.'
    : r.status === 'suspended' ? 'Your account is suspended for review.'
    : 'This action is not allowed and has been logged against your account.';
  return json({ ok: true, points: r.points, status: r.status, message: msg });
}
