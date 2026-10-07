/** GET /api/counseling/me → { user, paid } for the logged-in student */
import { json } from '../../_lib/book-core.js';
import { cnsAuth, publicCnsUser, hasPaid } from '../../_lib/cns-core.js';

export async function onRequestGet(context) {
  let a;
  try { a = await cnsAuth(context); } catch (r) { return r; }
  return json({ ok: true, user: publicCnsUser(a.user), paid: await hasPaid(context.env, a.user.id) });
}
