/* Admin data client: same query API as supabase-js (from().select().eq()…), but every call goes through
   /api/admin/data with the admin session token. No database key is stored in the page. */
(function () {
  function tok() { try { return sessionStorage.getItem('adm_api_token') || ''; } catch (e) { return ''; } }
  function Q(table) {
    this.b = { table: table, op: 'select', columns: '*', filters: [], order: [] };
    this.mode = null;
  }
  var P = Q.prototype;
  P.select = function (cols, o) {
    if (this.b.op !== 'select') { this.b.returning = true; if (cols) this.b.columns = cols; return this; }
    this.b.columns = cols || '*';
    if (o && o.count) this.b.count = true;
    if (o && o.head) this.b.head = true;
    return this;
  };
  P.insert = function (d) { this.b.op = 'insert'; this.b.data = d; return this; };
  P.upsert = function (d, o) { this.b.op = 'upsert'; this.b.data = d; if (o && o.onConflict) this.b.onConflict = o.onConflict; return this; };
  P.update = function (d) { this.b.op = 'update'; this.b.data = d; return this; };
  P.delete = function () { this.b.op = 'delete'; return this; };
  ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is'].forEach(function (op) {
    P[op] = function (c, v) { this.b.filters.push([op, c, v]); return this; };
  });
  P.in = function (c, v) { this.b.filters.push(['in', c, v]); return this; };
  P.contains = function (c, v) { this.b.filters.push(['cs', c, v]); return this; };
  P.or = function (s) { this.b.filters.push(['or', s]); return this; };
  P.not = function (c, op, v) { this.b.filters.push(['not', c, op, v]); return this; };
  P.filter = function (c, op, v) { this.b.filters.push([op, c, v]); return this; };
  P.match = function (o) { for (var k in o) this.b.filters.push(['eq', k, o[k]]); return this; };
  P.order = function (c, o) { this.b.order.push([c, !(o && o.ascending === false)]); return this; };
  P.limit = function (n) { this.b.limit = n; return this; };
  P.range = function (a, z) { this.b.range = [a, z]; return this; };
  P.single = function () { this.mode = 'single'; return this; };
  P.maybeSingle = function () { this.mode = 'maybe'; return this; };
  P.then = function (ok, bad) { return this.run().then(ok, bad); };
  P.catch = function (f) { return this.run().catch(f); };
  P.run = function () {
    var mode = this.mode;
    return fetch('/api/admin/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() },
      body: JSON.stringify(this.b)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 401) { try { sessionStorage.removeItem('adm_api_token'); } catch (e) {} return { data: null, error: { message: 'Session expired. Log in again.' } }; }
        if (!d.ok && d.error) return { data: null, error: { message: typeof d.error === 'string' ? d.error : d.error.message } };
        var out = { data: d.data, error: d.error || null, count: d.count };
        if (!out.error && mode) {
          var a = Array.isArray(out.data) ? out.data : (out.data ? [out.data] : []);
          if (mode === 'single' && a.length !== 1) { out.data = null; out.error = { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' }; }
          else out.data = a[0] || null;
        }
        return out;
      });
    }).catch(function (e) { return { data: null, error: { message: 'Network error: ' + e.message } }; });
  };
  window.createAdminClient = function () {
    return {
      from: function (t) { return new Q(t); },
      rpc: function () { return Promise.resolve({ data: null, error: { message: 'rpc not available in admin client' } }); },
      channel: function () { var c = { on: function () { return c; }, subscribe: function () { return c; } }; return c; },
      removeChannel: function () {}
    };
  };
})();
