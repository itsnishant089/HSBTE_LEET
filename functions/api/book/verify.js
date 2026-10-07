import { mailBookDone } from '../../_lib/mail.js';
import { cfg, json, fail, body, bookAuth, hmacHex, safeEqual, one, patch, rpc, eq, grantAccess, requireEnv } from '../../_lib/book-core.js';

export async function onRequestPost(context) {
  let a;
  try { a = await bookAuth(context); } catch (r) { return r; }
  const { env, request } = context, c = cfg(env), b = await body(request), u = a.user;
  const notCfg = requireEnv(env, ['RAZORPAY_KEY_SECRET', 'RAZORPAY_KEY_ID']);
  if (notCfg) return notCfg;

  const orderId = String(b.razorpay_order_id || ''), payId = String(b.razorpay_payment_id || ''), sig = String(b.razorpay_signature || '');
  if (!orderId || !payId || !sig) return fail('Missing payment details.');
  const p = await one(env, 'book_purchases', 'rzp_order_id=' + eq(orderId) + '&user_id=' + eq(u.id) + '&select=*');
  if (!p) return fail('Order not found.', 404, 'order');
  if (p.status === 'paid') return json({ ok: true, already: true });

  const expect = await hmacHex(env.RAZORPAY_KEY_SECRET, orderId + '|' + payId);
  if (!safeEqual(expect, sig)) return fail('Payment signature mismatch.', 400, 'signature');

  // double-check with Razorpay that the money was really captured for this exact amount
  const rp = await fetch('https://api.razorpay.com/v1/payments/' + encodeURIComponent(payId), {
    headers: { authorization: 'Basic ' + btoa(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET) }
  });
  const pay = await rp.json().catch(() => ({}));
  if (!rp.ok || pay.order_id !== orderId || pay.amount !== p.final_amount * 100 || !['captured', 'authorized'].includes(pay.status)) {
    return fail('Payment could not be verified. If money was deducted, contact support with payment id ' + payId + '.', 400, 'payment');
  }

  await patch(env, 'book_purchases', 'id=' + eq(p.id), { status: 'paid', rzp_payment_id: payId, paid_at: new Date().toISOString() });
  if (p.coupon) await rpc(env, 'redeem_coupon', { p_code: p.coupon, p_product: 'book', p_mobile: u.mobile, p_before: p.base_amount, p_after: p.final_amount });
  await grantAccess(env, c, u.id, p.plan);
  let emailed = false;
  try { emailed = await mailBookDone(env, u, p, { free: false }); } catch (e) { /* mail must never break a purchase */ }
  return json({ ok: true, plan: p.plan, emailed });
}
