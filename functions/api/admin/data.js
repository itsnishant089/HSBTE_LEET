/**
 * Admin data proxy. The admin pages (premium-admin, counseling-admin) talk to the database through this
 * endpoint (js/admin-sb.js mimics the supabase-js query API), so the browser does not need a public key that can
 * read or change everything, and Row-Level-Security can be locked down for visitors (sql/supabase_lockdown.sql).
 *   POST /api/admin/data   { table, op, columns, filters, order, limit, range, single, data, onConflict, returning, count, head }
 * Requires the admin session token (Authorization: Bearer …). Password columns are never returned.
 */
import { json, fail, body, adminAuth, rest, requireEnv } from '../../_lib/book-core.js';

const TABLES = new Set([
  'premium_users', 'premium_payments', 'premium_access', 'ultra_premium_users', 'security_violations',
  'req_approval', 'referrals', 'referral_uses', 'reviews', 'admin_announcements', 'btech_leet_leads',
  'counseling_users', 'counseling_payments', 'counseling_requests', 'counseling_responses', 'counseling_chats',
  'paper_attempts', 'pay_orders'
]);
const SECRET_COLS = ['password_hash', 'enc_pass'];
const OPS = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'cs', 'cd', 'not', 'or']);
const COL = /^[a-zA-Z0-9_.]{1,64}$/;

const enc = encodeURIComponent;
function val(v) {
  if (v === null) return 'null';
  return String(v);
}
function inList(arr) {
  return '(' + arr.map(x => { const s = val(x); return /[,()"\s]/.test(s) ? '"' + s.replace(/"/g, '\\"') + '"' : s; }).join(',') + ')';
}

function buildQuery(b) {
  const q = [];
  const cols = String(b.columns || '*');
  if (!/^[a-zA-Z0-9_,.*:()!\s-]{1,600}$/.test(cols)) throw new Error('bad columns');
  q.push('select=' + enc(cols.replace(/\s+/g, '')));
  for (const f of Array.isArray(b.filters) ? b.filters : []) {
    const [op, col, v, extra] = f;
    if (!OPS.has(op)) throw new Error('bad filter');
    if (op === 'or') { q.push('or=' + enc('(' + String(col).slice(0, 500) + ')')); continue; }
    if (!COL.test(String(col))) throw new Error('bad column');
    if (op === 'in') q.push(col + '=in.' + enc(inList(Array.isArray(v) ? v : [v])));
    else if (op === 'cs' || op === 'cd') q.push(col + '=' + op + '.' + enc(Array.isArray(v) ? '{' + v.join(',') + '}' : JSON.stringify(v)));
    else if (op === 'not') q.push(col + '=not.' + enc(String(v)) + '.' + enc(val(extra)));
    else q.push(col + '=' + op + '.' + enc(val(v)));
  }
  for (const o of Array.isArray(b.order) ? b.order : []) {
    if (!COL.test(String(o[0]))) throw new Error('bad order');
    q.push('order=' + o[0] + '.' + (o[1] === false ? 'desc' : 'asc'));
  }
  if (Number.isInteger(b.limit) && b.limit > 0) q.push('limit=' + Math.min(b.limit, 10000));
  return q;
}

function strip(rows) {
  const clean = r => { if (r && typeof r === 'object') for (const c of SECRET_COLS) delete r[c]; return r; };
  return Array.isArray(rows) ? rows.map(clean) : clean(rows);
}

export async function onRequest(context) {
  try { await adminAuth(context); } catch (r) { return r; }
  const { env, request } = context;
  if (request.method !== 'POST') return fail('Method not allowed.', 405);
  const notCfg = requireEnv(env, ['MAIN_SUPABASE_URL', 'MAIN_SUPABASE_SERVICE_KEY']);
  if (notCfg) return notCfg;

  const b = await body(request);
  if (!TABLES.has(b.table)) return fail('Table not allowed.', 403);
  const op = b.op || 'select';
  try {
    let q = buildQuery(b), opts = { method: 'GET', headers: {} };
    const wantRows = op === 'select' || b.returning;
    if (op === 'select') {
      if (b.range) opts.headers.range = b.range[0] + '-' + b.range[1];
      if (b.count) opts.headers.prefer = 'count=exact';
      if (b.head) opts.method = 'HEAD';
    } else if (op === 'insert' || op === 'upsert') {
      if (b.data == null) return fail('No data.');
      opts = { method: 'POST', data: b.data, headers: {} };
      const pref = [wantRows ? 'return=representation' : 'return=minimal'];
      if (op === 'upsert') { pref.push('resolution=merge-duplicates'); if (b.onConflict && COL.test(String(b.onConflict).replace(/,/g, ''))) q.push('on_conflict=' + enc(b.onConflict)); }
      opts.headers.prefer = pref.join(',');
    } else if (op === 'update' || op === 'delete') {
      if (!(b.filters || []).length) return fail('Refusing to ' + op + ' without a filter.', 400);
      opts = { method: op === 'update' ? 'PATCH' : 'DELETE', data: op === 'update' ? b.data : undefined, headers: { prefer: wantRows ? 'return=representation' : 'return=minimal' } };
    } else return fail('Unknown op.');

    const r = await rest(env, b.table, q.join('&'), opts);
    if (!r.ok) {
      const e = r.data && typeof r.data === 'object' ? r.data : { message: String(r.data || 'error') };
      return json({ ok: true, data: null, error: { message: e.message || 'Database error', code: e.code || String(r.status), details: e.details || null } });
    }
    const data = strip(r.data);
    let count = null;
    const cr = r.headers && r.headers.get('content-range');
    if (cr && cr.includes('/')) { const n = parseInt(cr.split('/')[1], 10); if (!isNaN(n)) count = n; }
    return json({ ok: true, data: wantRows || op === 'select' ? data : null, count, error: null });
  } catch (e) { return fail(e.message || 'Bad request', 400); }
}
