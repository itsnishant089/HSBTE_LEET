/**
 * Counselling accounts / requests / chat — served by the server with the service key, so the browser (public key)
 * never reads or writes counselling personal data once sql/supabase_lockdown.sql has been run.
 * Session = signed token kept in sessionStorage (`counsel_token`), sent as "Authorization: Bearer …".
 */
import { fail, one, rest, rpc, eq, verifyToken, signToken, requireEnv } from './book-core.js';

export const CNS_HOURS = 12;
export const cnsToken = (env, user) => signToken(env.SESSION_SECRET, { k: 'cns', uid: String(user.id) }, CNS_HOURS);

/** returns { user } or throws a Response */
export async function cnsAuth(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY', 'SESSION_SECRET']);
  if (notCfg) throw notCfg;
  const p = await verifyToken(env.SESSION_SECRET, (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''));
  if (!p || p.k !== 'cns') throw fail('Please log in again.', 401, 'auth');
  const user = await one(env, 'counseling_users', 'id=' + eq(p.uid) + '&select=id,full_name,email,mobile,rank,category,gender,dob,diploma_haryana,resident_haryana,created_at');
  if (!user) throw fail('Please log in again.', 401, 'auth');
  return { user };
}
export const publicCnsUser = u => ({
  id: u.id, full_name: u.full_name, email: u.email, mobile: u.mobile, rank: u.rank, category: u.category,
  gender: u.gender, diploma_haryana: u.diploma_haryana, resident_haryana: u.resident_haryana
});
export async function hasPaid(env, userId) {
  const r = await rest(env, 'counseling_payments', 'user_id=' + eq(userId) + '&status=in.(paid,free_coupon)&select=id&limit=1');
  return !!(r.ok && Array.isArray(r.data) && r.data.length);
}
export async function checkCounselingLogin(env, email, pass) {
  const r = await rpc(env, 'counseling_login', { p_email: email, p_pass: pass });
  if (r.ok) return r.data || null;
  const u = await one(env, 'counseling_users', 'email=' + eq(email) + '&select=*');
  if (u && u.password_hash === pass) { delete u.password_hash; return u; }
  return null;
}
