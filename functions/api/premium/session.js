/**
 * Premium / Ultra login session (cookie checked by functions/_middleware.js before any premium paper is served).
 *   POST   /api/premium/session { mobile, password }  → verifies, sets the HttpOnly cookie, returns { user, tier }
 *   GET    /api/premium/session                       → { ok, user } if the cookie is valid
 *   DELETE /api/premium/session                       → logout
 */
import { json, fail, body, requireEnv, throttle, clientInfo } from '../../_lib/book-core.js';
import {
  verifyStudent, hasActiveAccess, isUltraUser, issuePremiumCookie, clearCookieHeader, readCookie,
  verifyToken, normMobile
} from '../../_lib/pay-core.js';

export async function onRequest(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY', 'SESSION_SECRET']);
  if (notCfg) return notCfg;

  if (request.method === 'DELETE') return json({ ok: true }, 200, { 'set-cookie': clearCookieHeader() });

  if (request.method === 'GET') {
    const p = await verifyToken(env.SESSION_SECRET, readCookie(request));
    if (!p || p.k !== 'prem') return fail('Not logged in.', 401, 'auth');
    return json({ ok: true, user: { id: p.uid, mobile: p.m } });
  }

  if (request.method === 'POST') {
    const b = await body(request), info = clientInfo(request), mobile = normMobile(b.mobile), pass = String(b.password || '');
    if (!(await throttle(env, 'plogin:' + info.ip, 8, 60))) return fail('Too many attempts. Please wait a minute.', 429, 'rate');
    if (mobile.length !== 10 || !pass || pass.length > 100) return fail('Invalid mobile or password.', 401, 'credentials');
    if (!(await throttle(env, 'plogin:m:' + mobile, 6, 30))) return fail('Too many attempts for this number. Please wait.', 429, 'rate');
    const user = await verifyStudent(env, mobile, pass);
    if (!user) return fail('Invalid mobile or password.', 401, 'credentials');
    if (!(await hasActiveAccess(env, user.id))) return fail('Account not active.', 403, 'inactive');
    const ultra = await isUltraUser(env, user);
    return json({ ok: true, user: { id: user.id, mobile: user.mobile, email: user.email, full_name: user.full_name }, tier: ultra ? 'ultra' : 'premium' }, 200, { 'set-cookie': await issuePremiumCookie(env, user) });
  }
  return fail('Method not allowed.', 405);
}
