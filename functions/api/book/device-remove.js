import { json, fail, body, bookAuth, patch, eq } from '../../_lib/book-core.js';

// A logged-in reader can sign out one of their other devices (frees a device slot).
export async function onRequestPost(context) {
  let a;
  try { a = await bookAuth(context, { allowRestricted: true }); } catch (r) { return r; }
  const { env, request } = context, b = await body(request);
  const id = parseInt(b.id, 10);
  if (!id) return fail('Bad device.');
  await patch(env, 'book_devices', 'id=' + eq(id) + '&user_id=' + eq(a.user.id), { active: false });
  return json({ ok: true });
}
