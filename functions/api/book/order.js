import { mailBookDone } from '../../_lib/mail.js';
import { cfg, json, fail, body, bookAuth, quote, hasFull, hasNotes, insert, patch, rpc, eq, grantAccess, requireEnv, throttle } from '../../_lib/book-core.js';

export async function onRequestPost(context) {
  let a;
  try { a = await bookAuth(context); } catch (r) { return r; }
  const { env, request } = context, c = cfg(env), b = await body(request), u = a.user;
  if (b.plan === 'notes' ? hasNotes(u) : hasFull(u)) return fail('You already have access.', 409, 'owned');
  if (!(await throttle(env, 'order:' + u.id, 6, 30))) return fail('Too many attempts. Please wait.', 429, 'rate');

  const q = await quote(env, c, u, b.plan, b.coupon);
  if (b.coupon && q.couponError) return fail(q.couponError, 400, 'coupon');
  const coupon = q._coupon;

  // 100% off → grant straight away, no payment
  if (q.final === 0) {
    const ok = coupon ? await rpc(env, 'redeem_coupon', { p_code: coupon.code, p_product: 'book', p_mobile: u.mobile, p_before: q.afterUltra, p_after: 0 }) : { data: true };
    if (coupon && ok.data !== true) return fail('This coupon can no longer be used.', 400, 'coupon');
    await insert(env, 'book_purchases', { user_id: u.id, plan: q.plan, base_amount: q.base, discount: q.base, final_amount: 0, coupon: coupon && coupon.code, ultra_discount: q.ultra, status: 'free', paid_at: new Date().toISOString() });
    await grantAccess(env, c, u.id, q.plan);
    let emailed = false;
    try { emailed = await mailBookDone(env, u, { plan: q.plan, final_amount: 0, coupon: coupon && coupon.code, ultra_discount: q.ultra }, { free: true }); } catch (e) { /* ignore */ }
    return json({ ok: true, free: true, emailed });
  }

  const notCfg = requireEnv(env, ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET']);
  if (notCfg) return notCfg;
  const rp = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Basic ' + btoa(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET) },
    body: JSON.stringify({ amount: q.final * 100, currency: 'INR', receipt: 'book_' + u.id.slice(0, 8) + '_' + Date.now(), notes: { user: u.id, plan: q.plan, coupon: coupon ? coupon.code : '' } })
  });
  const order = await rp.json().catch(() => ({}));
  if (!rp.ok || !order.id) return fail('Could not start the payment. Please try again.', 502, 'payment');

  await insert(env, 'book_purchases', {
    user_id: u.id, plan: q.plan, base_amount: q.base, discount: q.base - q.final, final_amount: q.final,
    coupon: coupon && coupon.code, ultra_discount: q.ultra, rzp_order_id: order.id, status: 'created'
  });
  return json({ ok: true, orderId: order.id, amount: q.final * 100, key: env.RAZORPAY_KEY_ID, name: u.full_name, email: u.email, contact: u.mobile, plan: q.plan });
}
