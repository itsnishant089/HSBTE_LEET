/**
 * Free trial sign-up for Premium (one account per mobile number).
 *   POST /api/premium/trial { name, mobile, email, password, college? }
 * Creates the student account (so the admin gets the lead exactly like a paid sign-up) WITHOUT premium access,
 * and logs them in. The trial itself (1 paper + 2 tools by default) is enforced in functions/_middleware.js.
 */
import { json, fail, body, requireEnv, throttle, clientInfo, rest } from '../../_lib/book-core.js';
import { issuePremiumCookie, trialLimits, one, insert, eq, clean, normMobile, validMobile, validEmail } from '../../_lib/pay-core.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY', 'SESSION_SECRET']);
  if (notCfg) return notCfg;
  const b = await body(request), info = clientInfo(request);
  if (!(await throttle(env, 'trial:' + info.ip, 5, 40))) return fail('Too many attempts. Please wait a minute.', 429, 'rate');

  const name = clean(b.name || b.full_name, 80), mobile = normMobile(b.mobile), email = clean(b.email, 120).toLowerCase();
  const pass = String(b.password || ''), college = clean(b.college, 100);
  if (name.length < 2) return fail('Please enter your name.');
  if (!validMobile(mobile)) return fail('Enter a valid 10-digit mobile number.');
  if (!validEmail(email)) return fail('Enter a valid email address.');
  if (pass.length < 6 || pass.length > 100) return fail('Password must be 6 to 100 characters.');
  if (!(await throttle(env, 'trial:m:' + mobile, 3, 10))) return fail('Too many attempts for this number. Please wait.', 429, 'rate');

  if (await one(env, 'premium_users', 'mobile=' + eq(mobile) + '&select=id')) {
    return fail('This mobile number is already registered. Please log in.', 409, 'exists');
  }
  // the trial table must exist before we create anything
  const probe = await rest(env, 'premium_trial_uses', 'select=id&limit=1');
  if (!probe.ok) return fail('Free trial is not set up yet. Please try again later.', 503, 'not_configured');

  const ins = await insert(env, 'premium_users', { mobile, email, password_hash: pass, full_name: name });
  if (!ins.ok || !ins.data || !ins.data[0]) return fail('Could not create the account. Please try again.', 500, 'db');
  const user = { id: ins.data[0].id, mobile, email, full_name: name };

  const sig = await insert(env, 'premium_trial_uses', { user_id: String(user.id), kind: 'signup', resource: 'trial', meta: college, ip: info.ip });
  if (!sig.ok) {
    await rest(env, 'premium_users', 'id=' + eq(user.id), { method: 'DELETE' });
    return fail('Could not start the free trial. Please try again.', 500, 'db');
  }
  const L = trialLimits(env);
  return json({ ok: true, tier: 'free', user, trial: { papers: L.paper, tools: L.tool } }, 200, { 'set-cookie': await issuePremiumCookie(env, user) });
}
