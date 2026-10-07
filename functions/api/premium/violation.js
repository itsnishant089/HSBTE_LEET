/**
 * POST /api/premium/violation { type, page, hasSession? }
 * Logs a security violation (devtools, screenshot, print, copy…) from the premium papers / tools.
 * The SERVER decides who it was (from the signed login cookie, so it cannot be blamed on someone else) and records
 * the real IP address. If the visitor was not logged in, the row has no user (admin sees "Not logged in" + IP).
 * Old browser sessions without the new cookie (hasSession) are skipped here so the page logs them the old way.
 */
import { json, fail, body, requireEnv, throttle, clientInfo, insert, clean, verifyToken } from '../../_lib/book-core.js';
import { readCookie } from '../../_lib/pay-core.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY', 'SESSION_SECRET']);
  if (notCfg) return notCfg;
  const info = clientInfo(request);
  if (!(await throttle(env, 'pviol:' + info.ip, 12, 300))) return json({ ok: true, throttled: true });
  const b = await body(request);
  const type = clean(b.type, 40).toLowerCase().replace(/[^a-z0-9_ -]/g, '') || 'other';
  const page = clean(b.page, 160) || 'Unknown Page';

  const p = await verifyToken(env.SESSION_SECRET, readCookie(request));
  const identified = !!(p && p.k === 'prem' && p.uid);
  if (!identified && b.hasSession) return json({ ok: true, identified: false, skipped: true });

  const r = await insert(env, 'security_violations', {
    user_id: identified ? p.uid : null, violation_type: type, page_context: page,
    device_info: info.ua.slice(0, 200), ip_address: info.ip, created_at: new Date().toISOString()
  });
  return r.ok ? json({ ok: true, identified }) : fail('Could not log.', 500, 'db');
}
