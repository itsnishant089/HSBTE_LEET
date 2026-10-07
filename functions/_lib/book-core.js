/**
 * Shared server code for the Haryana LEET Book, coupons, device log and admin API.
 * Runs on Cloudflare Pages Functions (Workers runtime: fetch + WebCrypto only).
 *
 * Environment variables (Cloudflare Pages → Settings → Environment variables):
 *   MAIN_SUPABASE_URL, MAIN_SUPABASE_SERVICE_KEY   service_role key — NEVER put it in browser code
 *   SESSION_SECRET                       long random string (signs login tokens)
 *   ADMIN_PASSWORD                       admin portal password
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (+ optional RAZORPAY_WEBHOOK_SECRET)
 * Optional: BOOK_MAX_DEVICES (2), BOOK_ACCESS_UNTIL (2027-09-30), BOOK_MRP (999), BOOK_PRICE (399),
 *           BOOK_ULTRA_PRICE (299), BOOK_PDF_PRICE (499), BOOK_PDF_ULTRA_PRICE (399)
 * Optional R2 binding BOOK_R2 (preferred for page images; Supabase Storage is the fallback).
 */

/* ------------------------------------------------------------------ config */
export function cfg(env) {
  const n = (v, d) => (v !== undefined && v !== '' && !isNaN(+v) ? +v : d);
  return {
    mrp: n(env.BOOK_MRP, 999),
    price: n(env.BOOK_PRICE, 399),
    ultraPrice: n(env.BOOK_ULTRA_PRICE, 299),
    pdfPrice: n(env.BOOK_PDF_PRICE, 499),
    pdfUltraPrice: n(env.BOOK_PDF_ULTRA_PRICE, 399),
    maxDevices: n(env.BOOK_MAX_DEVICES, 2),
    accessUntil: env.BOOK_ACCESS_UNTIL || '2027-09-30',
    pageMinLimit: n(env.BOOK_PAGES_PER_MIN, 45),
    pageDayLimit: n(env.BOOK_PAGES_PER_DAY, 900),
    suspendAt: n(env.BOOK_SUSPEND_POINTS, 6),
    banAt: n(env.BOOK_BAN_POINTS, 12),
    tokenHours: n(env.BOOK_TOKEN_HOURS, 12)
  };
}

export const VIOLATION_POINTS = {
  screenshot: 3, printscreen: 3, snip: 3, devtools: 2, print: 2, save: 1,
  copy: 0, cut: 0, 'rate-limit': 2, 'multi-device': 3, tamper: 3, other: 1
};

/* ---------------------------------------------------------------- responses */
const SEC_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff'
};
export const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { ...SEC_HEADERS, ...extra } });
export const fail = (message, status = 400, code = 'error', extra = {}) =>
  json({ ok: false, error: message, code, ...extra }, status);

export async function body(request) {
  try { const t = await request.text(); return t ? JSON.parse(t) : {}; } catch (e) { return {}; }
}

export function requireEnv(env, keys) {
  const missing = keys.filter(k => !env[k]);
  if (missing.length) return fail('Server is not configured yet (' + missing.join(', ') + ').', 503, 'not_configured');
  return null;
}

/* ----------------------------------------------------------------- Supabase */
export async function sb(env, path, { method = 'GET', data, headers = {}, prefer } = {}) {
  const res = await fetch(env.MAIN_SUPABASE_URL.replace(/\/$/, '') + path, {
    method,
    headers: {
      apikey: env.MAIN_SUPABASE_SERVICE_KEY,
      authorization: 'Bearer ' + env.MAIN_SUPABASE_SERVICE_KEY,
      'content-type': 'application/json',
      ...(prefer ? { prefer } : {}),
      ...headers
    },
    body: data === undefined ? undefined : JSON.stringify(data)
  });
  const text = await res.text();
  let out = null;
  try { out = text ? JSON.parse(text) : null; } catch (e) { out = text; }
  return { ok: res.ok, status: res.status, data: out, headers: res.headers };
}
export const rest = (env, table, query = '', opts = {}) => sb(env, '/rest/v1/' + table + (query ? '?' + query : ''), opts);
export const rpc = (env, fn, args) => sb(env, '/rest/v1/rpc/' + fn, { method: 'POST', data: args });
export const eq = v => 'eq.' + encodeURIComponent(v);
export async function one(env, table, query) {
  const r = await rest(env, table, query + '&limit=1');
  return r.ok && Array.isArray(r.data) ? r.data[0] || null : null;
}
export async function insert(env, table, row) {
  return rest(env, table, '', { method: 'POST', data: row, prefer: 'return=representation' });
}
export async function patch(env, table, query, row) {
  return rest(env, table, query, { method: 'PATCH', data: row, prefer: 'return=representation' });
}

