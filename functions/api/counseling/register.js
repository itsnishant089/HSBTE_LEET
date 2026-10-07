/** POST /api/counseling/register — creates the counselling account (replaces the browser insert). */
import { json, fail, body, requireEnv, throttle, clientInfo, one, insert, eq, clean, normMobile, validMobile, validEmail } from '../../_lib/book-core.js';
import { cnsToken, publicCnsUser } from '../../_lib/cns-core.js';

const bool = v => v === true || v === 'true' || v === 'yes' || v === 1 || v === '1';

export async function onRequestPost(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY', 'SESSION_SECRET']);
  if (notCfg) return notCfg;
  const b = await body(request), info = clientInfo(request);
  if (!(await throttle(env, 'cnsreg:' + info.ip, 5, 30))) return fail('Too many attempts. Please wait a few minutes.', 429, 'rate');

  const name = clean(b.name || b.full_name, 80), email = clean(b.email, 120).toLowerCase(), mobile = normMobile(b.mobile), pass = String(b.password || '');
  const rank = parseInt(b.rank, 10), dob = clean(b.dob, 12), gender = clean(b.gender, 20), category = clean(b.category, 40);
  if (name.length < 2) return fail('Please enter your name.');
  if (!validEmail(email)) return fail('Enter a valid email address.');
  if (!validMobile(mobile)) return fail('Mobile must be a valid 10-digit number.');
  if (pass.length < 6 || pass.length > 100) return fail('Password must be 6 to 100 characters.');
  if (!(rank > 0 && rank < 10000000)) return fail('Rank is required.');
  if (!dob || !category) return fail('Please fill all mandatory fields.');
  if (await one(env, 'counseling_users', 'email=' + eq(email) + '&select=id')) return fail('Email already registered. Please log in.', 409, 'exists');

  const r = await insert(env, 'counseling_users', {
    full_name: name, email, mobile, password_hash: pass, dob, gender: gender || null, category,
    diploma_haryana: bool(b.diploma_haryana), resident_haryana: bool(b.resident_haryana), rank
  });
  if (!r.ok || !r.data || !r.data[0]) return fail('Could not create the account. Please try again.', 500, 'db');
  const u = r.data[0];
  return json({ ok: true, user: publicCnsUser(u), token: await cnsToken(env, u) });
}
