/**
 * POST /api/pay/complete { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Verifies the signature AND the payment with Razorpay (amount, order, captured), then creates the account /
 * activates access / records the counselling payment. Idempotent (the webhook may have done it already).
 */
import { json, fail, body, requireEnv, throttle, clientInfo } from '../../_lib/book-core.js';
import { rzpSignatureOk, rzpCheckPayment, finalizeOrder, issuePremiumCookie, one, eq } from '../../_lib/pay-core.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY', 'SESSION_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET']);
  if (notCfg) return notCfg;
  const b = await body(request), info = clientInfo(request);
  if (!(await throttle(env, 'paydone:' + info.ip, 10, 80))) return fail('Too many attempts. Please wait a minute.', 429, 'rate');

  const orderId = String(b.razorpay_order_id || ''), payId = String(b.razorpay_payment_id || ''), sig = String(b.razorpay_signature || '');
  if (!/^order_\w+$/.test(orderId) || !/^pay_\w+$/.test(payId) || !sig) return fail('Missing payment details.');
  const order = await one(env, 'pay_orders', 'order_id=' + eq(orderId) + '&select=*');
  if (!order) return fail('Order not found.', 404, 'order');
  if (!(await rzpSignatureOk(env, orderId, payId, sig))) return fail('Payment signature mismatch.', 400, 'signature');

  let result = order.status === 'paid' ? order.result : null;
  if (!result) {
    if (!(await rzpCheckPayment(env, orderId, payId, order.final_paise))) {
      return fail('Payment could not be verified. If money was deducted, contact nishant@hsbteleet.com with payment id ' + payId + '.', 400, 'payment');
    }
    try { result = await finalizeOrder(env, order, { paymentId: payId, signature: sig }); }
    catch (e) { return fail((e.message || 'Could not activate your account') + ' Your payment id is ' + payId + ' — contact nishant@hsbteleet.com.', 500, 'finalize'); }
  }
  const headers = order.product === 'counseling' ? {} : { 'set-cookie': await issuePremiumCookie(env, { id: result.userId, mobile: result.mobile || order.mobile }) };
  return json({ ok: true, result, amount: order.final_paise }, 200, headers);
}