/* ------------------------------------------------------------------- crypto */
const enc = new TextEncoder();
export const b64u = {
  enc: buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
};
const hmacKey = (secret, usage = ['sign']) => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usage);
export async function hmacHex(secret, text) {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(text));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
export async function sha256hex(text) {
  const h = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function signToken(secret, payload, hours = 12) {
  const p = { ...payload, exp: Math.floor(Date.now() / 1000) + hours * 3600 };
  const part = b64u.enc(enc.encode(JSON.stringify(p)));
  const sig = b64u.enc(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(part)));
  return part + '.' + sig;
}
export async function verifyToken(secret, token) {
  try {
    const [part, sig] = String(token || '').split('.');
    if (!part || !sig) return null;
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret, ['verify']), b64u.dec(sig), enc.encode(part));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(b64u.dec(part)));
    return p.exp && p.exp > Date.now() / 1000 ? p : null;
  } catch (e) { return null; }
}
const ITER = 100000;
export async function hashPassword(pw, salt) {
  salt = salt || crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER }, key, 256);
  return 'pbkdf2$' + ITER + '$' + b64u.enc(salt) + '$' + b64u.enc(bits);
}
export async function verifyPassword(pw, stored) {
  try {
    const [, it, salt] = String(stored).split('$');
    const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b64u.dec(salt), iterations: +it }, key, 256);
    return safeEqual('pbkdf2$' + it + '$' + salt + '$' + b64u.enc(bits), stored);
  } catch (e) { return false; }
}
export async function pseudoUuid(text) {
  const h = await sha256hex(text);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/* ------------------------------------------------------------------ helpers */
export const normMobile = m => String(m || '').replace(/\D/g, '').slice(-10);
export const validMobile = m => /^[6-9]\d{9}$/.test(m);
export const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '')) && String(e).length <= 120;
export const clean = (s, n = 120) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
export function clientInfo(request) {
  return {
    ip: request.headers.get('cf-connecting-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown',
    ua: (request.headers.get('user-agent') || '').slice(0, 300)
  };
}
export function deviceLabel(ua) {
  const os = /Windows/i.test(ua) ? 'Windows' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iOS/i.test(ua) ? 'iOS' : /Mac OS/i.test(ua) ? 'Mac' : /Linux/i.test(ua) ? 'Linux' : 'Unknown OS';
  const br = /Edg\//i.test(ua) ? 'Edge' : /OPR\//i.test(ua) ? 'Opera' : /Chrome\//i.test(ua) ? 'Chrome' : /Firefox\//i.test(ua) ? 'Firefox' : /Safari\//i.test(ua) ? 'Safari' : 'Browser';
  return os + ' · ' + br;
}
export const maskMobile = m => (m ? m.slice(0, 2) + '******' + m.slice(-2) : '');
export function publicUser(u, c) {
  const now = Date.now();
  const full = !!u.has_full && (!u.access_until || new Date(u.access_until).getTime() > now);
  return {
    id: u.id, name: u.full_name, mobile: maskMobile(u.mobile), email: u.email, status: u.status, reason: u.status_reason || '',
    hasFull: full, plan: u.plan || null, accessUntil: u.access_until || null, points: u.violation_points || 0,
    suspendAt: c.suspendAt, banAt: c.banAt
  };
}

/* ------------------------------------------------------------------- auth */
export async function bookAuth(context, { allowRestricted = false } = {}) {
  const { request, env } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY', 'SESSION_SECRET']);
  if (notCfg) throw notCfg;
  const h = request.headers.get('authorization') || '';
  const payload = await verifyToken(env.SESSION_SECRET, h.replace(/^Bearer\s+/i, ''));
  if (!payload || payload.k !== 'book') throw fail('Please log in again.', 401, 'auth');
  const user = await one(env, 'book_users', 'id=' + eq(payload.uid) + '&select=*');
  if (!user) throw fail('Account not found.', 401, 'auth');
  if (!allowRestricted && user.status === 'banned') throw fail('This account has been banned. Contact support.', 403, 'banned', { reason: user.status_reason || '' });
  if (!allowRestricted && user.status === 'suspended') throw fail('This account is suspended pending review.', 403, 'suspended', { reason: user.status_reason || '' });
  const dev = await one(env, 'book_devices', 'user_id=' + eq(user.id) + '&device_id=' + eq(payload.did) + '&select=id,active,last_seen');
  if (!dev || !dev.active) throw fail('This device was signed out. Please log in again.', 401, 'device_revoked');
  if (Date.now() - new Date(dev.last_seen).getTime() > 5 * 60000) {
    patch(env, 'book_devices', 'id=' + eq(dev.id), { last_seen: new Date().toISOString() }).catch(() => {});
  }
  return { user, payload, device: dev };
}

export function hasFull(user) {
  return !!user.has_full && (!user.access_until || new Date(user.access_until).getTime() > Date.now());
}

export async function registerDevice(env, c, user, { deviceId, fp, replaceDevice }, info) {
  deviceId = clean(deviceId, 64);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(deviceId)) return { error: fail('Browser could not be identified. Please enable cookies/local storage.', 400, 'device') };
  const list = (await rest(env, 'book_devices', 'user_id=' + eq(user.id) + '&select=*&order=last_seen.desc')).data || [];
  const existing = list.find(d => d.device_id === deviceId);
  if (existing) {
    await patch(env, 'book_devices', 'id=' + eq(existing.id), { active: true, last_seen: new Date().toISOString(), logins: (existing.logins || 0) + 1, ip: info.ip, ua: info.ua, fp: clean(fp, 80) });
    return { deviceId };
  }
  const active = list.filter(d => d.active);
  if (active.length >= c.maxDevices) {
    if (replaceDevice && active.some(d => String(d.id) === String(replaceDevice))) {
      await patch(env, 'book_devices', 'id=' + eq(replaceDevice), { active: false });
    } else {
      return {
        error: fail('Device limit reached (' + c.maxDevices + ' devices). Sign out one device to continue.', 403, 'device_limit', {
          devices: active.map(d => ({ id: d.id, label: d.label, lastSeen: d.last_seen }))
        })
      };
    }
  }
  await insert(env, 'book_devices', { user_id: user.id, device_id: deviceId, fp: clean(fp, 80), ua: info.ua, ip: info.ip, label: deviceLabel(info.ua) });
  return { deviceId };
}

