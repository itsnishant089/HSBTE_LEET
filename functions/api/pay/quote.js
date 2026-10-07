/**
 * POST /api/pay/quote { product, mobile?, coupon? }
 * The price the server will charge (used by the Counselling page for the Premium/Ultra member 50% discount).
 */
import { json, fail, body, requireEnv, throttle, clientInfo } from '../../_lib/book-core.js';
import { priceQuote, normMobile, clean, readCookie } from '../../_lib/pay-core.js';
import { verifyToken } from '../../_lib/book-core.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY']);
  if (notCfg) return notCfg;
  const b = await body(request), info = clientInfo(request);
  if (!(await throttle(env, 'payquote:' + info.ip, 20, 300))) return fail('Too many attempts.', 429, 'rate');
  if (!['premium', 'ultra', 'counseling'].includes(b.product)) return fail('Bad request.');
  const pc = env.SESSION_SECRET ? await verifyToken(env.SESSION_SECRET, readCookie(request)) : null;
  const q = await priceQuote(env, { product: b.product, mobile: normMobile(b.mobile) || null, email: clean(b.email, 120), cookieMobile: pc && pc.k === 'prem' ? pc.m : '', couponCode: b.coupon ? clean(b.coupon, 40) : '' });
  if (q.error) return fail(q.error);
  return json({ ok: true, base: q.base, member: q.member, afterMember: q.afterMember, finalRs: q.finalRs, coupon: q.coupon ? q.coupon.code : null, couponError: q.couponError });
}
