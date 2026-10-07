/**
 * book-reader.js — the secure Haryana LEET Book reader.
 * Pages are fetched one at a time from /api/book/page (server checks login, purchase, device, rate limits),
 * painted on a <canvas> with a personal watermark, and never exposed as a file or selectable text.
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var kind = params.get('b') === 'master' ? 'master' : 'sample';
  var state = { user: null, pages: 0, toc: [], page: 1, zoom: 1, token: BOOK.token(), cache: new Map(), loading: false, locked: false };
  var canvas = $('bkr-canvas'), ctx = canvas.getContext('2d');
  var SAMPLE_TOC = [{ t: 'Cover', p: 1, k: 'section' }, { t: 'Copyright & legal notice', p: 3, k: 'chapter' }, { t: 'About this free sample', p: 4, k: 'chapter' },
    { t: 'Contents (full book)', p: 5, k: 'chapter' }, { t: 'Sample chapter — Complex Numbers', p: 10, k: 'chapter' }, { t: 'Sample MCQs', p: 12, k: 'chapter' },
    { t: 'Sample Paper 1', p: 17, k: 'chapter' }, { t: 'Answer keys', p: 18, k: 'chapter' }, { t: 'Get the complete book', p: 19, k: 'chapter' }];

  if (!state.token) { location.replace('/book-login?next=' + (kind === 'master' ? 'read' : 'sample')); return; }

  /* ───────────── helpers ───────────── */
  function toast(msg, ms) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, ms || 3500); }
  function gate(html) { $('gate-box').innerHTML = html; $('gate').classList.add('show'); }
  function ungate() { $('gate').classList.remove('show'); }
  function maskedMobile() { var m = (state.user && state.user.mobile) || ''; return m; }
  function stamp() {
    var u = state.user || {}, d = new Date();
    return (u.name || 'Reader') + ' · ' + maskedMobile() + ' · ' + BOOK.deviceId().slice(0, 6) + ' · ' + d.toLocaleDateString('en-GB');
  }

  /* ───────────── gating screens ───────────── */
  function showBuyGate() {
    gate('<h3>Unlock the full book</h3><p>The complete 1,633-page edition is available for ₹399 (₹299 for Ultra Premium members).</p>' +
      '<button class="bk-btn bk-btn-gold" id="g-buy" style="width:100%">Buy the book</button>' +
      '<p style="margin:14px 0 0"><a href="#" id="g-sample" style="color:#1a56db;font-weight:700">Continue with the free sample</a></p>');
    $('g-buy').onclick = openBuy;
    $('g-sample').onclick = function (e) { e.preventDefault(); location.href = '/book-reader?b=sample'; };
  }
  function openBuy() { BOOK.openCheckout('reader', function () { location.href = '/book-reader?b=master'; }); }
  function showRestricted(d) {
    state.locked = true;
    gate('<h3 style="color:#b91c1c">' + (d.code === 'banned' ? 'Account banned' : 'Account suspended') + '</h3><p>' + BOOK.esc(d.error || '') + (d.reason ? '<br><small>' + BOOK.esc(d.reason) + '</small>' : '') +
      '</p><p style="margin:0">Contact <b>nishant@hsbteleet.com</b> or WhatsApp <b>9992507270</b> with your registered mobile number.</p>');
    ctx.clearRect(0, 0, canvas.width, canvas.height); $('load').style.display = 'none';
  }

  /* ───────────── rendering ───────────── */
  function fetchPage(n) {
    if (state.cache.has(n)) return Promise.resolve(state.cache.get(n));
    return fetch('/api/book/page?b=' + kind + '&n=' + n, { headers: { Authorization: 'Bearer ' + state.token }, cache: 'no-store', credentials: 'omit' })
      .then(function (r) {
        if (r.status === 200) return r.blob().then(function (b) { return createImageBitmap(b); }).then(function (bmp) {
          state.cache.set(n, bmp);
          if (state.cache.size > 6) { var first = state.cache.keys().next().value; var old = state.cache.get(first); try { old.close(); } catch (e) {} state.cache.delete(first); }
          return bmp;
        });
        return r.json().catch(function () { return {}; }).then(function (d) { d.httpStatus = r.status; throw d; });
      });
  }

  function paint(bmp) {
    var stage = $('stage'), avail = stage.clientWidth - 24 - ($('toc').classList.contains('open') && innerWidth > 900 ? 320 : 0);
    var cssW = Math.max(280, Math.min(avail, 1000) * state.zoom), cssH = cssW * bmp.height / bmp.width, dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    // personal watermark — drawn into the pixels, so screenshots and photos carry it
    var s = stamp();
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(-28 * Math.PI / 180);
    ctx.font = '600 ' + Math.round(canvas.width / 38) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var step = canvas.width / 7, reach = Math.hypot(canvas.width, canvas.height);
    for (var y = -reach; y < reach; y += step) {
      for (var x = -reach + ((y / step) % 2 ? step : 0); x < reach; x += step * 2.6) {
        ctx.fillStyle = 'rgba(26,86,219,0.085)'; ctx.fillText(s, x, y);
        ctx.fillStyle = 'rgba(0,0,0,0.045)'; ctx.fillText(s, x + 2, y + 2);
      }
    }
    ctx.restore();
    ctx.font = '600 ' + Math.round(canvas.width / 70) + 'px sans-serif'; ctx.fillStyle = 'rgba(15,23,42,.6)'; ctx.textAlign = 'center';
    ctx.fillText('hsbteleet.com · licensed to ' + (state.user.name || '') + ' · not for sharing', canvas.width / 2, canvas.height - 10 * dpr);
    $('load').style.display = 'none';
  }

  function go(n, fromUi) {
    n = Math.max(1, Math.min(state.pages || 1, parseInt(n, 10) || 1));
    if (state.loading || state.locked) return;
    state.loading = true; state.page = n; $('pg').value = n; $('load').style.display = 'grid'; $('load').textContent = 'Loading page ' + n + '…';
    markToc();
    fetchPage(n).then(function (bmp) {
      paint(bmp); $('stage').scrollTop = 0;
      history.replaceState(null, '', '?b=' + kind + '&p=' + n);
      try { localStorage.setItem('bk_last_' + kind, String(n)); } catch (e) {}
      if (kind === 'sample' && n === state.pages) toast('End of the free sample — unlock all 1,633 pages with the Buy button.', 5000);
      // gentle read-ahead (one page, after a pause) so turning pages feels instant without hammering the server
      clearTimeout(go._ra); go._ra = setTimeout(function () { if (n < state.pages && !state.cache.has(n + 1)) fetchPage(n + 1).catch(function () {}); }, 900);
    }).catch(function (d) {
      if (d && d.code === 'rate') { $('load').textContent = 'Reading too fast — please wait a few seconds.'; setTimeout(function () { state.loading = false; go(n); }, 6000); return; }
      if (d && (d.code === 'banned' || d.code === 'suspended')) return showRestricted(d);
      if (d && (d.code === 'auth' || d.code === 'device_revoked')) { BOOK.logout(); location.replace('/book-login?mode=login&next=' + (kind === 'master' ? 'read' : 'sample')); return; }
      if (d && d.code === 'not_purchased') return showBuyGate();
      $('load').textContent = (d && d.error) || 'Could not load this page. Check your connection.';
    }).then(function () { state.loading = false; });
  }

  /* ───────────── contents panel ───────────── */
  function buildToc() {
    var list = kind === 'master' ? state.toc : SAMPLE_TOC;
    $('toc').innerHTML = list.map(function (x) {
      return '<a class="k-' + x.k + '" data-p="' + x.p + '">' + BOOK.esc(x.t) + '<small>' + x.p + '</small></a>';
    }).join('');
    $('toc').querySelectorAll('a').forEach(function (a) { a.onclick = function () { go(+a.getAttribute('data-p')); if (innerWidth <= 900) toggleToc(false); }; });
  }
  function markToc() {
    var best = null; $('toc').querySelectorAll('a').forEach(function (a) { a.classList.remove('on'); if (+a.getAttribute('data-p') <= state.page) best = a; });
    if (best) best.classList.add('on');
  }
  function toggleToc(force) {
    var open = typeof force === 'boolean' ? force : !$('toc').classList.contains('open');
    $('toc').classList.toggle('open', open); $('stage').classList.toggle('toc-open', open && innerWidth > 900);
    if (state.cache.has(state.page)) paint(state.cache.get(state.page));
  }

  /* ───────────── account menu ───────────── */
  function openMenu() {
    BOOK.api('me').then(function (d) {
      if (!d.ok) return;
      var u = d.user;
      $('menu-box').innerHTML = '<h3 style="margin:0 0 4px">' + BOOK.esc(u.name) + '</h3><p style="margin:0 0 12px;color:#64748b">' + BOOK.esc(u.mobile) + ' · ' + BOOK.esc(u.email) + '</p>' +
        '<p style="margin:0 0 6px"><b>Access:</b> ' + (u.hasFull ? 'Full book until ' + new Date(u.accessUntil).toLocaleDateString('en-GB') + (u.plan === 'pdf' ? ' (PDF copy emailed)' : '') : 'Free sample') + '</p>' +
        '<p style="margin:0 0 6px"><b>Warnings:</b> ' + u.points + ' / ' + u.suspendAt + ' before suspension</p>' +
        '<p style="margin:10px 0 6px"><b>Your devices (' + d.devices.length + '/' + d.maxDevices + ')</b></p>' +
        d.devices.map(function (x) {
          return '<div style="display:flex;justify-content:space-between;gap:8px;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;margin-bottom:6px;font-size:.85rem"><span>' + BOOK.esc(x.label || 'Device') + (x.id && String(x.id) === '' ? '' : '') +
            '<br><small style="color:#64748b">' + new Date(x.last_seen).toLocaleString() + '</small></span>' +
            '<button data-rm="' + x.id + '" style="border:0;background:#fee2e2;color:#b91c1c;border-radius:8px;padding:0 10px;cursor:pointer;font-weight:700">Sign out</button></div>';
        }).join('') +
        '<div style="display:flex;gap:8px;margin-top:14px"><button class="bk-btn bk-btn-blue" id="m-close" style="flex:1;padding:11px">Close</button>' +
        '<button class="bk-btn" id="m-out" style="flex:1;padding:11px;background:#fee2e2;color:#b91c1c">Log out</button></div>';
      $('menu').classList.add('show');
      $('m-close').onclick = function () { $('menu').classList.remove('show'); };
      $('m-out').onclick = function () { BOOK.logout(); location.href = '/haryana-leet-book'; };
      $('menu-box').querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { BOOK.api('device-remove', { body: { id: b.getAttribute('data-rm') } }).then(openMenu); }; });
    });
  }

  /* ───────────── init ───────────── */
  function init() {
    $('s-' + kind).classList.add('on');
    $('seg').querySelectorAll('button').forEach(function (b) { b.onclick = function () { var t = b.getAttribute('data-b'); if (t !== kind) location.href = '/book-reader?b=' + t; }; });
    BOOK.api('me').then(function (d) {
      if (!d.ok) {
        if (d.code === 'auth' || d.code === 'device_revoked') { location.replace('/book-login?mode=login&next=' + (kind === 'master' ? 'read' : 'sample')); return; }
        $('load').textContent = d.error || 'Could not load your account.'; return;
      }
      state.user = d.user; BOOK.setUser(d.user);
      if (d.user.status !== 'active') return showRestricted({ code: d.user.status, error: d.user.status === 'banned' ? 'This account has been banned.' : 'This account is suspended pending review.', reason: d.user.reason });
      $('title').textContent = kind === 'master' ? 'Haryana LEET 2027 — Complete Study Guide' : 'Free Sample — Haryana LEET 2027';
      if (!d.user.hasFull) { var bb = $('b-buy'); bb.hidden = false; bb.onclick = openBuy; }
      if (kind === 'master' && !d.user.hasFull) { $('tot').textContent = '/ 1633'; return showBuyGate(); }
      BOOK.api('manifest?b=' + kind).then(function (m) {
        if (!m.ok) { if (m.code === 'not_purchased') return showBuyGate(); $('load').textContent = m.error || 'Book is not available yet.'; return; }
        state.pages = m.pages; state.toc = m.toc || []; $('tot').textContent = '/ ' + m.pages; $('pg').max = m.pages;
        buildToc();
        var start = parseInt(params.get('p') || localStorage.getItem('bk_last_' + kind) || '1', 10) || 1;
        go(start);
        if (innerWidth > 900 && kind === 'master') toggleToc(true);
      });
    });
  }

  /* ───────────── controls ───────────── */
  $('b-prev').onclick = function () { go(state.page - 1); }; $('b-next').onclick = function () { go(state.page + 1); };
  $('pg').addEventListener('change', function () { go($('pg').value); });
  $('pg').addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') { go($('pg').value); $('pg').blur(); } });
  $('b-toc').onclick = function () { toggleToc(); }; $('b-menu').onclick = openMenu;
  $('z-in').onclick = function () { state.zoom = Math.min(2, +(state.zoom + .15).toFixed(2)); if (state.cache.has(state.page)) paint(state.cache.get(state.page)); };
  $('z-out').onclick = function () { state.zoom = Math.max(.6, +(state.zoom - .15).toFixed(2)); if (state.cache.has(state.page)) paint(state.cache.get(state.page)); };
  window.addEventListener('resize', function () { if (state.cache.has(state.page)) paint(state.cache.get(state.page)); });
  var tx = null;
  $('stage').addEventListener('touchstart', function (e) { tx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
  $('stage').addEventListener('touchend', function (e) { if (tx == null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 90 && state.zoom <= 1.05) go(state.page + (dx < 0 ? 1 : -1)); tx = null; }, { passive: true });

  /* ───────────── protection ───────────── */
  var lastSent = {};
  function report(type, detail) {
    var now = Date.now(); if (lastSent[type] && now - lastSent[type] < 20000) return; lastSent[type] = now;
    BOOK.api('violation', { body: { type: type, detail: detail || '', deviceId: BOOK.deviceId() } }).then(function (d) {
      if (!d || !d.ok) return;
      toast('⚠ ' + d.message + ' (warning points: ' + d.points + ')', 6000);
      if (d.status === 'suspended' || d.status === 'banned') showRestricted({ code: d.status, error: d.message });
    });
  }
  function silent(e) { e.preventDefault(); e.stopPropagation(); }

  document.addEventListener('keydown', function (e) {
    if (e.target && e.target.id === 'pg') return;
    var k = e.key, ctrl = e.ctrlKey || e.metaKey;
    if (k === 'PrintScreen') { silent(e); report('printscreen'); try { navigator.clipboard.writeText(''); } catch (_) {} return; }
    if (e.metaKey && e.shiftKey && (k === 's' || k === 'S')) { silent(e); report('snip'); return; }
    if (k === 'F12' || (ctrl && e.shiftKey && 'ijcksmeIJCKSME'.indexOf(k) > -1)) { silent(e); report('devtools', 'shortcut'); return; }
    if (ctrl && 'acxvspuACXVSPU'.indexOf(k) > -1) { silent(e); return; }              // silently blocked
    if (k === 'ArrowRight' || k === 'PageDown') { silent(e); go(state.page + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { silent(e); go(state.page - 1); }
    else if (k === 'Home') { silent(e); go(1); } else if (k === 'End') { silent(e); go(state.pages); }
  }, true);
  document.addEventListener('keyup', function (e) { if (e.key === 'PrintScreen') { report('printscreen'); try { navigator.clipboard.writeText(''); } catch (_) {} } }, true);
  ['contextmenu', 'copy', 'cut', 'paste', 'dragstart', 'selectstart', 'drag'].forEach(function (t) { document.addEventListener(t, function (e) { if (e.target && e.target.id === 'pg') return; silent(e); }, true); });
  window.addEventListener('beforeprint', function () { report('print'); document.documentElement.classList.add('bkr-hide'); });
  window.addEventListener('afterprint', function () { document.documentElement.classList.remove('bkr-hide'); });

  // blur the page whenever the window loses focus or the tab is hidden (screen-capture tools take focus)
  function hideOn(on) { document.documentElement.classList[on ? 'add' : 'remove']('bkr-hide'); }
  window.addEventListener('blur', function () { hideOn(true); }); window.addEventListener('focus', function () { hideOn(false); });
  document.addEventListener('visibilitychange', function () { hideOn(document.hidden); });

  // developer tools: docked window-size change + console-inspection probe
  var dtOpen = false, probe = new Image();
  Object.defineProperty(probe, 'id', { get: function () { probe.hit = true; return ''; } });
  function dtCheck() {
    var big = (outerWidth - innerWidth > 170) || (outerHeight - innerHeight > 190);
    probe.hit = false; try { console.debug(probe); } catch (e) {}
    var open = big || probe.hit;
    if (open && !dtOpen) { dtOpen = true; $('bkr-dt').classList.add('show'); report('devtools', big ? 'docked' : 'console'); }
    else if (!open && dtOpen) { dtOpen = false; $('bkr-dt').classList.remove('show'); }
  }
  setInterval(dtCheck, 1000);

  init();
})();
