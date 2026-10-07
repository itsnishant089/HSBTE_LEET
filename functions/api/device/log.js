/**
 * POST /api/device/log { product: premium|ultra|counseling, userRef, mobile, deviceId, fp }
 * Records which browsers/devices an account is used from (shown in the admin portal).
 * The browser id is random and generated on the device, so this is a tracking aid, not an access check.
 */
import { json, fail, body, requireEnv, rest, patch, insert, eq, clean, normMobile, clientInfo, deviceLabel, throttle } from '../../_lib/book-core.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY']);
  if (notCfg) return notCfg;
  const b = await body(request), info = clientInfo(request);
  if (!(await throttle(env, 'devlog:' + info.ip, 20, 300))) return json({ ok: true, throttled: true });

  const product = ['premium', 'ultra', 'counseling'].includes(b.product) ? b.product : null;
  const userRef = clean(b.userRef, 64), deviceId = clean(b.deviceId, 64);
  if (!product || !userRef || !/^[A-Za-z0-9_-]{8,64}$/.test(deviceId)) return fail('Bad request.');

  const q = 'product=' + eq(product) + '&user_ref=' + eq(userRef) + '&device_id=' + eq(deviceId) + '&select=id,logins';
  const ex = await rest(env, 'device_logins', q + '&limit=1');
  const row = ex.ok && ex.data && ex.data[0];
  if (row) {
    await patch(env, 'device_logins', 'id=' + eq(row.id), { logins: (row.logins || 0) + 1, last_seen: new Date().toISOString(), ip: info.ip, ua: info.ua });
  } else {
    await insert(env, 'device_logins', { product, user_ref: userRef, mobile: normMobile(b.mobile) || null, device_id: deviceId, fp: clean(b.fp, 80), ua: info.ua, ip: info.ip });
  }
  const all = await rest(env, 'device_logins', 'product=' + eq(product) + '&user_ref=' + eq(userRef) + '&select=id');
  return json({ ok: true, devices: (all.data || []).length, label: deviceLabel(info.ua) });
}
