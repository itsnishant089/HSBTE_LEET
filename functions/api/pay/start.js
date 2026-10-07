/**
 * POST /api/pay/start
 *   premium / ultra : { product, name, mobile, email, password, coupon? }
 *   counseling      : { product:'counseling', userId, coupon? }
 * The SERVER decides the price (member discount + coupon), creates the Razorpay order and remembers the
 * registration data (password encrypted). 100%-off coupons are completed right here.
 * Response: { ok, free:true, result } or { ok, orderId, amount(paise), key, finalRs, ... }
 */
import { json, fail, body, requireEnv, throttle, clientInfo, rpc, verifyToken } from '../../_lib/book-core.js';
import {
  priceQuote, rzpCreateOrder, sealText, finalizeOrder, issuePremiumCookie,
  one, insert, eq, clean, normMobile, validMobile, validEmail, readCookie
} from '../../_lib/pay-core.js';

const PRODUCTS = ['premium', 'ultra', 'counseling'];

export async function onRequestPost(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY', 'SESSION_SECRET']);
  if (notCfg) return notCfg;
  const b = await body(request), info = clientInfo(request);
  if (!(await throttle(env, 'paystart:' + info.ip, 8, 60))) return fail('Too many attempts. Please wait a minute.', 429, 'rate');

  const product = PRODUCTS.includes(b.product) ? b.product : null;
  if (!product) return fail('Bad request.');
  const order = { product, coupon: null, final_paise: 0, base_paise: 0 };

  if (product === 'counseling') {
    // logged-in student (token) wins over a client-supplied id
    const tk = await verifyToken(env.SESSION_SECRET, (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''));
    const cid = tk && tk.k === 'cns' ? tk.uid : clean(b.userId, 64);
    const u = await one(env, 'counseling_users', 'id=' + eq(cid) + '&select=id,full_name,email,mobile');
    if (!u) return fail('Account not found. Please register again.', 404, 'user');
    Object.assign(order, { user_id: String(u.id), full_name: u.full_name, email: u.email, mobile: normMobile(u.mobile) });
  } else {
    const mobile = normMobile(b.mobile), email = clean(b.email, 120), name = clean(b.name || b.full_name, 80), pass = String(b.password || '');
    if (name.length < 2) return fail('Please enter your name.');
    if (!validMobile(mobile)) return fail('Enter a valid 10-digit mobile number.');
    if (!validEmail(email)) return fail('Enter a valid email address.');
    if (pass.length < 6 || pass.length > 100) return fail('Password must be 6 to 100 characters.');
    if (await one(env, 'premium_users', 'mobile=' + eq(mobile) + '&select=id')) return fail('This mobile number is already registered. Please log in.', 409, 'exists');
    Object.assign(order, { full_name: name, email, mobile, enc_pass: await sealText(env, pass) });
  }

  const pc = await verifyToken(env.SESSION_SECRET, readCookie(request));
  const q = await priceQuote(env, { product, mobile: order.mobile, email: order.email, cookieMobile: pc && pc.k === 'prem' ? pc.m : '', couponCode: b.coupon ? clean(b.coupon, 40) : '' });
  if (q.error) return fail(q.error);
  if (b.coupon && q.couponError) return fail(q.couponError, 400, 'coupon');
  order.coupon = q.coupon ? q.coupon.code : null;
  order.base_paise = Math.round(q.base * 100);
  order.final_paise = q.finalPaise;
  const common = { finalRs: q.finalRs, member: q.member, couponLabel: q.couponLabel };

  // ── 100% off: nothing to pay ──
  if (order.final_paise === 0) {
    if (!order.coupon) return fail('Nothing to pay without a coupon.');
    const ok = await rpc(env, 'redeem_coupon', { p_code: order.coupon, p_product: product, p_mobile: order.mobile, p_before: Math.round(q.afterMember), p_after: 0 });
    if (ok.data !== true) return fail('This coupon can no longer be used.', 400, 'coupon');
    let result;
    try { result = await finalizeOrder(env, order, { redeemed: true }); } catch (e) { return fail(e.message || 'Could not activate.', 500, 'finalize'); }
    const headers = product === 'counseling' ? {} : { 'set-cookie': await issuePremiumCookie(env, { id: result.userId, mobile: result.mobile }) };
    return json({ ok: true, free: true, result, ...common }, 200, headers);
  }

  // ── paid ──
  const notRz = requireEnv(env, ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET']);
  if (notRz) return notRz;
  const rz = await rzpCreateOrder(env, order.final_paise, product.slice(0, 4) + '_' + Date.now().toString(36), { product, mobile: order.mobile, coupon: order.coupon || '' });
  if (!rz) return fail('Could not start the payment. Please try again.', 502, 'payment');
  const row = await insert(env, 'pay_orders', {
    order_id: rz.id, product, full_name: order.full_name, mobile: order.mobile, email: order.email,
    enc_pass: order.enc_pass || null, user_id: order.user_id || null, coupon: order.coupon,
    base_paise: order.base_paise, final_paise: order.final_paise, status: 'created'
  });
  if (!row.ok) return fail('Payment service is not set up yet (pay_orders table missing).', 503, 'not_configured');
  return json({ ok: true, orderId: rz.id, amount: order.final_paise, key: env.RAZORPAY_KEY_ID, name: order.full_name, email: order.email, contact: order.mobile, ...common });
}
