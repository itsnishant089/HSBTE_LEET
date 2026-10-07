/**
 * POST /api/coupon/validate  { code, product: premium|ultra|counseling|book, mobile?, amount }
 * Coupon rules live in the `coupons` table (managed from the admin portal) — nothing is hard-coded in the browser.
 */
import { json, fail, body, requireEnv, findCoupon, couponDiscount, couponLabel, normMobile, clientInfo, throttle } from '../../_lib/book-core.js';

const PRODUCTS = ['premium', 'ultra', 'counseling', 'book'];

export async function onRequestPost(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY']);
  if (notCfg) return notCfg;
  const b = await body(request), info = clientInfo(request);
  if (!(await throttle(env, 'coupon:' + info.ip, 20, 200))) return fail('Too many attempts. Please wait a minute.', 429, 'rate');

  const product = PRODUCTS.includes(b.product) ? b.product : null;
  const amount = Math.max(0, Math.round(+b.amount || 0));
  if (!product || !amount) return fail('Bad request.');
  const mobile = normMobile(b.mobile) || null;

  const f = await findCoupon(env, b.code, product, mobile);
  if (!f.ok) return json({ ok: false, error: f.reason });
  const off = couponDiscount(f.coupon, amount);
  return json({
    ok: true, code: f.coupon.code, kind: f.coupon.kind, label: couponLabel(f.coupon),
    discount: off, final: amount - off, free: amount - off === 0
  });
}
