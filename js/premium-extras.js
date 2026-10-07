/**
 * premium-extras.js — notification bell + "My Performance" panel for premium pages
 * (premium-papers, ultra-premium).
 *  - Bell: shows admin announcements (table `admin_announcements`) with an unread badge.
 *  - Performance: attempts recorded by premium-report.js (Supabase RPC `get_my_attempts`,
 *    falling back to this browser's local copy).
 */
(function () {
  'use strict';
  var SUPA_URL = window.SUPA_URL || 'https://vzfpltvchsxsfqlldafd.supabase.co';
  var SUPA_KEY = window.SUPA_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZnBsdHZjaHN4c2ZxbGxkYWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTY3NzksImV4cCI6MjA4ODczMjc3OX0.u9oVBYup_-OdTuY2i14sHGQIvZ4gKReMS919_7zxqCA';
  var client = null;
  function db() {
    if (client) return client;
    if (window.sb && typeof window.sb.from === 'function') return (client = window.sb);
    if (window.supabase && window.supabase.createClient) client = window.supabase.createClient(SUPA_URL, SUPA_KEY);
    return client;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var css = document.createElement('style');
  css.textContent =
    '#pe-bell{position:relative;width:42px;height:42px;border-radius:50%;border:1px solid rgba(148,163,184,.4);background:#fff;color:#1a56db;cursor:pointer;font-size:17px;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(15,23,42,.12)}' +
    '#pe-bell.pe-fixed{position:fixed;top:14px;right:18px;z-index:9500}' +
    '#pe-bell .pe-dot{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#ef4444;color:#fff;font-size:11px;font-weight:800;display:none;align-items:center;justify-content:center;padding:0 4px}' +
    '#pe-panel{position:fixed;top:64px;right:18px;width:min(380px,calc(100vw - 24px));max-height:70vh;overflow:auto;background:#fff;color:#0f172a;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 18px 50px rgba(15,23,42,.25);z-index:9600;display:none}' +
    '#pe-panel.show{display:block}#pe-panel h4{margin:0;padding:12px 16px;font-size:14px;border-bottom:1px solid #eef2f7;position:sticky;top:0;background:#fff}' +
    '.pe-item{padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;line-height:1.5}.pe-item b{display:block;font-size:13.5px}.pe-item small{color:#94a3b8}.pe-item.new{background:#eff6ff}' +
    '.pe-empty{padding:22px 16px;color:#64748b;font-size:13px;text-align:center}' +
    '#pe-perf{margin:18px 0;background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:18px 20px;color:#0f172a}' +
    '#pe-perf h2{margin:0 0 4px;font-size:1.15rem}#pe-perf .pe-sub{color:#64748b;font-size:.85rem;margin-bottom:12px}' +
    '.pe-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:12px}' +
    '.pe-kpis div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px;text-align:center;font-size:.8rem;color:#64748b}.pe-kpis b{display:block;font-size:1.35rem;color:#1a56db}' +
    '.pe-table{width:100%;border-collapse:collapse;font-size:.85rem}.pe-table th{text-align:left;color:#64748b;padding:6px 4px}.pe-table td{padding:6px 4px;border-top:1px solid #eef2f7}' +
    '.pe-weak{margin-top:10px;font-size:.85rem;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:8px 12px}' +
    'body.dark-mode #pe-panel,body.dark-mode #pe-perf{background:#0f172a;color:#e2e8f0;border-color:#1e293b}body.dark-mode .pe-item{border-color:#1e293b}body.dark-mode .pe-item.new{background:#1e3a5f}body.dark-mode #pe-panel h4{background:#0f172a;border-color:#1e293b}body.dark-mode .pe-kpis div{background:#111827;border-color:#1e293b}';
  document.head.appendChild(css);

  /* ---------------- bell ---------------- */
  var anns = [];
  function buildBell() {
    if (document.getElementById('pe-bell')) return;
    var b = document.createElement('button');
    b.id = 'pe-bell'; b.type = 'button'; b.setAttribute('aria-label', 'Notifications');
    b.innerHTML = '<i class="fas fa-bell"></i><span class="pe-dot" id="pe-dot">0</span>';
    var host = document.querySelector('.nav-right');
    if (host) host.insertBefore(b, host.firstChild); else { b.className = 'pe-fixed'; document.body.appendChild(b); }
    var p = document.createElement('div'); p.id = 'pe-panel';
    p.innerHTML = '<h4>🔔 Notifications</h4><div id="pe-list"><div class="pe-empty">Loading…</div></div>';
    document.body.appendChild(p);
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      p.classList.toggle('show');
      if (p.classList.contains('show')) { markSeen(); }
    });
    document.addEventListener('click', function (e) { if (!p.contains(e.target)) p.classList.remove('show'); });
  }
  function seenTs() { return parseInt(lsGet('ann_seen_ts', '0'), 10) || 0; }
  function markSeen() {
    var mx = anns.reduce(function (m, a) { return Math.max(m, new Date(a.created_at || 0).getTime()); }, 0);
    if (mx) lsSet('ann_seen_ts', String(mx));
    setTimeout(function () { var d = document.getElementById('pe-dot'); if (d) d.style.display = 'none'; }, 50);
  }
  function renderBell() {
    var list = document.getElementById('pe-list'); if (!list) return;
    var seen = seenTs();
    if (!anns.length) { list.innerHTML = '<div class="pe-empty">No notifications yet. Updates from hsbteleet.com will appear here.</div>'; return; }
    var unread = 0;
    list.innerHTML = anns.map(function (a) {
      var t = new Date(a.created_at || 0), isNew = t.getTime() > seen; if (isNew) unread++;
      return '<div class="pe-item' + (isNew ? ' new' : '') + '">' + (a.title ? '<b>' + esc(a.title) + '</b>' : '') + esc(a.message || '') +
        '<br><small>' + (isNaN(t) ? '' : t.toLocaleDateString()) + '</small></div>';
    }).join('');
    var d = document.getElementById('pe-dot');
    if (d) { d.textContent = unread > 9 ? '9+' : unread; d.style.display = unread ? 'flex' : 'none'; }
  }
  function loadAnns() {
    var c = db(); if (!c) return;
    var mob = sessionStorage.getItem('prem_mob') || '';
    c.from('admin_announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(15).then(function (r) {
      anns = ((r && r.data) || []).filter(function (a) { return !a.target_mobile || a.target_mobile === 'all' || a.target_mobile === mob; });
      renderBell();
    }).catch(function () { renderBell(); });
  }

  /* ---------------- performance ---------------- */
  function localAttempts() { try { return JSON.parse(lsGet('leet_attempts_v1', '[]')); } catch (e) { return []; } }
  function renderPerf(list) {
    var host = document.getElementById('pe-perf'); if (!host) return;
    if (!list.length) {
      host.innerHTML = '<h2>📈 My Performance</h2><div class="pe-sub">Attempt any paper and your score, accuracy and weak sections will be tracked here.</div>';
      return;
    }
    list = list.slice().sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    var n = list.length, avg = Math.round(list.reduce(function (s, a) { return s + (a.score || 0); }, 0) / n);
    var best = list.reduce(function (m, a) { return Math.max(m, a.score || 0); }, 0);
    var acc = Math.round(list.reduce(function (s, a) { return s + (a.total ? a.correct / a.total : 0); }, 0) / n * 100);
    var secAgg = {};
    list.forEach(function (a) {
      var s = a.sections || {};
      Object.keys(s).forEach(function (k) { var x = secAgg[k] || (secAgg[k] = { c: 0, t: 0 }); x.c += s[k].c || 0; x.t += s[k].t || 0; });
    });
    var weak = Object.keys(secAgg).filter(function (k) { return secAgg[k].t >= 6; })
      .map(function (k) { return [k, secAgg[k].c / secAgg[k].t]; }).sort(function (a, b) { return a[1] - b[1]; }).slice(0, 3);
    host.innerHTML = '<h2>📈 My Performance</h2><div class="pe-sub">Based on the papers you submitted (+1 correct, no negative marking).</div>' +
      '<div class="pe-kpis"><div><b>' + n + '</b>Papers attempted</div><div><b>' + avg + '</b>Average score</div><div><b>' + best + '</b>Best score</div><div><b>' + acc + '%</b>Average accuracy</div></div>' +
      '<table class="pe-table"><thead><tr><th>Paper</th><th>Score</th><th>Accuracy</th><th>Date</th></tr></thead><tbody>' +
      list.slice(0, 6).map(function (a) {
        return '<tr><td>' + esc(String(a.paper || '').replace('HSBTE LEET ', '')) + '</td><td><b>' + (a.score || 0) + '/' + (a.total || 90) + '</b></td><td>' +
          (a.total ? Math.round(a.correct / a.total * 100) : 0) + '%</td><td>' + new Date(a.created_at).toLocaleDateString() + '</td></tr>';
      }).join('') + '</tbody></table>' +
      (weak.length ? '<div class="pe-weak">⚠️ Focus on: ' + weak.map(function (w) { return esc(w[0]) + ' (' + Math.round(w[1] * 100) + '%)'; }).join(' · ') + '</div>' : '');
  }
  function buildPerf() {
    var wrap = document.querySelector('.prem-wrap');
    if (!wrap || document.getElementById('pe-perf')) return;
    var box = document.createElement('section'); box.id = 'pe-perf';
    var first = wrap.querySelector('.sec-group');
    if (first) wrap.insertBefore(box, first); else wrap.appendChild(box);
    renderPerf(localAttempts());
    var uid = sessionStorage.getItem('prem_uid'), c = db();
    if (uid && c && c.rpc) {
      c.rpc('get_my_attempts', { p_user: uid }).then(function (r) {
        if (r && !r.error && r.data && r.data.length) {
          var merged = r.data.map(function (a) { return a; });
          renderPerf(merged);
        }
      }).catch(function () {});
    }
  }

  function init() { buildBell(); loadAnns(); buildPerf(); }
  // pages show content after the access check; wait for it
  var tries = 0;
  (function wait() {
    var ready = document.getElementById('main-page') ? document.getElementById('main-page').style.display !== 'none' : true;
    if (ready || tries++ > 40) init(); else setTimeout(wait, 400);
  })();
})();
