import { cfg, json, bookAuth, rest, eq, publicUser, isUltra } from '../../_lib/book-core.js';

export async function onRequestGet(context) {
  let a;
  try { a = await bookAuth(context, { allowRestricted: true }); } catch (r) { return r; }
  const { env } = context, c = cfg(env), u = a.user;
  const [devs, ultra] = await Promise.all([
    rest(env, 'book_devices', 'user_id=' + eq(u.id) + '&select=id,label,last_seen,active&order=last_seen.desc'),
    isUltra(env, u)
  ]);
  return json({
    ok: true, user: publicUser(u, c), ultra, devices: (devs.data || []).filter(d => d.active),
    maxDevices: c.maxDevices,
    prices: { mrp: c.mrp, price: c.price, ultraPrice: c.ultraPrice, pdfPrice: c.pdfPrice, pdfUltraPrice: c.pdfUltraPrice, notesPrice: c.notesPrice, notesMrp: c.notesMrp },
    currentDevice: a.payload.did
  });
}
