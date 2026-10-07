/**
 * book-client.js — shared browser code for the Haryana LEET Book (landing, login, reader, checkout).
 * Talks only to /api/book/* (server checks everything; this file never decides access or price).
 */
(function (w) {
  'use strict';
  var LS = w.localStorage, TOKEN_KEY = 'bk_token', USER_KEY = 'bk_user', DEV_KEY = 'bk_dev';

  function lsGet(k) { try { return LS.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { LS.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { LS.removeItem(k); } catch (e) {} }
  function rand(n) {
    var a = new Uint8Array(n); (w.crypto || w.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  var BOOK = {
    deviceId: function () {
      var d = lsGet(DEV_KEY);
      if (!d || !/^[A-Za-z0-9_-]{8,64}$/.test(d)) { d = 'd' + rand(12); lsSet(DEV_KEY, d); }
      return d;
    },
    fingerprint: function () {
      var s = [navigator.userAgent, navigator.language, screen.width + 'x' + screen.height, screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.hardwareConcurrency || '', navigator.platform || ''].join('|');
      var h = 0; for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
      return 'f' + (h >>> 0).toString(16);
    },
    token: function () { return lsGet(TOKEN_KEY); },
    user: function () { try { return JSON.parse(lsGet(USER_KEY) || 'null'); } catch (e) { return null; } },
    setSession: function (token, user) { lsSet(TOKEN_KEY, token); lsSet(USER_KEY, JSON.stringify(user)); },
    setUser: function (user) { lsSet(USER_KEY, JSON.stringify(user)); },
    logout: function () { lsDel(TOKEN_KEY); lsDel(USER_KEY); },
    loggedIn: function () { return !!lsGet(TOKEN_KEY); },

    /** JSON API call. opts: {method, body, auth(default true)} */
    api: function (path, opts) {
      opts = opts || {};
      var headers = { 'Content-Type': 'application/json' };
      if (opts.auth !== false && BOOK.token()) headers.Authorization = 'Bearer ' + BOOK.token();
      return fetch('/api/book/' + path, {
        method: opts.method || (opts.body ? 'POST' : 'GET'), headers: headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined, cache: 'no-store', credentials: 'omit'
      }).then(function (r) {
        return r.json().catch(function () { return { ok: false, error: 'Server error', code: 'server' }; }).then(function (d) {
          d.httpStatus = r.status;
          if (r.status === 401 && (d.code === 'auth' || d.code === 'device_revoked')) { BOOK.logout(); }
          return d;
        });
      }).catch(function () { return { ok: false, error: 'Network error. Check your connection.', code: 'network' }; });
    },

    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    rupee: function (n) { return '₹' + Number(n).toLocaleString('en-IN'); },

    loadRazorpay: function () {
      return new Promise(function (res, rej) {
        if (typeof w.Razorpay === 'function') return res();
        var s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = res; s.onerror = function () { rej(new Error('Payment gateway could not be loaded.')); };
        document.head.appendChild(s);
      });
    },

    /** Checkout modal: plan choice, coupon, price breakdown, Razorpay. onDone() after access is granted. */
    openCheckout: function (defaultPlan, onDone) {
      if (!BOOK.loggedIn()) { location.href = '/book-login?next=buy'; return; }
      var plan = defaultPlan === 'pdf' ? 'pdf' : 'reader', couponApplied = '', busy = false, prices = null;
      var host = document.createElement('div');
      host.className = 'bk-modal';
      host.innerHTML =
        '<div class="bk-modal-card" role="dialog" aria-modal="true" aria-label="Buy Haryana LEET Book">' +
        '<button class="bk-x" aria-label="Close">&times;</button>' +
        '<h3>Get the Complete Book</h3><p class="bk-sub">Haryana LEET 2027 — Complete Study Guide · 1,633 pages</p>' +
        '<div class="bk-plans">' +
        '<label class="bk-plan"><input type="radio" name="bkplan" value="reader"><span><b>Online Reader</b><small>Read on hsbteleet.com · access until LEET 2027 cycle ends</small></span><em data-p="reader"></em></label>' +
        '<label class="bk-plan"><input type="radio" name="bkplan" value="pdf"><span><b>Reader + PDF copy by email</b><small>Personal watermarked PDF sent to your email within 24 hours</small></span><em data-p="pdf"></em></label>' +
        '</div>' +
        '<div class="bk-coupon"><input id="bkc" placeholder="Coupon code" autocomplete="off" maxlength="40"><button type="button" id="bkca">Apply</button></div>' +
        '<div class="bk-msg" id="bkmsg"></div>' +
        '<div class="bk-rows" id="bkrows"></div>' +
        '<button class="bk-pay" id="bkpay" type="button">Loading…</button>' +
        '<p class="bk-fine">Secure payment by Razorpay. By paying you accept the <a href="/terms#s13" target="_blank" rel="noopener">Terms &amp; Conditions</a> (no download / copy / screenshot; one account, max 2 devices).</p>' +
        '</div>';
      document.body.appendChild(host);
      document.body.classList.add('bk-lock');
      var $ = function (s) { return host.querySelector(s); };
      function close() { host.remove(); document.body.classList.remove('bk-lock'); }
      $('.bk-x').onclick = close; host.addEventListener('mousedown', function (e) { if (e.target === host) close(); });

      var lastQuote = null;
      function render() {
        $('input[value="' + plan + '"]').checked = true;
        BOOK.api('quote', { body: { plan: plan, coupon: couponApplied } }).then(function (d) {
          if (!d.ok) {
            if (d.code === 'owned') { close(); onDone && onDone(); return; }
            $('#bkpay').textContent = 'Unavailable'; $('#bkmsg').textContent = d.error || 'Could not load the price.'; $('#bkmsg').className = 'bk-msg err'; return;
          }
          var q = d.quote; lastQuote = q;
          ['reader', 'pdf'].forEach(function (p) {
            var el = host.querySelector('[data-p="' + p + '"]'); if (!el) return;
            var pr = prices || {}, list = p === 'pdf' ? (q.ultra ? pr.pdfUltraPrice : pr.pdfPrice) : (q.ultra ? pr.ultraPrice : pr.price);
            el.innerHTML = '<s>' + BOOK.rupee(q.mrp) + '</s> ' + BOOK.rupee(p === q.plan && !couponApplied ? q.final : (list || q.final));
          });
          var rows = '<div><span>Book MRP</span><span><s>' + BOOK.rupee(q.mrp) + '</s></span></div>' +
            '<div><span>Launch price</span><span>' + BOOK.rupee(q.base) + '</span></div>';
          if (q.ultra) rows += '<div class="ok"><span>Ultra Premium member discount</span><span>−' + BOOK.rupee(q.ultraOff) + '</span></div>';
          if (q.coupon) rows += '<div class="ok"><span>Coupon ' + BOOK.esc(q.coupon.code) + ' (' + BOOK.esc(q.coupon.label) + ')</span><span>−' + BOOK.rupee(q.couponOff) + '</span></div>';
          rows += '<div class="tot"><span>You pay</span><span>' + (q.final ? BOOK.rupee(q.final) : 'FREE') + '</span></div>';
          $('#bkrows').innerHTML = rows;
          $('#bkpay').textContent = q.final ? 'Pay ' + BOOK.rupee(q.final) + ' securely' : 'Get the book free';
          if (q.couponError) { $('#bkmsg').textContent = q.couponError; $('#bkmsg').className = 'bk-msg err'; }
          else if (q.coupon) { $('#bkmsg').textContent = '✅ Coupon applied: ' + q.coupon.label; $('#bkmsg').className = 'bk-msg good'; }
          else if (q.ultra) { $('#bkmsg').textContent = '🎖 Ultra Premium discount applied automatically.'; $('#bkmsg').className = 'bk-msg good'; }
          else { $('#bkmsg').textContent = 'Ultra Premium members get the book for ₹299. Have a coupon? Enter it above.'; $('#bkmsg').className = 'bk-msg'; }
        });
      }
      host.querySelectorAll('input[name="bkplan"]').forEach(function (r) { r.onchange = function () { plan = r.value; render(); }; });
      $('#bkca').onclick = function () { couponApplied = $('#bkc').value.trim(); render(); };
      $('#bkc').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('#bkca').click(); } });

      $('#bkpay').onclick = function () {
        if (busy || !lastQuote) return; busy = true; $('#bkpay').textContent = 'Please wait…';
        BOOK.api('order', { body: { plan: plan, coupon: couponApplied } }).then(function (o) {
          if (!o.ok) { busy = false; render(); $('#bkmsg').textContent = o.error || 'Could not start payment.'; $('#bkmsg').className = 'bk-msg err'; return; }
          if (o.free) { close(); onDone && onDone(true); return; }
          BOOK.loadRazorpay().then(function () {
            var rz = new w.Razorpay({
              key: o.key, amount: o.amount, currency: 'INR', order_id: o.orderId, name: 'HSBTE LEET', description: 'Haryana LEET Complete Study Guide',
              prefill: { name: o.name, email: o.email, contact: o.contact }, theme: { color: '#1a56db' },
              handler: function (r) {
                $('#bkpay').textContent = 'Confirming payment…';
                BOOK.api('verify', { body: r }).then(function (v) {
                  busy = false;
                  if (v.ok) { close(); onDone && onDone(true, plan); }
                  else { $('#bkmsg').textContent = v.error || 'Payment verification failed. Contact support with your payment id.'; $('#bkmsg').className = 'bk-msg err'; }
                });
              },
              modal: { ondismiss: function () { busy = false; render(); } }
            });
            rz.open();
          }).catch(function (e) { busy = false; render(); $('#bkmsg').textContent = e.message; $('#bkmsg').className = 'bk-msg err'; });
        });
      };
      BOOK.api('me').then(function (d) { if (d.ok) prices = d.prices; render(); });
    }
  };
  w.BOOK = BOOK;
})(window);