export async function issueToken(env, c, user, deviceId) {
  return signToken(env.SESSION_SECRET, { k: 'book', uid: user.id, did: deviceId }, c.tokenHours);
}

export async function throttle(env, key, perMin, perDay) {
  const r = await rpc(env, 'book_hit', { p_user: await pseudoUuid(key), p_min_limit: perMin, p_day_limit: perDay });
  return !(r.ok && r.data && r.data.ok === false);
}

/* ---------------------------------------------------------------- coupons */
export async function findCoupon(env, code, product, mobile) {
  code = clean(code, 40).toUpperCase();
  if (!code) return { ok: false, reason: 'Enter a coupon code.' };
  const c = await one(env, 'coupons', 'code=' + eq(code) + '&select=*');
  if (!c || !c.active) return { ok: false, reason: 'Invalid coupon code.' };
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return { ok: false, reason: 'This coupon has expired.' };
  const prods = c.products || ['all'];
  if (!(prods.includes('all') || prods.includes(product))) return { ok: false, reason: 'This coupon is not valid for this purchase.' };
  if (c.max_uses != null && c.used >= c.max_uses) return { ok: false, reason: 'This coupon has been fully used.' };
  if (mobile) {
    const r = await rest(env, 'coupon_redemptions', 'code=' + eq(code) + '&mobile=' + eq(mobile) + '&select=id', { headers: { prefer: 'count=exact', range: '0-0' } });
    const total = parseInt((r.headers.get('content-range') || '').split('/')[1] || '0', 10) || 0;
    if (total >= (c.per_mobile || 1)) return { ok: false, reason: 'You have already used this coupon.' };
  }
  return { ok: true, coupon: c };
}
export function couponDiscount(c, amount) {
  let d = 0;
  if (c.kind === 'percent') d = Math.round(amount * Math.min(100, c.value) / 100);
  else if (c.kind === 'flat') d = Math.min(amount, c.value);
  else if (c.kind === 'fixed') d = Math.max(0, amount - Math.max(0, c.value));
  else if (c.kind === 'free') d = amount;
  return Math.max(0, Math.min(amount, d));
}
export function couponLabel(c) {
  if (c.kind === 'percent') return c.value + '% OFF';
  if (c.kind === 'flat') return '₹' + c.value + ' OFF';
  if (c.kind === 'fixed') return 'Special price ₹' + c.value;
  return '100% FREE';
}

