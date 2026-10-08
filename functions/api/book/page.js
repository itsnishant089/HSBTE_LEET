import { cfg, fail, bookAuth, hasFull, hasNotes, fetchBookObject, rpc, recordViolation, clientInfo, pseudoUuid } from '../../_lib/book-core.js';

export async function onRequestGet(context) {
  let a;
  try { a = await bookAuth(context); } catch (r) { return r; }
  const { env, request } = context, c = cfg(env), u = a.user, info = clientInfo(request);

  // Only the reader (fetch with the Authorization header) may load pages — not address-bar visits, <img> tags or other sites.
  const mode = request.headers.get('sec-fetch-mode'), site = request.headers.get('sec-fetch-site');
  if (mode === 'navigate' || (site && site !== 'same-origin')) return fail('Not allowed.', 403, 'forbidden');

  const url = new URL(request.url);
  const bk = url.searchParams.get('b');
  const kind = bk === 'master' ? 'master' : bk === 'notes' ? 'notes' : 'sample';
  const n = parseInt(url.searchParams.get('n') || '0', 10);
  if (!(n >= 1 && n <= 5000)) return fail('Bad page.', 400, 'page');
  if (kind === 'master' && !hasFull(u)) return fail('Buy the book to read the full edition.', 402, 'not_purchased');
  if (kind === 'notes' && !hasNotes(u)) return fail('Get the Short Notes to read them.', 402, 'not_purchased');

  // scraping protection: pages per minute / per day, and the same account hammering from many IPs is logged
  const hit = await rpc(env, 'book_hit', { p_user: u.id, p_min_limit: c.pageMinLimit, p_day_limit: c.pageDayLimit });
  if (hit.ok && hit.data && hit.data.ok === false) {
    await recordViolation(env, c, u, { type: 'rate-limit', detail: 'pages/min=' + hit.data.minute + ' pages/day=' + hit.data.day, deviceId: a.payload.did }, info);
    return fail('You are reading too fast. Please slow down.', 429, 'rate');
  }

  const key = kind + '/' + String(n).padStart(4, '0') + '.webp';
  const obj = await fetchBookObject(env, key);
  if (!obj) return fail('Page not found.', 404, 'page');
  return new Response(obj.body, {
    status: 200,
    headers: {
      'content-type': obj.type || 'image/webp',
      'cache-control': 'private, no-store, max-age=0',
      'x-content-type-options': 'nosniff',
      'x-robots-tag': 'noindex, noarchive',
      'cross-origin-resource-policy': 'same-origin',
      'content-disposition': 'inline; filename="p.webp"'
    }
  });
}
