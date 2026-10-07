/**
 * Server-side payments + sessions for Premium / Ultra Premium / Counselling.
 * Everything that decides "who paid" or "who may read the premium papers" happens here, with the service key —
 * the browser can no longer write payments or access rows once sql/supabase_lockdown.sql has been run.
 *
 * Env: MAIN_SUPABASE_URL, MAIN_SUPABASE_SERVICE_KEY, SESSION_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
 *      RAZORPAY_WEBHOOK_SECRET (optional prices: PREMIUM_PRICE, ULTRA_PRICE, COUNSELING_PRICE)
 */
import { mailOrderDone, mailEnabled } from './mail.js';
import {
  rest, rpc, one, insert, patch, eq, clean, normMobile, validMobile, validEmail,
  findCoupon, couponDiscount, couponLabel, signToken, verifyToken, hmacHex, safeEqual, b64u
} from './book-core.js';

export const COOKIE = 'hl_prem';
export const MEMBER_PERCENT = 50;
const enc = new TextEncoder(), dec = new TextDecoder();

export const prices = env => ({
  premium: +env.PREMIUM_PRICE || 69,
  ultra: +env.ULTRA_PRICE || 99,
  counseling: +env.COUNSELING_PRICE || 99
});

/* ---------------------------------------------------------------- cookie */
export function cookieHeader(token, maxAgeSec) {
  return COOKIE + '=' + token + '; Path=/; Max-Age=' + maxAgeSec + '; HttpOnly; Secure; SameSite=Lax';
}
export const clearCookieHeader = () => COOKIE + '=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax';
export function readCookie(request, name = COOKIE) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1);
  }
  return '';
}
export const SESSION_HOURS = 8;
export async function issuePremiumCookie(env, user) {
  const t = await signToken(env.SESSION_SECRET, { k: 'prem', uid: String(user.id), m: user.mobile }, SESSION_HOURS);
  return cookieHeader(t, SESSION_HOURS * 3600);
}

/* ------------------------------------------------------------ entitlement */
export async function hasActiveAccess(env, userId) {
  const a = await one(env, 'premium_access', 'user_id=' + eq(userId) + '&select=is_active');
  return !!(a && a.is_active);
}
export async function isUltraUser(env, user) {
  let u = await one(env, 'ultra_premium_users', 'user_id=' + eq(user.id) + '&select=id');
  if (!u && user.mobile) u = await one(env, 'ultra_premium_users', 'mobile=' + eq(user.mobile) + '&select=id');
  return !!u;
}
/**
 * Premium or Ultra member → 50% off counselling. NOT just a mobile number: the e-mail must match the member's
 * e-mail as well (or the visitor holds a valid Premium login cookie for that mobile).
 */
export async function isMemberMobile(env, mobile, email, cookieMobile) {
  if (!mobile) return false;
  const same = x => String(x || '').trim().toLowerCase() === String(email || '').trim().toLowerCase() && !!email;
  const loggedIn = !!cookieMobile && cookieMobile === mobile;
  const u = await one(env, 'premium_users', 'mobile=' + eq(mobile) + '&select=id,email');
  if (u && (loggedIn || same(u.email)) && (await hasActiveAccess(env, u.id))) return true;
  const ul = await one(env, 'ultra_premium_users', 'mobile=' + eq(mobile) + '&select=id,email');
  return !!(ul && (loggedIn || same(ul.email)));
}
export async function verifyStudent(env, mobile, pass) {
  const r = await rpc(env, 'premium_login', { p_mobile: mobile, p_pass: pass });
  if (r.ok) return r.data || null; // null = wrong mobile/password
  // login function not installed yet (before sql/supabase_security.sql) → plain comparison
  const u = await one(env, 'premium_users', 'mobile=' + eq(mobile) + '&select=id,mobile,email,full_name,password_hash');
  if (u && u.password_hash === pass) { delete u.password_hash; return u; }
  return null;
}

/* ------------------------------------------------- encrypted password at rest */
async function aesKey(env) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode('pay-pass|' + env.SESSION_SECRET));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function sealText(env, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(env), enc.encode(text));
  return b64u.enc(iv) + '.' + b64u.enc(ct);
}
export async function openText(env, sealed) {
  const [iv, ct] = String(sealed || '').split('.');
  if (!iv || !ct) return '';
  try { return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64u.dec(iv) }, await aesKey(env), b64u.dec(ct))); } catch (e) { return ''; }
}

/* ---------------------------------------------------------------- pricing */
/** returns amounts in RUPEES like the pages show them; final paise = Math.round(finalRs * 100) */
export async function priceQuote(env, { product, mobile, email, cookieMobile, couponCode }) {
  const P = prices(env);
  const base = P[product];
  if (!base) return { error: 'Unknown product.' };
  let member = false, afterMember = base;
  if (product === 'counseling' && (await isMemberMobile(env, mobile, email, cookieMobile))) { member = true; afterMember = base * (100 - MEMBER_PERCENT) / 100; }
  let coupon = null, couponOff = 0, couponError = '';
  if (couponCode) {
    const f = await findCoupon(env, couponCode, product, mobile);
    if (f.ok) { coupon = f.coupon; couponOff = couponDiscount(f.coupon, Math.round(afterMember)); } else couponError = f.reason;
  }
  const finalRs = coupon ? Math.max(0, Math.round(afterMember) - couponOff) : afterMember;
  return {
    product, base, member, afterMember, coupon, couponOff, couponError,
    couponLabel: coupon ? couponLabel(coupon) : '', finalRs, finalPaise: Math.round(finalRs * 100)
  };
}

