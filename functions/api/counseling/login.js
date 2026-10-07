/** POST /api/counseling/login { email, password } → { token, user, paid } */
import { json, fail, body, requireEnv, throttle, clientInfo, clean } from '../../_lib/book-core.js';
import { cnsToken, publicCnsUser, hasPaid, checkCounselingLogin } from '../../_lib/cns-core.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY', 'SESSION_SECRET']);
  if (notCfg) return notCfg;
  const b = await body(request), info = clientInfo(request);
  const email = clean(b.email, 120).toLowerCase(), pass = String(b.password || '');
  if (!(await throttle(env, 'cnslogin:' + info.ip, 8, 60))) return fail('Too many attempts. Please wait a minute.', 429, 'rate');
  if (!email || !pass || pass.length > 100) return fail('Invalid email or password.', 401, 'credentials');
  if (!(await throttle(env, 'cnslogin:e:' + email, 6, 30))) return fail('Too many attempts for this account. Please wait.', 429, 'rate');
  const u = await checkCounselingLogin(env, email, pass);
  if (!u) return fail('Invalid email or password.', 401, 'credentials');
  return json({ ok: true, user: publicCnsUser(u), paid: await hasPaid(env, u.id), token: await cnsToken(env, u) });
}
