/**
 * Premium / Ultra login session (cookie checked by functions/_middleware.js before any premium paper is served).
 *   POST   /api/premium/session { mobile, password }  → verifies, sets the HttpOnly cookie, returns { user, tier }
 *          tier = 'ultra' | 'premium' | 'free' (free-trial account: registered, no purchase yet)
 *   GET    /api/premium/session                       → { ok, user, tier, trial } if the cookie is valid
 *   DELETE /api/premium/session                       → logout
 */
import { json, fail, body, requireEnv, throttle, clientInfo } from '../../_lib/book-core.js';
import {
  verifyStudent, accessRow, trialStatus, isUltraUser, issuePremiumCookie, clearCookieHeader, readCookie,
  verifyToken, normMobile, one, eq
} from '../../_lib/pay-core.js';

export async function onRequest(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY', 'SESSION_SECRET']);
  if (notCfg) return notCfg;

  if (request.method === 'DELETE') return json({ ok: true }, 200, { 'set-cookie': clearCookieHeader() });

  if (request.method === 'GET') {
    const p = await verifyToken(env.SESSION_SECRET, readCookie(request));
    if (!p || p.k !== 'prem') return fail('Not logged in.', 401, 'auth');
    const u = await one(env, 'premium_users', 'id=' + eq(p.uid) + '&select=id,mobile,email,full_name');
    const acc = await accessRow(env, p.uid);
    const free = acc === null;           // no access row at all → free-trial account
    return json({
      ok: true, user: { id: p.uid, mobile: p.m, email: u ? u.email : '', full_name: u ? u.full_name : '' },
      tier: free ? 'free' : (acc && acc.is_active ? 'paid' : 'inactive'),
      trial: free ? await trialStatus(env, p.uid) : null
    });
  }

  if (request.method === 'POST') {
    const b = await body(request), info = clientInfo(request), mobile = normMobile(b.mobile), pass = String(b.password || '');
    if (!(await throttle(env, 'plogin:' + info.ip, 8, 60))) return fail('Too many attempts. Please wait a minute.', 429, 'rate');
    if (mobile.length !== 10 || !pass || pass.length > 100) return fail('Invalid mobile or password.', 401, 'credentials');
    if (!(await throttle(env, 'plogin:m:' + mobile, 6, 30))) return fail('Too many attempts for this number. Please wait.', 429, 'rate');
    const user = await verifyStudent(env, mobile, pass);
    if (!user) return fail('Invalid mobile or password.', 401, 'credentials');
    const acc = await accessRow(env, user.id);
    const out = { id: user.id, mobile: user.mobile, email: user.email, full_name: user.full_name };
    if (acc === null) { // registered through the free trial, nothing bought yet
      return json({ ok: true, user: out, tier: 'free', trial: await trialStatus(env, user.id) }, 200, { 'set-cookie': await issuePremiumCookie(env, user) });
    }
    if (!acc || !acc.is_active) return fail('Account not active.', 403, 'inactive');
    const ultra = await isUltraUser(env, user);
    return json({ ok: true, user: out, tier: ultra ? 'ultra' : 'premium' }, 200, { 'set-cookie': await issuePremiumCookie(env, user) });
  }
  return fail('Method not allowed.', 405);
}
