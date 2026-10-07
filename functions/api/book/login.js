import { cfg, json, fail, body, requireEnv, rest, patch, eq, verifyPassword, normMobile, clean, clientInfo, registerDevice, issueToken, publicUser, throttle } from '../../_lib/book-core.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY', 'SESSION_SECRET']);
  if (notCfg) return notCfg;
  const c = cfg(env), b = await body(request), info = clientInfo(request);

  const id = clean(b.id, 120).toLowerCase();
  const password = String(b.password || '');
  if (!id || !password) return fail('Enter your mobile/email and password.');

  // brute-force protection: per account and per IP
  const okAcc = await throttle(env, 'login:' + id, 8, 60);
  const okIp = await throttle(env, 'loginip:' + info.ip, 30, 300);
  if (!okAcc || !okIp) return fail('Too many login attempts. Please wait a few minutes.', 429, 'rate');

  const mobile = normMobile(id);
  const q = id.includes('@') ? 'email=' + eq(id) : 'mobile=' + eq(mobile);
  const r = await rest(env, 'book_users', q + '&select=*&limit=1');
  const user = r.ok && r.data && r.data[0];
  if (!user || !(await verifyPassword(password, user.pass_hash))) return fail('Incorrect mobile/email or password.', 401, 'credentials');

  if (user.status === 'banned') return fail('This account has been banned. Contact support.', 403, 'banned', { reason: user.status_reason || '' });

  const dev = await registerDevice(env, c, user, b, info);
  if (dev.error) return dev.error;
  await patch(env, 'book_users', 'id=' + eq(user.id), { last_login: new Date().toISOString() });
  const token = await issueToken(env, c, user, dev.deviceId);
  return json({ ok: true, token, user: publicUser(user, c) });
}