/* ------------------------------------------------------------ book pricing */
export async function isUltra(env, user) {
  const r = await rest(env, 'ultra_premium_users', 'mobile=' + eq(user.mobile) + '&select=email&limit=5');
  if (!r.ok || !Array.isArray(r.data)) return false;
  return r.data.some(u => String(u.email || '').trim().toLowerCase() === String(user.email).trim().toLowerCase());
}

export async function quote(env, c, user, plan, couponCode) {
  plan = plan === 'pdf' ? 'pdf' : 'reader';
  const ultra = await isUltra(env, user);
  const base = plan === 'pdf' ? c.pdfPrice : c.price;
  const afterUltra = ultra ? (plan === 'pdf' ? c.pdfUltraPrice : c.ultraPrice) : base;
  let coupon = null, couponOff = 0, reason = '';
  if (couponCode) {
    const f = await findCoupon(env, couponCode, 'book', user.mobile);
    if (f.ok) { coupon = f.coupon; couponOff = couponDiscount(f.coupon, afterUltra); } else reason = f.reason;
  }
  return {
    plan, mrp: c.mrp, base, ultra, ultraOff: base - afterUltra, afterUltra,
    coupon: coupon ? { code: coupon.code, label: couponLabel(coupon) } : null, couponOff, couponError: reason,
    final: Math.max(0, afterUltra - couponOff), _coupon: coupon
  };
}

export async function grantAccess(env, c, userId, plan) {
  return patch(env, 'book_users', 'id=' + eq(userId), { has_full: true, plan, access_until: new Date(c.accessUntil + 'T23:59:59+05:30').toISOString() });
}

/* -------------------------------------------------------------- violations */
export async function recordViolation(env, c, user, { type, detail, deviceId }, info) {
  type = Object.prototype.hasOwnProperty.call(VIOLATION_POINTS, type) ? type : 'other';
  const points = VIOLATION_POINTS[type];
  await insert(env, 'book_violations', { user_id: user.id, device_id: clean(deviceId, 64), type, points, detail: clean(detail, 300), ip: info.ip, ua: info.ua });
  if (!points) return { points: user.violation_points, status: user.status };
  const total = (user.violation_points || 0) + points;
  let status = user.status, reason = user.status_reason;
  if (user.status !== 'banned') {
    if (total >= c.banAt) { status = 'banned'; reason = 'Automatically banned: repeated security violations (' + type + ').'; }
    else if (total >= c.suspendAt && user.status === 'active') { status = 'suspended'; reason = 'Suspended for review: security violations (' + type + ').'; }
  }
  await patch(env, 'book_users', 'id=' + eq(user.id), { violation_points: total, status, status_reason: reason });
  return { points: total, status, reason };
}

/* ------------------------------------------------------------ admin helper */
export async function adminAuth(context) {
  const { request, env } = context;
  const notCfg = requireEnv(env, ['SESSION_SECRET', 'ADMIN_PASSWORD', 'MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY']);
  if (notCfg) throw notCfg;
  const p = await verifyToken(env.SESSION_SECRET, (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''));
  if (!p || p.k !== 'admin') throw fail('Admin login required.', 401, 'auth');
  return p;
}

/* ------------------------------------------------------------- page images */
export async function fetchBookObject(env, key) {
  if (env.BOOK_R2 && typeof env.BOOK_R2.get === 'function') {
    const obj = await env.BOOK_R2.get(key);
    if (!obj) return null;
    return { body: obj.body, type: (obj.httpMetadata && obj.httpMetadata.contentType) || 'application/octet-stream' };
  }
  const res = await fetch(env.MAIN_SUPABASE_URL.replace(/\/$/, '') + '/storage/v1/object/book/' + key, {
    headers: { apikey: env.MAIN_SUPABASE_SERVICE_KEY, authorization: 'Bearer ' + env.MAIN_SUPABASE_SERVICE_KEY }
  });
  if (!res.ok) return null;
  return { body: res.body, type: res.headers.get('content-type') || 'application/octet-stream' };
}
