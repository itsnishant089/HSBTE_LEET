/**
 * POST /api/coupon/redeem { code, product, mobile, before, after }
 * Called once a Premium / Ultra / Counselling purchase using a coupon has gone through. It re-checks every
 * rule and bumps the usage counter atomically (see redeem_coupon() in supabase_book.sql).
 * Book purchases are redeemed by the server itself (api/book/order.js, verify.js).
 */
import { json, fail, body, requireEnv, rpc, normMobile, clean, clientInfo, throttle } from '../../_lib/book-core.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY']);
  if (notCfg) return notCfg;
  const b = await body(request), info = clientInfo(request);
  if (!(await throttle(env, 'redeem:' + info.ip, 10, 60))) return fail('Too many attempts.', 429, 'rate');
  const product = ['premium', 'ultra', 'counseling'].includes(b.product) ? b.product : null;
  if (!product) return fail('Bad request.');
  const r = await rpc(env, 'redeem_coupon', {
    p_code: clean(b.code, 40).toUpperCase(), p_product: product, p_mobile: normMobile(b.mobile) || null,
    p_before: Math.round(+b.before || 0), p_after: Math.round(+b.after || 0)
  });
  return json({ ok: r.ok && r.data === true });
}
