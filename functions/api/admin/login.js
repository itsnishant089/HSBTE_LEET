import { json, fail, body, requireEnv, rpc, signToken, safeEqual, sha256hex, clientInfo, throttle } from '../../_lib/book-core.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['SESSION_SECRET', 'MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY']);
  if (notCfg) return notCfg;
  const b = await body(request), info = clientInfo(request);
  if (!(await throttle(env, 'admin:' + info.ip, 5, 40))) return fail('Too many attempts. Try again later.', 429, 'rate');
  const pw = String(b.password || '');
  // 1) password stored in the database (bcrypt) — preferred;  2) ADMIN_PASSWORD environment variable as a fallback
  const r = await rpc(env, 'verify_admin_password', { p: pw });
  let ok = r.ok && r.data === true;
  const dbHasPassword = r.ok && r.data !== null;
  if (!dbHasPassword) {
    if (!env.ADMIN_PASSWORD) return fail('Admin password is not set yet. Run set_admin_password() in Supabase SQL Editor.', 503, 'not_configured');
    ok = safeEqual(await sha256hex(pw), await sha256hex(env.ADMIN_PASSWORD));
  }
  if (!ok) return fail('Incorrect password.', 401, 'credentials');
  return json({ ok: true, token: await signToken(env.SESSION_SECRET, { k: 'admin' }, 8) });
}
