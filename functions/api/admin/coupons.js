/**
 * Admin coupon manager.   Authorization: Bearer <admin token>
 *   GET     /api/admin/coupons                 list (with usage)
 *   POST    /api/admin/coupons                 create / update  { code, products[], kind, value, max_uses, per_mobile, expires_at, note, active }
 *   DELETE  /api/admin/coupons?code=XYZ        delete
 */
import { json, fail, body, adminAuth, rest, insert, patch, eq, clean } from '../../_lib/book-core.js';

const KINDS = ['percent', 'flat', 'fixed', 'free'];
const PRODUCTS = ['premium', 'ultra', 'counseling', 'book', 'all'];

export async function onRequest(context) {
  try { await adminAuth(context); } catch (r) { return r; }
  const { env, request } = context;
  const method = request.method;

  if (method === 'GET') {
    const r = await rest(env, 'coupons', 'select=*&order=created_at.desc&limit=500');
    return json({ ok: r.ok, coupons: r.data || [] });
  }

  if (method === 'DELETE') {
    const code = clean(new URL(request.url).searchParams.get('code'), 40).toUpperCase();
    if (!code) return fail('Coupon code required.');
    await rest(env, 'coupons', 'code=' + eq(code), { method: 'DELETE' });
    return json({ ok: true });
  }

  if (method === 'POST') {
    const b = await body(request);
    const code = clean(b.code, 40).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (code.length < 3) return fail('Coupon code must be at least 3 letters/numbers.');
    const kind = KINDS.includes(b.kind) ? b.kind : null;
    if (!kind) return fail('Choose a discount type.');
    let value = Math.max(0, Math.round(+b.value || 0));
    if (kind === 'percent' && (value < 1 || value > 100)) return fail('Percent must be between 1 and 100.');
    if ((kind === 'flat' || kind === 'fixed') && value < 1 && kind === 'flat') return fail('Enter the rupee amount.');
    if (kind === 'free') value = 100;
    let products = (Array.isArray(b.products) ? b.products : [b.products]).filter(p => PRODUCTS.includes(p));
    if (!products.length) products = ['all'];
    if (products.includes('all')) products = ['all'];
    const row = {
      code, products, kind, value,
      max_uses: b.max_uses === '' || b.max_uses == null ? null : Math.max(1, Math.round(+b.max_uses)),
      per_mobile: Math.max(1, Math.round(+b.per_mobile || 1)),
      expires_at: b.expires_at ? new Date(b.expires_at).toISOString() : null,
      active: b.active !== false, note: clean(b.note, 200)
    };
    const ex = await rest(env, 'coupons', 'code=' + eq(code) + '&select=code&limit=1');
    const r = ex.ok && ex.data && ex.data.length ? await patch(env, 'coupons', 'code=' + eq(code), row) : await insert(env, 'coupons', row);
    return r.ok ? json({ ok: true, coupon: r.data && r.data[0] }) : fail('Could not save the coupon.', 500, 'db');
  }
  return fail('Method not allowed.', 405);
}
