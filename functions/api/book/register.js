import { cfg, json, fail, body, requireEnv, rest, one, insert, eq, hashPassword, normMobile, validMobile, validEmail, clean, clientInfo, registerDevice, issueToken, publicUser, throttle } from '../../_lib/book-core.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY', 'SESSION_SECRET']);
  if (notCfg) return notCfg;
  const c = cfg(env), b = await body(request), info = clientInfo(request);

  if (!(await throttle(env, 'register:' + info.ip, 6, 40))) return fail('Too many attempts. Please try again later.', 429, 'rate');

  const name = clean(b.name, 80), mobile = normMobile(b.mobile), email = clean(b.email, 120).toLowerCase();
  const password = String(b.password || '');
  if (name.length < 3) return fail('Please enter your full name.');
  if (!validMobile(mobile)) return fail('Enter a valid 10-digit Indian mobile number.');
  if (!validEmail(email)) return fail('Enter a valid email address.');
  if (password.length < 6 || password.length > 100) return fail('Password must be 6 to 100 characters.');
  if (b.accept !== true) return fail('Please accept the Terms & Conditions to continue.', 400, 'terms');

  const dupe = await rest(env, 'book_users', 'or=(mobile.eq.' + mobile + ',email.eq.' + encodeURIComponent(email) + ')&select=id&limit=1');
  if (dupe.ok && dupe.data && dupe.data.length) return fail('This mobile number or email is already registered. Please log in.', 409, 'exists');

  const ins = await insert(env, 'book_users', {
    full_name: name, mobile, email, pass_hash: await hashPassword(password),
    city: clean(b.city, 60), college: clean(b.college, 100), branch: clean(b.branch, 60), last_login: new Date().toISOString()
  });
  if (!ins.ok || !ins.data || !ins.data[0]) return fail('Could not create the account. Please try again.', 500, 'db');
  const user = ins.data[0];

  const dev = await registerDevice(env, c, user, b, info);
  if (dev.error) return dev.error;
  const token = await issueToken(env, c, user, dev.deviceId);
  return json({ ok: true, token, user: publicUser(user, c) });
}
