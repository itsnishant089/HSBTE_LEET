/**
 * premium-security.js  — Ultra-High Security for HSBTE LEET Premium Pages
 * Blocks: copy, cut, paste, select-all, print (Ctrl+P / browser), save,
 *         view-source, devtools (F12 / Ctrl+Shift+I/J/C/K/S), screenshots
 *         (PrintScreen / Win+Shift+S pattern), drag-to-copy, and text selection.
 * Shows a "Security Violation Detected" overlay on any violation attempt.
 * Shows a "Developer Tools Detected" overlay when devtools are open.
 * Logs every violation to Supabase security_violations table automatically.
 */
(function () {
  'use strict';

  /* ── 1. INJECT SECURITY STYLES ────────────────────────────────── */
  var css = document.createElement('style');
  css.textContent = [
    /* Disable text selection everywhere inside .quiz-body / body */
    'body { -webkit-user-select:none!important; -moz-user-select:none!important;',
    '       -ms-user-select:none!important; user-select:none!important; -webkit-touch-callout:none!important; }',
    'input, textarea, select, [contenteditable="true"] { -webkit-user-select:text!important; user-select:text!important; }',
    '::selection { background:transparent!important; color:inherit!important; }',
    /* Screenshot deterrent: content is blurred whenever the window loses focus or is hidden */
    'html.sec-blur body > *:not(#sec-violation-overlay):not(#sec-devtools-overlay) { filter:blur(22px)!important; pointer-events:none!important; }',

    /* Print — hide everything */
    '@media print { html,body { display:none!important; visibility:hidden!important; } }',

    /* Violation overlay */
    '#sec-violation-overlay {',
    '  display:none; position:fixed; inset:0; z-index:2147483647;',
    '  background:rgba(0,0,0,.92); align-items:center; justify-content:center;',
    '}',
    '#sec-violation-overlay.show { display:flex; }',
    '.sec-vio-box {',
    '  background:#dc2626; border-radius:14px; padding:32px 36px;',
    '  text-align:center; max-width:420px; animation:secShake .4s ease;',
    '}',
    '.sec-vio-box h2 { color:#fff; font-size:1.35rem; font-weight:800; margin-bottom:10px; }',
    '.sec-vio-box p  { color:#fecaca; font-size:.95rem; margin-bottom:8px; line-height:1.6; }',
    '.sec-vio-box small { color:#fca5a5; font-size:.82rem; }',
    '@keyframes secShake {',
    '  0%,100%{transform:translateX(0)}',
    '  20%,60%{transform:translateX(-8px)}',
    '  40%,80%{transform:translateX(8px)}',
    '}',

    /* DevTools overlay */
    '#sec-devtools-overlay {',
    '  display:none; position:fixed; inset:0; z-index:2147483646;',
    '  background:#0f172a; align-items:center; justify-content:center;',
    '}',
    '#sec-devtools-overlay.show { display:flex; }',
    '.sec-dt-box {',
    '  background:#1e293b; border:1px solid #334155; border-radius:18px;',
    '  padding:40px 44px; text-align:center; max-width:480px;',
    '}',
    '.sec-dt-icon { font-size:2.8rem; margin-bottom:16px; }',
    '.sec-dt-box h2 { color:#ef4444; font-size:1.5rem; font-weight:800; margin-bottom:14px; }',
    '.sec-dt-box p  { color:#cbd5e1; font-size:.97rem; line-height:1.7; margin-bottom:10px; }',
    '.sec-dt-box small { color:#64748b; font-size:.85rem; }',
  ].join('\n');
  document.head.appendChild(css);

  /* ── 2. CREATE OVERLAYS ────────────────────────────────────────── */
  function buildOverlays() {
    // Violation overlay
    var vo = document.createElement('div');
    vo.id = 'sec-violation-overlay';
    vo.innerHTML =
      '<div class="sec-vio-box">' +
        '<h2>🚫 Security Violation Detected</h2>' +
        '<p>Screenshots and copying are strictly prohibited.</p>' +
        '<small>This action has been logged on our servers.</small>' +
      '</div>';
    document.body.appendChild(vo);

    // DevTools overlay
    var dto = document.createElement('div');
    dto.id = 'sec-devtools-overlay';
    dto.innerHTML =
      '<div class="sec-dt-box">' +
        '<div class="sec-dt-icon">🛡️</div>' +
        '<h2>Developer Tools Detected</h2>' +
        '<p>Access to this application is restricted while developer tools are active.' +
           ' We enforce strict security measures to maintain the integrity of our platform and mock tests.</p>' +
        '<small>This page will automatically unlock when you close the developer tools.</small>' +
      '</div>';
    document.body.appendChild(dto);
  }

  /* ── 3. SUPABASE VIOLATION LOGGER ──────────────────────────────── */
  /* Rate-limit: max 1 log per violation type per 30 seconds to avoid spam */
  var _loggedRecently = {};

  function logViolation(violationType) {
    /* Rate-limit check */
    var now = Date.now();
    if (_loggedRecently[violationType] && (now - _loggedRecently[violationType]) < 30000) {
      return; /* Already logged this type within last 30s — skip */
    }
    _loggedRecently[violationType] = now;

    /* Try window.__logViolation first (set by admin portal if loaded) */
    if (typeof window.__logViolation === 'function') {
      try { window.__logViolation(violationType, document.title); } catch(e) {}
      return;
    }

    /* Direct Supabase insert — wait for supabase client to be available */
    var attempts = 0;
    function tryLog() {
      attempts++;
      /* Get Supabase credentials from window (set by premium-sample-paper pages) */
      var supabaseLib = window.supabase;
      var url  = window.SUPA_URL || 'https://vzfpltvchsxsfqlldafd.supabase.co';
      var key  = window.SUPA_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZnBsdHZjaHN4c2ZxbGxkYWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTY3NzksImV4cCI6MjA4ODczMjc3OX0.u9oVBYup_-OdTuY2i14sHGQIvZ4gKReMS919_7zxqCA';

      if (!supabaseLib) {
        if (attempts < 10) { setTimeout(tryLog, 500); } /* retry for 5s */
        return;
      }

      try {
        var sb = window.sb && typeof window.sb.from === 'function'
          ? window.sb
          : (supabaseLib.createClient ? supabaseLib.createClient(url, key) : null);
        if (!sb) return;

        /* Get user info from sessionStorage */
        var uid  = sessionStorage.getItem('prem_uid')  || null;
        var mob  = sessionStorage.getItem('prem_mob')  || '';
        var name = sessionStorage.getItem('prem_name') || '';

        /* Build device info (short) */
        var ua = (navigator.userAgent || '').substring(0, 200);

        /* Page context: use PAPER_TITLE if defined on the page, else document title */
        var pageCtx = (typeof window.PAPER_TITLE !== 'undefined' ? window.PAPER_TITLE : document.title) || 'Unknown Page';

        sb.from('security_violations').insert([{
          user_id:        uid,
          violation_type: violationType,
          page_context:   pageCtx,
          device_info:    ua,
          ip_address:     'client-side',
          created_at:     new Date().toISOString()
        }]).then(function(res) {
          if (res && res.error) {
            /* Never alert the user, but keep a trace so the owner can debug RLS/table problems */
            try { console.warn('[security] violation log failed:', res.error.message); localStorage.setItem('sec_log_err', res.error.message); } catch (_) {}
          }
        }).catch(function() { /* silent */ });

      } catch(e) { /* silent */ }
    }

    setTimeout(tryLog, 100); /* slight delay to let page scripts initialize */
  }

  /* ── 4. (EMAIL REMOVED) — Admin can manually send warning/ban from admin portal ── */

  /* ── 5. SHOW / HIDE VIOLATION ──────────────────────────────────── */
  var vioTimer = null;
  function flashViolation(violationType) {
    var el = document.getElementById('sec-violation-overlay');
    if (!el) return;
    el.classList.add('show');
    clearTimeout(vioTimer);
    vioTimer = setTimeout(function () { el.classList.remove('show'); }, 2500);

    /* Log to Supabase */
    if (violationType) { logViolation(violationType); }
  }

  /* ── 6. KEYBOARD BLOCK ─────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    var k = e.key;
    var ctrl = e.ctrlKey || e.metaKey;
    var shift = e.shiftKey;

    /* ---- Copy / Cut / Paste / Select-all ---- */
    if (ctrl && ['c','C','x','X','v','V','a','A'].includes(k)) {
      e.preventDefault(); e.stopPropagation();
      return; /* silently blocked: no popup, no log */
    }

    /* ---- Save / Print / View-source ---- */
    if (ctrl && ['s','S','p','P','u','U'].includes(k)) {
      e.preventDefault(); e.stopPropagation();
      return; /* silently blocked: no popup, no log */
    }

    /* ---- DevTools shortcuts ---- */
    if (k === 'F12') { e.preventDefault(); e.stopPropagation(); logViolation('devtools-f12'); return; }
    if (ctrl && shift && ['i','I','j','J','c','C','k','K','s','S','m','M','e','E'].includes(k)) {
      e.preventDefault(); e.stopPropagation(); logViolation('devtools-shortcut'); return;
    }

    /* ---- PrintScreen ---- */
    if (k === 'PrintScreen' || k === 'Print') {
      e.preventDefault(); e.stopPropagation();
      flashViolation('printscreen');
      try { navigator.clipboard.writeText(''); } catch (_) {}
      return;
    }

    /* ---- Windows Snipping: Win+Shift+S ---- */
    if (e.metaKey && shift && (k === 's' || k === 'S')) {
      e.preventDefault(); e.stopPropagation();
      flashViolation('screenshot-snip'); return;
    }

    /* ---- Drag ---- */
    if (k === 'F2' || k === 'F1') { e.preventDefault(); return; }
  }, true);

  /* ── 7. MOUSE / TOUCH EVENTS ───────────────────────────────────── */
  document.addEventListener('keyup', function (e) {
    if (e.key === 'PrintScreen') { flashViolation('printscreen'); try { navigator.clipboard.writeText(''); } catch (_) {} }
  }, true);
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); e.stopPropagation(); }, true);
  document.addEventListener('copy',   function (e) { e.preventDefault(); e.stopPropagation(); if (e.clipboardData) e.clipboardData.setData('text/plain', ''); }, true);
  document.addEventListener('cut',    function (e) { e.preventDefault(); e.stopPropagation(); }, true);
  document.addEventListener('paste',  function (e) { e.preventDefault(); e.stopPropagation(); }, true);
  document.addEventListener('dragstart', function (e) { e.preventDefault(); }, true);
  document.addEventListener('drag',      function (e) { e.preventDefault(); }, true);

  /* ── 8. DEVTOOLS DETECTION ─────────────────────────────────────── */
  var devtoolsOpen = false;

  function checkDevTools() {
    var threshold = 160;
    var widthDiff  = window.outerWidth  - window.innerWidth;
    var heightDiff = window.outerHeight - window.innerHeight;
    var isOpen = widthDiff > threshold || heightDiff > threshold;

    if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
      isOpen = true;
    }

    var dtOverlay = document.getElementById('sec-devtools-overlay');
    var mainPage  = document.getElementById('main-page');

    if (isOpen && !devtoolsOpen) {
      devtoolsOpen = true;
      if (dtOverlay) dtOverlay.classList.add('show');
      if (mainPage)  mainPage.style.visibility = 'hidden';
      logViolation('devtools-open'); /* Log to Supabase */
    } else if (!isOpen && devtoolsOpen) {
      devtoolsOpen = false;
      if (dtOverlay) dtOverlay.classList.remove('show');
      if (mainPage)  mainPage.style.visibility = 'visible';
    }
  }

  /* Secondary devtools detection via debugger timing */
  function devtoolsTimingCheck() {
    var start = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    var elapsed = performance.now() - start;
    if (elapsed > 100) {
      var dtOverlay = document.getElementById('sec-devtools-overlay');
      var mainPage  = document.getElementById('main-page');
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        if (dtOverlay) dtOverlay.classList.add('show');
        if (mainPage)  mainPage.style.visibility = 'hidden';
        logViolation('devtools-debugger');
      }
    }
  }

  setInterval(checkDevTools, 800);
  setInterval(devtoolsTimingCheck, 3000);

  /* ── 9. VISIBILITY CHANGE — screenshot detection ───────────────── */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      /* User came back from another app — possible screenshot taken */
      if (typeof injectWatermark === 'function') { injectWatermark(); }
    }
  });

  /* ── 9b. BLUR WHEN WINDOW LOSES FOCUS (snipping tools, other apps) ─ */
  function setBlur(on) { document.documentElement.classList[on ? 'add' : 'remove']('sec-blur'); }
  window.addEventListener('blur', function () { setBlur(true); });
  window.addEventListener('focus', function () { setBlur(false); });
  document.addEventListener('visibilitychange', function () { setBlur(document.hidden); });
  document.addEventListener('selectstart', function (e) {
    var t = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    e.preventDefault();
  }, true);

  /* ── 10. PRINT BUTTON INTERCEPTION ────────────────────────────── */
  window.addEventListener('beforeprint', function () {
    logViolation('print-attempt');
    document.body.innerHTML +=
      '<div style="position:fixed;inset:0;background:#000;z-index:9999999;color:#fff;' +
      'display:flex;align-items:center;justify-content:center;font-size:1.5rem">' +
      'Printing is not allowed on premium pages.</div>';
  });

  /* ── 11. EXPOSE logViolation globally for premium-admin.js ─────── */
  /* Admin portal's setupViolationLogger() can also call this */
  window.__secLogViolation = logViolation;

  /* ── 12. INIT ────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildOverlays);
  } else {
    buildOverlays();
  }

})();