/* --------------------------------------------------------------- razorpay */
const rzpAuth = env => 'Basic ' + btoa(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET);
export async function rzpCreateOrder(env, amountPaise, receipt, notes) {
  const r = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: rzpAuth(env) },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: String(receipt).slice(0, 40), notes })
  });
  const o = await r.json().catch(() => ({}));
  return r.ok && o.id ? o : null;
}
export async function rzpCheckPayment(env, orderId, paymentId, amountPaise) {
  const r = await fetch('https://api.razorpay.com/v1/payments/' + encodeURIComponent(paymentId), { headers: { authorization: rzpAuth(env) } });
  const p = await r.json().catch(() => ({}));
  if (!r.ok || p.order_id !== orderId || p.amount !== amountPaise) return false;
  if (p.status === 'captured') return true;
  if (p.status === 'authorized') { // capture it, otherwise Razorpay refunds it automatically after a few days
    const c = await fetch('https://api.razorpay.com/v1/payments/' + encodeURIComponent(paymentId) + '/capture', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: rzpAuth(env) },
      body: JSON.stringify({ amount: amountPaise, currency: 'INR' })
    });
    return c.ok;
  }
  return false;
}
export async function rzpSignatureOk(env, orderId, paymentId, sig) {
  return safeEqual(await hmacHex(env.RAZORPAY_KEY_SECRET, orderId + '|' + paymentId), String(sig || ''));
}

/* ---------------------------------------------------- finalising an order */
/**
 * Creates / activates everything for a paid (or 100%-off) order. Safe to call twice (browser + webhook).
 * order = row of pay_orders (or an equivalent object for free orders).
 */
export async function finalizeOrder(env, order, { paymentId, signature, redeemed = false }) {
  const free = order.final_paise === 0;
  const payRef = paymentId || ('COUPON_' + (order.coupon || 'FREE') + '_' + order.mobile + '_' + Date.now().toString(36));
  const status = free ? 'free_coupon' : 'paid';
  let result;

  if (order.product === 'counseling') {
    const uid = order.user_id;
    const dup = !free && (await one(env, 'counseling_payments', 'razorpay_payment_id=' + eq(payRef) + '&select=id'));
    if (!dup) {
      const r = await insert(env, 'counseling_payments', { user_id: uid, razorpay_payment_id: payRef, amount: order.final_paise, status, coupon_used: order.coupon || null });
      if (!r.ok) throw new Error('Could not record the payment.');
    }
    result = { product: 'counseling', userId: uid };
  } else {
    // premium / ultra
    let user = await one(env, 'premium_users', 'mobile=' + eq(order.mobile) + '&select=id,mobile,email,full_name');
    if (!user) {
      const password = await openText(env, order.enc_pass);
      if (!password) throw new Error('Registration data expired.');
      const r = await insert(env, 'premium_users', { mobile: order.mobile, email: order.email, password_hash: password, full_name: order.full_name });
      if (!r.ok || !r.data || !r.data[0]) {
        user = await one(env, 'premium_users', 'mobile=' + eq(order.mobile) + '&select=id,mobile,email,full_name'); // race
        if (!user) throw new Error('Could not create the account.');
      } else user = { id: r.data[0].id, mobile: order.mobile, email: order.email, full_name: order.full_name };
    }
    let pay = await one(env, 'premium_payments', 'razorpay_payment_id=' + eq(payRef) + '&select=id');
    if (!pay) {
      const r = await insert(env, 'premium_payments', {
        user_id: user.id, razorpay_payment_id: payRef, razorpay_order_id: order.order_id || null, razorpay_signature: signature || null,
        amount: order.final_paise, status, coupon_used: order.coupon || null, receipt: payRef
      });
      if (!r.ok || !r.data || !r.data[0]) throw new Error('Could not record the payment.');
      pay = r.data[0];
    }
    const acc = await one(env, 'premium_access', 'user_id=' + eq(user.id) + '&select=id');
    if (!acc) await insert(env, 'premium_access', { user_id: user.id, payment_id: pay.id, is_active: true });
    else await patch(env, 'premium_access', 'user_id=' + eq(user.id), { is_active: true, payment_id: pay.id });
    if (order.product === 'ultra') {
      const ul = await one(env, 'ultra_premium_users', 'user_id=' + eq(user.id) + '&select=id');
      if (!ul) await insert(env, 'ultra_premium_users', { user_id: user.id, mobile: order.mobile, full_name: order.full_name, email: order.email });
    }
    result = { product: order.product, userId: user.id, name: user.full_name, mobile: user.mobile, email: user.email };
  }

  if (order.coupon && !redeemed) {
    await rpc(env, 'redeem_coupon', { p_code: order.coupon, p_product: order.product, p_mobile: order.mobile || null, p_before: Math.round((order.base_paise || 0) / 100), p_after: Math.round(order.final_paise / 100) });
  }
  // claim the order (browser + webhook may both arrive: only the first one sends the e-mails)
  let claimed = true;
  if (order.id) {
    const up = await patch(env, 'pay_orders', 'id=' + eq(order.id) + '&status=neq.paid', { status: 'paid', payment_id: payRef, paid_at: new Date().toISOString(), result, enc_pass: null });
    claimed = !!(up.ok && up.data && up.data.length);
  }
  let emailed = false;
  if (claimed) {
    try { emailed = await mailOrderDone(env, order, { paymentId: payRef, free }); } catch (e) { emailed = false; }
    if (order.id && emailed) await patch(env, 'pay_orders', 'id=' + eq(order.id), { result: { ...result, emailed: true } });
  } else if (mailEnabled(env)) {
    emailed = true; // the other caller (webhook / browser) owns the e-mails — the page must not send its own EmailJS copy
  }
  return { ...result, emailed };
}

export { rest, one, insert, patch, eq, clean, normMobile, validMobile, validEmail, verifyToken };
