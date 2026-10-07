/**
 * admin-extra.js — Book & Coupons sections for premium-admin.html.
 * Everything here talks to the protected server API (/api/admin/*), authenticated with the admin token
 * obtained at login (sessionStorage.adm_api_token). Nothing here uses the public Supabase key.
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmtDate = function (d) { return d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'; };
  var rupee = function (n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); };

  /* ───────────── API ───────────── */
  function api(path, opts) {
    opts = opts || {};
    var t = sessionStorage.getItem('adm_api_token');
    if (!t) return Promise.resolve({ ok: false, code: 'no_token', error: 'Log in again with the admin password (server login) to use this section.' });
    return fetch('/api/admin/' + path, {
      method: opts.method || (opts.body ? 'POST' : 'GET'), cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'Server error' }; }).then(function (d) {
        if (r.status === 401) { sessionStorage.removeItem('adm_api_token'); d.error = 'Session expired — log in again.'; }
        if (r.status === 503) d.error = d.error + ' Add the variables in Cloudflare Pages → Settings → Environment variables.';
        d.httpStatus = r.status; return d;
      });
    }).catch(function () { return { ok: false, error: 'Network error' }; });
  }
  function note(host, msg, bad) { host.innerHTML = '<div class="alert show ' + (bad ? 'alert-err' : 'alert-ok') + '" style="margin:12px 0">' + esc(msg) + '</div>'; }

  /* ───────────── markup ───────────── */
  var PAGES = [
    ['bkcoupons', 'fa-ticket', 'Coupons'], ['bkusers', 'fa-book-open-reader', 'Book Users'], ['bkbuy', 'fa-cart-shopping', 'Book Purchases'],
    ['bkvio', 'fa-user-shield', 'Book Violations'], ['bkdev', 'fa-laptop-mobile', 'Devices']
  ];
  var TITLES = { bkcoupons: 'Coupons (Premium · Ultra · Counselling · Book)', bkusers: 'Book Users & Free-Sample Sign-ups', bkbuy: 'Book Purchases & PDF Deliveries', bkvio: 'Book Security Violations', bkdev: 'Devices — Book, Premium & Ultra' };

  function build() {
    var nav = document.querySelector('.sb-nav'); if (!nav || $('page-bkcoupons')) return;
    var h = '<div class="sb-section">Book &amp; Coupons</div>';
    PAGES.forEach(function (p) { h += '<button class="sb-link" data-x="' + p[0] + '" onclick="gotoPage(\'' + p[0] + '\',this)"><i class="fas ' + p[1] + '"></i> ' + p[2] + (p[0] === 'bkbuy' ? ' <span class="sb-badge" id="bdg-pdf">0</span>' : '') + '</button>'; });
    nav.insertAdjacentHTML('beforeend', h);

    var main = document.querySelector('.main'); if (!main) return;
    var css = '<style>.xk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}.xk-kpi{background:#fff;border:1px solid var(--bo);border-radius:12px;padding:12px 14px}.xk-kpi b{display:block;font-size:1.4rem;color:var(--p)}.xk-kpi span{font-size:.75rem;color:var(--mu)}' +
      '.xk-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;align-items:end}.xk-form label{display:block;font-size:11px;font-weight:700;color:var(--mu);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em}.xk-form .fi,.xk-form .fs{width:100%}' +
      '.xk-checks{display:flex;flex-wrap:wrap;gap:10px;font-size:13px}.xk-checks label{text-transform:none;letter-spacing:0;font-size:13px;color:var(--tx);font-weight:600;display:inline-flex;gap:5px;align-items:center;margin:0}' +
      '.xk-act{display:flex;flex-wrap:wrap;gap:4px}.xk-b{padding:3px 8px;border-radius:7px;border:1px solid var(--bo);background:#f8fafc;font-size:11px;font-weight:700;cursor:pointer}.xk-b:hover{background:#e2e8f0}.xk-b.r{color:#b91c1c;border-color:#fecaca;background:#fef2f2}.xk-b.g{color:#15803d;border-color:#bbf7d0;background:#f0fdf4}' +
      '.xk-pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700}.xk-pill.ok{background:#dcfce7;color:#166534}.xk-pill.warn{background:#fef3c7;color:#92400e}.xk-pill.bad{background:#fee2e2;color:#991b1b}.xk-pill.gray{background:#e2e8f0;color:#475569}</style>';
    var pages = css +
      // coupons
      '<div class="page" id="page-bkcoupons"><div class="card"><div class="card-hdr"><div class="card-title"><i class="fas fa-plus" style="color:var(--gr)"></i> Create / update a coupon</div></div><div class="card-body">' +
      '<div class="xk-form">' +
      '<div><label>Code</label><input class="fi" id="cp-code" placeholder="e.g. DIWALI50" maxlength="40" style="text-transform:uppercase"></div>' +
      '<div><label>Discount type</label><select class="fs" id="cp-kind"><option value="percent">Percent off</option><option value="flat">Flat ₹ off</option><option value="fixed">Fixed final price ₹</option><option value="free">100% free</option></select></div>' +
      '<div><label id="cp-vl">Value (%)</label><input class="fi" id="cp-val" type="number" min="0" placeholder="50"></div>' +
      '<div><label>Max uses (blank = unlimited)</label><input class="fi" id="cp-max" type="number" min="1"></div>' +
      '<div><label>Uses per mobile</label><input class="fi" id="cp-per" type="number" min="1" value="1"></div>' +
      '<div><label>Expires on</label><input class="fi" id="cp-exp" type="date"></div>' +
      '<div style="grid-column:1/-1"><label>Valid for</label><div class="xk-checks" id="cp-prods">' +
      ['all', 'premium', 'ultra', 'counseling', 'book'].map(function (p) { return '<label><input type="checkbox" value="' + p + '"' + (p === 'all' ? ' checked' : '') + '> ' + ({ all: 'All products', premium: 'Premium', ultra: 'Ultra Premium', counseling: 'Counselling', book: 'Book' }[p]) + '</label>'; }).join('') + '</div></div>' +
      '<div style="grid-column:1/-1"><label>Note (internal)</label><input class="fi" id="cp-note" maxlength="200" placeholder="e.g. Instagram giveaway"></div>' +
      '<div><button class="btn btn-green" id="cp-save"><i class="fas fa-save"></i> Save coupon</button></div></div><div id="cp-msg"></div></div></div>' +
      '<div class="card"><div class="card-hdr"><div class="card-title"><i class="fas fa-ticket" style="color:var(--p)"></i> All coupons</div><span id="cp-count" style="font-size:12px;color:var(--mu)">—</span></div><div class="card-body np"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Code</th><th>Discount</th><th>Valid for</th><th>Used</th><th>Per mobile</th><th>Expires</th><th>Status</th><th>Note</th><th>Actions</th></tr></thead><tbody id="tb-cp"><tr class="lr"><td colspan="9">Loading…</td></tr></tbody></table></div></div></div></div>' +
      // users
      '<div class="page" id="page-bkusers"><div class="xk-grid" id="bk-kpi"></div><div class="filter-bar"><input class="fi" id="bku-q" placeholder="Search name, mobile, email…" style="flex:1;min-width:180px"><button class="btn btn-ghost" id="bku-go"><i class="fas fa-search"></i> Search</button><button class="btn btn-ghost" id="bku-csv"><i class="fas fa-download"></i> Export</button></div><div id="bku-msg"></div>' +
      '<div class="card"><div class="card-body np"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Student</th><th>Contact</th><th>City / College / Branch</th><th>Access</th><th>Status</th><th>Points</th><th>Devices</th><th>Joined / last login</th><th>Actions</th></tr></thead><tbody id="tb-bku"><tr class="lr"><td colspan="9">Loading…</td></tr></tbody></table></div></div></div></div>' +
      // purchases
      '<div class="page" id="page-bkbuy"><div id="bkb-msg"></div><div class="card"><div class="card-hdr"><div class="card-title"><i class="fas fa-envelope" style="color:var(--bl)"></i> PDF copies to email (pending first)</div></div><div class="card-body" style="font-size:13px;color:var(--mu)">Run <code>python scripts/make_watermarked_pdf.py "&lt;master.pdf&gt;" "&lt;student name&gt;" &lt;mobile&gt;</code> to make the personal PDF, email it to the student, then tap <b>Mark delivered</b>.</div></div>' +
      '<div class="card"><div class="card-body np"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Student</th><th>Plan</th><th>Paid</th><th>Discount</th><th>Coupon / Ultra</th><th>Status</th><th>PDF</th><th>Payment id</th></tr></thead><tbody id="tb-bkb"><tr class="lr"><td colspan="9">Loading…</td></tr></tbody></table></div></div></div></div>' +
      // violations
      '<div class="page" id="page-bkvio"><div id="bkv-msg"></div><div class="card"><div class="card-body np"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Student</th><th>Type</th><th>Points</th><th>Detail</th><th>IP</th><th>Account</th></tr></thead><tbody id="tb-bkv"><tr class="lr"><td colspan="7">Loading…</td></tr></tbody></table></div></div></div></div>' +
      // devices
      '<div class="page" id="page-bkdev"><div id="bkd-msg"></div><div class="card"><div class="card-hdr"><div class="card-title"><i class="fas fa-book"></i> Book devices</div></div><div class="card-body np"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Student</th><th>Device</th><th>IP</th><th>Logins</th><th>First seen</th><th>Last seen</th><th>Status</th><th></th></tr></thead><tbody id="tb-bkd"><tr class="lr"><td colspan="8">Loading…</td></tr></tbody></table></div></div></div>' +
      '<div class="card"><div class="card-hdr"><div class="card-title"><i class="fas fa-crown"></i> Premium / Ultra / Counselling logins by device</div></div><div class="card-body np"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Product</th><th>Account ref</th><th>Mobile</th><th>Devices</th><th>Total logins</th><th>Last seen</th><th>Latest browser</th></tr></thead><tbody id="tb-lg"><tr class="lr"><td colspan="7">Loading…</td></tr></tbody></table></div></div></div></div>';
    var anchor = $('page-lookup') || main.lastElementChild;
    anchor.insertAdjacentHTML('afterend', pages);
  }

  /* ───────────── coupons ───────────── */
  function loadCoupons() {
    api('coupons').then(function (d) {
      var tb = $('tb-cp');
      if (!d.ok) { tb.innerHTML = '<tr><td colspan="9" style="color:#b91c1c">' + esc(d.error || 'Could not load') + '</td></tr>'; return; }
      $('cp-count').textContent = d.coupons.length + ' coupons';
      if (!d.coupons.length) { tb.innerHTML = '<tr><td colspan="9" style="color:var(--mu)">No coupons yet. Create one above.</td></tr>'; return; }
      tb.innerHTML = d.coupons.map(function (c) {
        var disc = c.kind === 'percent' ? c.value + '% off' : c.kind === 'flat' ? '₹' + c.value + ' off' : c.kind === 'fixed' ? 'Pay ₹' + c.value : 'FREE';
        var exp = c.expires_at ? new Date(c.expires_at) : null, expired = exp && exp < new Date(), full = c.max_uses != null && c.used >= c.max_uses;
        var st = !c.active ? '<span class="xk-pill gray">Off</span>' : expired ? '<span class="xk-pill bad">Expired</span>' : full ? '<span class="xk-pill warn">Fully used</span>' : '<span class="xk-pill ok">Live</span>';
        return '<tr><td><b>' + esc(c.code) + '</b></td><td>' + disc + '</td><td>' + esc((c.products || []).join(', ')) + '</td><td>' + c.used + (c.max_uses != null ? ' / ' + c.max_uses : ' / ∞') + '</td><td>' + c.per_mobile + '</td><td>' + (exp ? exp.toLocaleDateString('en-IN') : '—') + '</td><td>' + st + '</td><td>' + esc(c.note || '') + '</td>' +
          '<td><div class="xk-act"><button class="xk-b" data-edit="' + esc(c.code) + '">Edit</button><button class="xk-b ' + (c.active ? 'r' : 'g') + '" data-tg="' + esc(c.code) + '">' + (c.active ? 'Disable' : 'Enable') + '</button><button class="xk-b r" data-del="' + esc(c.code) + '">Delete</button></div></td></tr>';
      }).join('');
      var by = {}; d.coupons.forEach(function (c) { by[c.code] = c; });
      tb.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { fillCoupon(by[b.getAttribute('data-edit')]); }; });
      tb.querySelectorAll('[data-tg]').forEach(function (b) { b.onclick = function () { var c = by[b.getAttribute('data-tg')]; saveCoupon({ code: c.code, products: c.products, kind: c.kind, value: c.value, max_uses: c.max_uses, per_mobile: c.per_mobile, expires_at: c.expires_at, note: c.note, active: !c.active }); }; });
      tb.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (confirm('Delete coupon ' + b.getAttribute('data-del') + '?')) api('coupons?code=' + encodeURIComponent(b.getAttribute('data-del')), { method: 'DELETE' }).then(loadCoupons); }; });
    });
  }
  function fillCoupon(c) {
    $('cp-code').value = c.code; $('cp-kind').value = c.kind; $('cp-val').value = c.value; $('cp-max').value = c.max_uses == null ? '' : c.max_uses; $('cp-per').value = c.per_mobile;
    $('cp-exp').value = c.expires_at ? c.expires_at.slice(0, 10) : ''; $('cp-note').value = c.note || '';
    document.querySelectorAll('#cp-prods input').forEach(function (i) { i.checked = (c.products || []).indexOf(i.value) > -1; });
    kindHint(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function kindHint() {
    var k = $('cp-kind').value; $('cp-vl').textContent = k === 'percent' ? 'Value (%)' : k === 'flat' ? 'Rupees off (₹)' : k === 'fixed' ? 'Final price (₹)' : 'Value (not used)';
    $('cp-val').disabled = k === 'free';
  }
  function saveCoupon(body) {
    api('coupons', { body: body }).then(function (d) { note($('cp-msg'), d.ok ? '✅ Saved ' + body.code : '❌ ' + (d.error || 'Failed'), !d.ok); if (d.ok) loadCoupons(); });
  }

  /* ───────────── book users ───────────── */
  var usersCache = [];
  function statusPill(s) { return '<span class="xk-pill ' + (s === 'active' ? 'ok' : s === 'suspended' ? 'warn' : 'bad') + '">' + s + '</span>'; }
  function loadUsers() {
    api('book?view=overview').then(function (o) {
      if (!o.ok) { note($('bku-msg'), o.error || 'Could not load', true); $('tb-bku').innerHTML = ''; return; }
      $('bk-kpi').innerHTML = [['Book accounts', o.users], ['Full-book owners', o.full], ['PDF to deliver', o.pendingPdf], ['Suspended / banned', o.restricted], ['Violations (24h)', o.violations24h], ['Book revenue', rupee(o.revenue)]]
        .map(function (k) { return '<div class="xk-kpi"><b>' + k[1] + '</b><span>' + k[0] + '</span></div>'; }).join('');
      var bd = $('bdg-pdf'); if (bd) bd.textContent = o.pendingPdf || 0;
    });
    api('book?view=users&q=' + encodeURIComponent($('bku-q').value.trim())).then(function (d) {
      var tb = $('tb-bku'); if (!d.ok) { tb.innerHTML = '<tr><td colspan="9" style="color:#b91c1c">' + esc(d.error || '') + '</td></tr>'; return; }
      usersCache = d.users;
      if (!d.users.length) { tb.innerHTML = '<tr><td colspan="9" style="color:var(--mu)">No book accounts yet.</td></tr>'; return; }
      tb.innerHTML = d.users.map(function (u) {
        var devs = (u.book_devices || []).filter(function (x) { return x.active; }).length, full = u.has_full && (!u.access_until || new Date(u.access_until) > new Date());
        return '<tr><td><b>' + esc(u.full_name) + '</b>' + (u.admin_note ? '<br><small style="color:var(--mu)">' + esc(u.admin_note) + '</small>' : '') + (u.fine_amount ? '<br><small style="color:#b91c1c">Fine recorded: ' + rupee(u.fine_amount) + '</small>' : '') + '</td>' +
          '<td>' + esc(u.mobile) + '<br><small>' + esc(u.email) + '</small></td><td>' + esc([u.city, u.college, u.branch].filter(Boolean).join(' · ') || '—') + '</td>' +
          '<td>' + (full ? '<span class="xk-pill ok">Full · ' + esc(u.plan) + '</span>' : '<span class="xk-pill gray">Sample</span>') + '</td><td>' + statusPill(u.status) + (u.status_reason ? '<br><small>' + esc(u.status_reason) + '</small>' : '') + '</td>' +
          '<td>' + (u.violation_points || 0) + '</td><td>' + devs + '</td><td>' + fmtDate(u.created_at) + '<br><small>' + fmtDate(u.last_login) + '</small></td>' +
          '<td><div class="xk-act"><button class="xk-b r" data-a="ban" data-u="' + u.id + '">Ban</button><button class="xk-b" data-a="suspend" data-u="' + u.id + '">Suspend</button><button class="xk-b g" data-a="unban" data-u="' + u.id + '">Unban</button>' +
          '<button class="xk-b" data-a="reset_devices" data-u="' + u.id + '">Reset devices</button><button class="xk-b g" data-a="grant_full" data-u="' + u.id + '">Grant book</button><button class="xk-b r" data-a="revoke_full" data-u="' + u.id + '">Revoke</button>' +
          '<button class="xk-b" data-a="fine" data-u="' + u.id + '">Fine</button><button class="xk-b" data-a="note" data-u="' + u.id + '">Note</button></div></td></tr>';
      }).join('');
      tb.querySelectorAll('[data-a]').forEach(function (b) {
        b.onclick = function () {
          var a = b.getAttribute('data-a'), body = { action: a, userId: b.getAttribute('data-u') };
          if (a === 'ban' || a === 'suspend') { var r = prompt('Reason (shown to the student):', a === 'ban' ? 'Violation of book terms' : 'Under review'); if (r === null) return; body.reason = r; }
          if (a === 'fine') { var f = prompt('Compensation amount recorded against this account (₹):', '0'); if (f === null) return; body.amount = f; }
          if (a === 'note') { var n = prompt('Admin note:', ''); if (n === null) return; body.note = n; }
          if (a === 'grant_full') { body.plan = confirm('OK = Reader + PDF copy plan\nCancel = Reader plan') ? 'pdf' : 'reader'; }
          if (a === 'revoke_full' && !confirm('Remove full-book access?')) return;
          api('book', { body: body }).then(function (d) { note($('bku-msg'), d.ok ? '✅ Done' : '❌ ' + (d.error || 'Failed'), !d.ok); loadUsers(); });
        };
      });
    });
  }
  function exportUsers() {
    var rows = [['Name', 'Mobile', 'Email', 'City', 'College', 'Branch', 'Status', 'Points', 'Full access', 'Plan', 'Joined']].concat(usersCache.map(function (u) { return [u.full_name, u.mobile, u.email, u.city, u.college, u.branch, u.status, u.violation_points, u.has_full, u.plan, u.created_at]; }));
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'book_users_' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
  }

  /* ───────────── purchases / violations / devices ───────────── */
  function loadPurchases() {
    api('book?view=purchases').then(function (d) {
      var tb = $('tb-bkb'); if (!d.ok) { tb.innerHTML = '<tr><td colspan="9" style="color:#b91c1c">' + esc(d.error || '') + '</td></tr>'; return; }
      var list = d.purchases.slice().sort(function (a, b) { var pa = a.plan === 'pdf' && !a.delivered && a.status !== 'created' ? 0 : 1, pb = b.plan === 'pdf' && !b.delivered && b.status !== 'created' ? 0 : 1; return pa - pb || new Date(b.created_at) - new Date(a.created_at); });
      if (!list.length) { tb.innerHTML = '<tr><td colspan="9" style="color:var(--mu)">No purchases yet.</td></tr>'; return; }
      tb.innerHTML = list.map(function (p) {
        var u = p.book_users || {}, paid = p.status === 'paid' || p.status === 'free';
        var pdf = p.plan !== 'pdf' ? '—' : !paid ? '—' : p.delivered ? '<span class="xk-pill ok">Delivered</span>' : '<button class="xk-b g" data-d="' + p.id + '">Mark delivered</button> <span class="xk-pill warn">Send PDF</span>';
        return '<tr><td>' + fmtDate(p.created_at) + '</td><td><b>' + esc(u.full_name || '') + '</b><br><small>' + esc(u.mobile || '') + ' · ' + esc(u.email || '') + '</small></td><td>' + (p.plan === 'pdf' ? 'Reader + PDF' : 'Reader') + '</td><td>' + rupee(p.final_amount) + '</td><td>' + rupee(p.discount) + '</td><td>' + esc(p.coupon || '—') + (p.ultra_discount ? ' <span class="xk-pill ok">Ultra</span>' : '') + '</td>' +
          '<td><span class="xk-pill ' + (paid ? 'ok' : p.status === 'created' ? 'gray' : 'bad') + '">' + p.status + '</span></td><td>' + pdf + '</td><td><small>' + esc(p.rzp_payment_id || '—') + '</small></td></tr>';
      }).join('');
      tb.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { api('book', { body: { action: 'mark_delivered', purchaseId: b.getAttribute('data-d') } }).then(loadPurchases); }; });
    });
  }
  function loadViolations() {
    api('book?view=violations').then(function (d) {
      var tb = $('tb-bkv'); if (!d.ok) { tb.innerHTML = '<tr><td colspan="7" style="color:#b91c1c">' + esc(d.error || '') + '</td></tr>'; return; }
      if (!d.violations.length) { tb.innerHTML = '<tr><td colspan="7" style="color:var(--mu)">No violations logged. 🎉</td></tr>'; return; }
      tb.innerHTML = d.violations.map(function (v) {
        var u = v.book_users || {};
        return '<tr><td>' + fmtDate(v.created_at) + '</td><td><b>' + esc(u.full_name || '—') + '</b><br><small>' + esc(u.mobile || '') + '</small></td><td><span class="xk-pill ' + (v.points >= 3 ? 'bad' : 'warn') + '">' + esc(v.type) + '</span></td><td>' + v.points + '</td><td><small>' + esc(v.detail || '') + '</small></td><td><small>' + esc(v.ip || '') + '</small></td><td>' + (u.status ? statusPill(u.status) : '') + '</td></tr>';
      }).join('');
    });
  }
  function loadDevices() {
    api('book?view=devices').then(function (d) {
      var tb = $('tb-bkd'); if (!d.ok) { tb.innerHTML = '<tr><td colspan="8" style="color:#b91c1c">' + esc(d.error || '') + '</td></tr>'; return; }
      tb.innerHTML = d.devices.length ? d.devices.map(function (x) {
        var u = x.book_users || {};
        return '<tr><td><b>' + esc(u.full_name || '') + '</b><br><small>' + esc(u.mobile || '') + '</small></td><td>' + esc(x.label || '') + '<br><small>' + esc(x.device_id) + '</small></td><td><small>' + esc(x.ip || '') + '</small></td><td>' + x.logins + '</td><td>' + fmtDate(x.first_seen) + '</td><td>' + fmtDate(x.last_seen) + '</td><td>' + (x.active ? '<span class="xk-pill ok">Active</span>' : '<span class="xk-pill gray">Signed out</span>') + '</td><td>' + (x.active ? '<button class="xk-b r" data-rd="' + x.id + '">Sign out</button>' : '') + '</td></tr>';
      }).join('') : '<tr><td colspan="8" style="color:var(--mu)">No devices yet.</td></tr>';
      tb.querySelectorAll('[data-rd]').forEach(function (b) { b.onclick = function () { api('book', { body: { action: 'revoke_device', deviceId: b.getAttribute('data-rd') } }).then(loadDevices); }; });
    });
    api('book?view=logins').then(function (d) {
      var tb = $('tb-lg'); if (!d.ok) { tb.innerHTML = '<tr><td colspan="7" style="color:#b91c1c">' + esc(d.error || '') + '</td></tr>'; return; }
      var g = {}; d.logins.forEach(function (l) { var k = l.product + '|' + l.user_ref; var e = g[k] || (g[k] = { product: l.product, ref: l.user_ref, mobile: l.mobile, n: 0, logins: 0, last: l.last_seen, ua: l.ua }); e.n++; e.logins += l.logins; if (new Date(l.last_seen) > new Date(e.last)) { e.last = l.last_seen; e.ua = l.ua; } });
      var rows = Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return b.n - a.n || new Date(b.last) - new Date(a.last); });
      tb.innerHTML = rows.length ? rows.map(function (r) { return '<tr><td>' + esc(r.product) + '</td><td><small>' + esc(r.ref) + '</small></td><td>' + esc(r.mobile || '') + '</td><td><span class="xk-pill ' + (r.n > 3 ? 'bad' : r.n > 2 ? 'warn' : 'ok') + '">' + r.n + '</span></td><td>' + r.logins + '</td><td>' + fmtDate(r.last) + '</td><td><small>' + esc((r.ua || '').slice(0, 70)) + '</small></td></tr>'; }).join('') : '<tr><td colspan="7" style="color:var(--mu)">No device data yet.</td></tr>';
    });
  }

  /* ───────────── wiring ───────────── */
  function wire() {
    $('cp-kind').onchange = kindHint; kindHint();
    $('cp-save').onclick = function () {
      var prods = Array.prototype.filter.call(document.querySelectorAll('#cp-prods input'), function (i) { return i.checked; }).map(function (i) { return i.value; });
      saveCoupon({ code: $('cp-code').value.trim(), kind: $('cp-kind').value, value: $('cp-val').value, max_uses: $('cp-max').value, per_mobile: $('cp-per').value, expires_at: $('cp-exp').value ? $('cp-exp').value + 'T23:59:59+05:30' : null, products: prods, note: $('cp-note').value, active: true });
    };
    $('bku-go').onclick = loadUsers; $('bku-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') loadUsers(); }); $('bku-csv').onclick = exportUsers;
  }
  var LOADERS = { bkcoupons: loadCoupons, bkusers: loadUsers, bkbuy: loadPurchases, bkvio: loadViolations, bkdev: loadDevices };
  function hook() {
    var orig = window.loadPage;
    window.loadPage = function (n) {
      if (LOADERS[n]) { var t = $('page-ttl'); if (t) t.textContent = TITLES[n]; LOADERS[n](); return; }
      if (typeof orig === 'function') return orig.apply(this, arguments);
    };
  }
  build(); wire(); hook();
  // fill the "PDF to deliver" badge once the admin is in
  setTimeout(function () { api('book?view=overview').then(function (o) { if (o.ok && $('bdg-pdf')) $('bdg-pdf').textContent = o.pendingPdf || 0; }); }, 2500);
})();
