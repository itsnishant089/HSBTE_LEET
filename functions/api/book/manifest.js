import { cfg, json, fail, bookAuth, hasFull, hasNotes, fetchBookObject, insert } from '../../_lib/book-core.js';

const cache = new Map(); // kind -> { at, data }

async function loadJson(env, key) {
  const o = await fetchBookObject(env, key);
  if (!o) return null;
  try { return JSON.parse(await new Response(o.body).text()); } catch (e) { return null; }
}

export async function onRequestGet(context) {
  let a;
  try { a = await bookAuth(context); } catch (r) { return r; }
  const { env, request } = context;
  const b = new URL(request.url).searchParams.get('b');
  const kind = b === 'master' ? 'master' : b === 'notes' ? 'notes' : 'sample';
  if (kind === 'master' && !hasFull(a.user)) return fail('Buy the book to read the full edition.', 402, 'not_purchased');
  if (kind === 'notes' && !hasNotes(a.user)) return fail('Get the Short Notes (₹99) or any book plan to read them.', 402, 'not_purchased');

  let hit = cache.get(kind);
  if (!hit || Date.now() - hit.at > 600000) {
    const meta = await loadJson(env, kind + '/meta.json');
    const toc = kind !== 'sample' ? await loadJson(env, kind + '/toc.json') : null;
    if (!meta) return fail('The book is not uploaded yet. Please try again later.', 503, 'not_ready');
    hit = { at: Date.now(), data: { pages: meta.pages, toc: (toc && toc.toc) || [] } };
    cache.set(kind, hit);
  }
  // reader-open log for the admin analytics (Short Notes / Book / Sample) — must never break reading
  try { await insert(env, 'book_opens', { user_id: a.user.id, kind }); } catch (e) { /* ignore */ }
  return json({ ok: true, kind, ...hit.data });
}
