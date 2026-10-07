/**
 * Razorpay webhook (safety net when the buyer closes the tab right after paying).
 * Razorpay Dashboard → Webhooks → URL: https://hsbteleet.com/api/book/webhook
 * Events: payment.captured, order.paid     Secret = RAZORPAY_WEBHOOK_SECRET
 * Handles Book orders AND Premium / Ultra / Counselling orders (pay_orders).
 */
import { mailBookDone } from '../../_lib/mail.js';
import { finalizeOrder, rzpCheckPayment } from '../../_lib/pay-core.js';
import { cfg, json, fail, requireEnv, hmacHex, safeEqual, one, patch, rpc, eq, grantAccess } from '../../_lib/book-core.js';

export async function onRequestPost(context) {
  const { env, request } = context, c = cfg(env);
  const notCfg = requireEnv(env, ['RAZORPAY_WEBHOOK_SECRET', 'MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY']);
  if (notCfg) return notCfg;
  const raw = await request.text();
  const sig = request.headers.get('x-razorpay-signature') || '';
  if (!safeEqual(await hmacHex(env.RAZORPAY_WEBHOOK_SECRET, raw), sig)) return fail('bad signature', 400, 'signature');

  let evt = {};
  try { evt = JSON.parse(raw); } catch (e) { return fail('bad json'); }
  const pay = evt.payload && evt.payload.payment && evt.payload.payment.entity;
  if (!pay || !pay.order_id) return json({ ok: true, ignored: true });

  // Premium / Ultra / Counselling orders (created by /api/pay/start)
  const po = await one(env, 'pay_orders', 'order_id=' + eq(pay.order_id) + '&select=*');
  if (po) {
    if (po.status === 'paid' || pay.amount !== po.final_paise || !['captured', 'authorized'].includes(pay.status)) return json({ ok: true, ignored: true });
    if (!(await rzpCheckPayment(env, pay.order_id, pay.id, po.final_paise))) return json({ ok: true, ignored: true });
    try { await finalizeOrder(env, po, { paymentId: pay.id }); } catch (e) { return fail('could not finalize', 500, 'finalize'); }
    return json({ ok: true, payOrder: true });
  }

  const p = await one(env, 'book_purchases', 'rzp_order_id=' + eq(pay.order_id) + '&select=*');
  if (!p || p.status === 'paid' || p.status === 'free') return json({ ok: true, ignored: true });
  if (pay.amount !== p.final_amount * 100 || !['captured', 'authorized'].includes(pay.status)) return json({ ok: true, ignored: true });

  const user = await one(env, 'book_users', 'id=' + eq(p.user_id) + '&select=full_name,mobile,email');
  const claim = await patch(env, 'book_purchases', 'id=' + eq(p.id) + '&status=neq.paid', { status: 'paid', rzp_payment_id: pay.id, paid_at: new Date().toISOString() });
  if (claim.ok && Array.isArray(claim.data) && !claim.data.length) return json({ ok: true, ignored: true }); // browser verify got there first
  if (p.coupon && user) await rpc(env, 'redeem_coupon', { p_code: p.coupon, p_product: 'book', p_mobile: user.mobile, p_before: p.base_amount, p_after: p.final_amount });
  await grantAccess(env, c, p.user_id, p.plan);
  try { if (user) await mailBookDone(env, user, p, { free: false }); } catch (e) { /* ignore */ }
  return json({ ok: true });
}
