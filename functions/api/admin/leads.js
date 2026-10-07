/**
 * Admin → LEET popup leads (stored in the SEPARATE Supabase project used by js/lead-capture.js).
 * The browser no longer reads or deletes leads with a public key; this endpoint does it with that project's
 * service key, after the admin login check.
 *
 * Cloudflare env vars:  LEADS_SUPABASE_URL   (e.g. https://jnsowbnkccddcrkuonan.supabase.co)
 *                       LEADS_SUPABASE_SERVICE_KEY   (service_role key of THAT project)
 *   GET  /api/admin/leads                         → { ok, leads: [...] }  (newest first)
 *   POST /api/admin/leads { action:'delete', ids:[…] }
 *   POST /api/admin/leads { action:'dedupe' }      → removes duplicates (same mobile or same email), keeps the newest
 */
import { json, fail, body, adminAuth, requireEnv, normMobile } from '../../_lib/book-core.js';

async function lsb(env, path, { method = 'GET', data, headers = {} } = {}) {
  const res = await fetch(env.LEADS_SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + path, {
    method,
    headers: { apikey: env.LEADS_SUPABASE_SERVICE_KEY, authorization: 'Bearer ' + env.LEADS_SUPABASE_SERVICE_KEY, 'content-type': 'application/json', ...headers },
    body: data === undefined ? undefined : JSON.stringify(data)
  });
  const text = await res.text();
  let out = null; try { out = text ? JSON.parse(text) : null; } catch (e) { out = text; }
  return { ok: res.ok, status: res.status, data: out };
}

async function allLeads(env) {
  const out = [];
  for (let from = 0; from < 50000; from += 1000) {
    const r = await lsb(env, 'leet_leads?select=*&order=created_at.desc', { headers: { range: from + '-' + (from + 999) } });
    if (!r.ok || !Array.isArray(r.data)) throw new Error('Could not read leads (' + r.status + ')');
    out.push(...r.data);
    if (r.data.length < 1000) break;
  }
  return out;
}

async function removeIds(env, ids) {
  let n = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100).filter(x => /^[0-9a-f-]{8,40}$|^\d+$/i.test(String(x)));
    if (!chunk.length) continue;
    const r = await lsb(env, 'leet_leads?id=in.(' + chunk.join(',') + ')', { method: 'DELETE', headers: { prefer: 'return=representation' } });
    if (!r.ok) throw new Error('Delete failed (' + r.status + ')');
    n += Array.isArray(r.data) ? r.data.length : chunk.length;
  }
  return n;
}

export async function onRequest(context) {
  try { await adminAuth(context); } catch (r) { return r; }
  const { env, request } = context;
  const notCfg = requireEnv(env, ['LEADS_SUPABASE_URL', 'LEADS_SUPABASE_SERVICE_KEY']);
  if (notCfg) return notCfg;
  try {
    if (request.method === 'GET') return json({ ok: true, leads: await allLeads(env) });
    if (request.method === 'POST') {
      const b = await body(request);
      if (b.action === 'delete') return json({ ok: true, deleted: await removeIds(env, Array.isArray(b.ids) ? b.ids : []) });
      if (b.action === 'dedupe') {
        const leads = await allLeads(env); // newest first
        const seenM = new Set(), seenE = new Set(), drop = [];
        for (const l of leads) {
          const m = normMobile(l.mobile), e = String(l.email || '').trim().toLowerCase();
          let dup = false;
          if (m.length === 10) { if (seenM.has(m)) dup = true; else seenM.add(m); }
          if (e) { if (seenE.has(e)) dup = true; else seenE.add(e); }
          if (dup && l.id != null) drop.push(l.id);
        }
        return json({ ok: true, found: drop.length, deleted: await removeIds(env, drop) });
      }
      return fail('Unknown action.');
    }
  } catch (e) { return fail(e.message || 'Server error', 502, 'leads'); }
  return fail('Method not allowed.', 405);
}
