/**
 * Server-side e-mails (Resend). Used for: Premium / Ultra / Counselling / Book purchases → customer + admin.
 * Because the SERVER sends them, the mails go out even when the student closes the tab right after paying.
 *
 * Env:  RESEND_API_KEY   (Resend → API Keys; the domain hsbteleet.com is already verified in Resend)
 *       MAIL_FROM        optional, default  "HSBTE LEET <noreply@hsbteleet.com>"
 *       ADMIN_EMAIL      optional, default  nishant@hsbteleet.com  (gets the "new purchase" alerts)
 * Without RESEND_API_KEY nothing is sent and callers get `false`, so the page falls back to its EmailJS code.
 */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const mailEnabled = env => !!env.RESEND_API_KEY;
const adminTo = env => env.ADMIN_EMAIL || 'nishant@hsbteleet.com';

export async function sendMail(env, { to, subject, html, replyTo }) {
  if (!env.RESEND_API_KEY || !to) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM || 'HSBTE LEET <noreply@hsbteleet.com>', to: [].concat(to), subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(9000) : undefined
    });
    return r.ok;
  } catch (e) { return false; }
}

const shell = (title, body) =>
  '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">' +
  '<div style="background:linear-gradient(135deg,#0a1628,#1a56db);padding:26px 28px;text-align:center;border-radius:12px 12px 0 0">' +
  '<h1 style="color:#fff;font-size:20px;margin:0">' + title + '</h1></div>' +
  '<div style="padding:22px 28px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;color:#334155;font-size:14px;line-height:1.7">' + body + '</div>' +
  '<p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:14px">HSBTE LEET · hsbteleet.com · nishant@hsbteleet.com</p></div>';
const rows = list => '<div style="background:#f8fafc;border-radius:10px;padding:12px 16px;margin:14px 0;font-size:13px">' +
  list.filter(Boolean).map(([k, v]) => '<b>' + esc(k) + ':</b> ' + esc(v)).join('<br>') + '</div>';
const btn = (href, label) => '<p style="text-align:center;margin:18px 0 4px"><a href="' + esc(href) + '" style="background:#1a56db;color:#fff;text-decoration:none;padding:12px 26px;border-radius:10px;font-weight:bold;display:inline-block">' + esc(label) + '</a></p>';
const rs = paise => '₹' + (Math.round(paise) / 100);

/** Premium / Ultra / Counselling order finished. Returns true when the customer mail was sent. */
export async function mailOrderDone(env, order, { paymentId, free }) {
  if (!mailEnabled(env)) return false;
  const label = order.product === 'ultra' ? 'Ultra Premium' : order.product === 'premium' ? 'Premium' : 'Personalized Counselling';
  const amount = free ? '₹0 (free coupon)' : rs(order.final_paise);
  const details = rows([
    ['Name', order.full_name], ['Mobile', order.mobile], ['Email', order.email], ['Plan', label],
    ['Amount paid', amount + (order.coupon ? ' · coupon ' + order.coupon : '')], ['Payment ID', free ? '—' : paymentId]
  ]);
  const customer = order.product === 'counseling'
    ? shell('Counselling request unlocked 🎯', '<p>Hi <b>' + esc(order.full_name) + '</b>,</p><p>Your payment is confirmed. Please complete the counselling form (rank, branch and college choices) and our expert will guide you.</p>' + details + btn('https://hsbteleet.com/counseling', 'Fill the counselling form') + '<p>Questions? Just reply to this e-mail.</p>')
    : shell('Welcome to HSBTE LEET ' + label + '! 🎉', '<p>Hi <b>' + esc(order.full_name) + '</b>,</p><p>Your <b>' + label + '</b> access is now active on hsbteleet.com. Log in with your mobile number and the password you chose.</p>' + details + btn('https://hsbteleet.com/premium-login', 'Log in to my account') + '<p>Need help? Reply to this e-mail or WhatsApp 9992507270.</p>');
  const [sent] = await Promise.all([
    sendMail(env, { to: order.email, subject: order.product === 'counseling' ? 'Counselling payment confirmed — HSBTE LEET' : 'Welcome to HSBTE LEET ' + label + ' — access is active', html: customer, replyTo: adminTo(env) }),
    sendMail(env, { to: adminTo(env), subject: '💰 New ' + label + ' purchase — ' + order.full_name + ' (' + amount + ')', html: shell('New ' + label + ' purchase', details), replyTo: order.email })
  ]);
  return sent;
}

/** Book purchase finished (paid or free coupon). */
export async function mailBookDone(env, user, purchase, { free }) {
  if (!mailEnabled(env)) return false;
  const pdf = purchase.plan === 'pdf';
  const details = rows([
    ['Name', user.full_name], ['Mobile', user.mobile], ['Email', user.email],
    ['Plan', pdf ? 'Reader + PDF copy by e-mail' : 'Online Reader'],
    ['Amount paid', free ? '₹0 (free coupon)' : '₹' + purchase.final_amount + (purchase.coupon ? ' · coupon ' + purchase.coupon : '')],
    ['Ultra discount', purchase.ultra_discount ? 'yes' : '']
  ]);
  const customer = shell('Your Haryana LEET Book is unlocked 📘',
    '<p>Hi <b>' + esc(user.full_name) + '</b>,</p><p>Thank you! You can now read all <b>1,633 pages</b> in our secure reader (up to 2 devices).</p>' + details +
    btn('https://hsbteleet.com/book-login?next=read', 'Open the book') +
    (pdf ? '<p><b>Your personal PDF copy</b> (with your name &amp; mobile on every page) will be e-mailed to you within 24 hours.</p>' : '') +
    '<p style="font-size:12px;color:#64748b">The book is licensed to you for personal use only. Copying, screenshots or sharing lead to suspension (see Terms &amp; Conditions).</p>');
  const adminHtml = shell(pdf ? '📕 New book order — SEND THE PDF' : 'New book order', details +
    (pdf ? '<p><b>Action needed:</b> make the personal PDF (<code>scripts/make_watermarked_pdf.py</code>), e-mail it to the student and press “Mark delivered” in Admin → Book Purchases.</p>' : ''));
  const [sent] = await Promise.all([
    sendMail(env, { to: user.email, subject: 'Your Haryana LEET Book is unlocked', html: customer, replyTo: adminTo(env) }),
    sendMail(env, { to: adminTo(env), subject: (pdf ? '📕 PDF TO SEND — ' : '💰 Book purchase — ') + user.full_name + (free ? ' (free coupon)' : ' (₹' + purchase.final_amount + ')'), html: adminHtml, replyTo: user.email })
  ]);
  return sent;
}
