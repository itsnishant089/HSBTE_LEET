import { cfg, json, fail, body, bookAuth, quote, hasFull } from '../../_lib/book-core.js';

export async function onRequestPost(context) {
  let a;
  try { a = await bookAuth(context); } catch (r) { return r; }
  const { env, request } = context, c = cfg(env), b = await body(request);
  if (hasFull(a.user)) return fail('You already have full access to the book.', 409, 'owned');
  const q = await quote(env, c, a.user, b.plan, b.coupon);
  delete q._coupon;
  return json({ ok: true, quote: q });
}
