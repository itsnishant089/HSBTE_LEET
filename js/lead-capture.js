(function () {
  'use strict';
  try {
    if (localStorage.getItem('leetLeadCaptured') === '1') {
      return;
    }
  } catch (e) { }
  var SUPABASE_URL = 'https://jnsowbnkccddcrkuonan.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impuc293Ym5rY2NkZGNya3VvbmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjY0MzksImV4cCI6MjA4NzcwMjQzOX0.PbiJI8SOxjgDPAP0njNN8aIW3yArJmstxi_VRhPuM5k';
  /* EmailJS config for welcome message after lead capture */
  var EJS_SERVICE_ID = 'service_zlxv3q4';
  var EJS_TEMPLATE_ID = 'template_j4m5ute';
  var EJS_PUBLIC_KEY = 'byFleJ2hV770O_Mni';
  var ejsLoaded = false;
  var ejsLoading = false;
  var supabaseClient = null;
  var supabaseLoading = false;
  var supabaseReadyCallbacks = [];
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }
  function ensureStylesheet() {
    if (document.querySelector('link[data-leet-modal="1"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/lead-modal.css';
    link.setAttribute('data-leet-modal', '1');
    (document.head || document.documentElement).appendChild(link);
  }
  function ensureFont() {
    if (document.querySelector('link[data-leet-font="1"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap';
    link.setAttribute('data-leet-font', '1');
    (document.head || document.documentElement).appendChild(link);
  }
  function ensureSupabaseLoaded(callback) {
    if (typeof callback !== 'function') callback = function () { };
    if (window.supabase) { callback(null); return; }
    supabaseReadyCallbacks.push(callback);
    if (supabaseLoading) return;
    supabaseLoading = true;
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.48.0/dist/umd/supabase.js';
    script.async = true;
    script.onload = function () {
      supabaseLoading = false;
      var cbs = supabaseReadyCallbacks.slice();
      supabaseReadyCallbacks = [];
      cbs.forEach(function (cb) { try { cb(null); } catch (e) { console.error('Supabase callback error:', e); } });
    };
    script.onerror = function () {
      supabaseLoading = false;
      console.error('Failed to load Supabase JS library.');
      var cbs = supabaseReadyCallbacks.slice();
      supabaseReadyCallbacks = [];
      cbs.forEach(function (cb) { try { cb(new Error('supabase_load_failed')); } catch (e) { console.error('Supabase error callback error:', e); } });
    };
    (document.head || document.documentElement).appendChild(script);
  }
  function getSupabaseClient() {
    if (!supabaseClient) {
      if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Supabase client not available or env vars missing.');
        return null;
      }
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
  }
  function setMessage(text, type) {
    var msgEl = qs('#leet-modal-message');
    if (!msgEl) return;
    msgEl.textContent = text || '';
    msgEl.className = 'leet-modal-message';
    if (type === 'error') msgEl.classList.add('leet-modal-message--error');
    if (type === 'success') msgEl.classList.add('leet-modal-message--success');
  }
  function setInputState(inputEl, state) {
    if (!inputEl) return;
    inputEl.classList.remove('leet-input--error', 'leet-input--success');
    if (state) inputEl.classList.add('leet-input--' + state);
  }
  function validateForm(form) {
    var name = (form.elements.name.value || '').trim();
    var mobile = (form.elements.mobile.value || '').trim();
    var college = (form.elements.college.value || '').trim();
    var branch = (form.elements.branch.value || '').trim();
    var email = (form.elements.email.value || '').trim();
    var preparation = form.elements.preparation.value;
    ['leet-name', 'leet-mobile', 'leet-college', 'leet-branch', 'leet-email', 'leet-preparation'].forEach(function (id) {
      setInputState(qs('#' + id), null);
    });
    if (!name) {
      setInputState(qs('#leet-name'), 'error');
      return 'Name is required.';
    }
    if (!mobile) {
      setInputState(qs('#leet-mobile'), 'error');
      return 'Mobile Number is required.';
    }
    if (!/^\d{10,15}$/.test(mobile)) {
      setInputState(qs('#leet-mobile'), 'error');
      return 'Please enter a valid mobile number (10–15 digits).';
    }
    if (!college) {
      setInputState(qs('#leet-college'), 'error');
      return 'College Name is required.';
    }
    if (college.length > 200) {
      setInputState(qs('#leet-college'), 'error');
      return 'College name is too long (max 200 characters).';
    }
    if (!branch) {
      setInputState(qs('#leet-branch'), 'error');
      return 'Branch is required.';
    }
    if (branch.length > 200) {
      setInputState(qs('#leet-branch'), 'error');
      return 'Branch name is too long (max 200 characters).';
    }
    if (!email) {
      setInputState(qs('#leet-email'), 'error');
      return 'Email is required.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInputState(qs('#leet-email'), 'error');
      return 'Please enter a valid email address.';
    }
    if (!preparation) {
      setInputState(qs('#leet-preparation'), 'error');
      return 'Please select what you are preparing for.';
    }
    return null;
  }
  function showModal() {
    var overlay = qs('#leet-lead-modal-overlay');
    var dialog = overlay && qs('.leet-modal', overlay);
    if (!overlay || !dialog) return;
    overlay.classList.remove('leet-modal-hidden');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.__openedAt = Date.now();
    try { sessionStorage.setItem('leetLeadModalShown', '1'); } catch (e) { }
    var firstInput = qs('input, select', dialog);
    if (firstInput && typeof firstInput.focus === 'function') {
      setTimeout(function () { firstInput.focus(); }, 80);
    }
  }
  function hideModal() {
    var overlay = qs('#leet-lead-modal-overlay');
    if (!overlay) return;
    overlay.classList.add('leet-modal-hidden');
    overlay.setAttribute('aria-hidden', 'true');
  }
  function shouldShowModalThisSession() {
    try { return sessionStorage.getItem('leetLeadModalShown') !== '1'; } catch (e) { return true; }
  }
  function handleOverlayClick(event) {
    var overlay = qs('#leet-lead-modal-overlay');
    if (!overlay) return;
    if (Date.now() - (overlay.__openedAt || 0) < 400) return;
    if (event.target === overlay) hideModal();
  }
  function handleKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Esc') hideModal();
  }
  /* ── Load EmailJS SDK dynamically ── */
  function ensureEmailJS(cb) {
    if (typeof emailjs !== 'undefined' && ejsLoaded) { cb(); return; }
    if (ejsLoading) { setTimeout(function () { ensureEmailJS(cb); }, 150); return; }
    ejsLoading = true;
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.async = true;
    s.onload = function () {
      try { emailjs.init(EJS_PUBLIC_KEY); } catch (e) { }
      ejsLoaded = true;
      ejsLoading = false;
      cb();
    };
    s.onerror = function () { ejsLoading = false; /* silent fail */ };
    document.head.appendChild(s);
  }
  /* ── Send welcome email via EmailJS after successful lead capture ── */
  // ═══════════════════════════════════════════════════════════
  //  SHARED HELPERS
  // ═══════════════════════════════════════════════════════════

  function nowStr() {
    var d = new Date();
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  function firstName(fullName) {
    return (fullName || 'Student').split(' ')[0];
  }

  // ═══════════════════════════════════════════════════════════
  //  SHARED EMAIL SHELL
  //  All emails use table-based layout — 100% inline styles
  //  Gmail/Outlook/mobile safe
  // ═══════════════════════════════════════════════════════════

  function emailShell(bodyContent) {
    return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
      + '<html xmlns="http://www.w3.org/1999/xhtml"><head>'
      + '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>'
      + '<meta name="viewport" content="width=device-width, initial-scale=1.0"/>'
      + '<meta name="x-apple-disable-message-reformatting"/>'
      + '</head>'
      + '<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;min-height:100vh;">'
      + '<tr><td align="center" style="padding:32px 16px;">'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;">'
      + bodyContent
      + '</table>'
      + '</td></tr></table>'
      + '</body></html>';
  }

  // Logo bar
  function logoRow() {
    return '<tr><td align="center" style="padding-bottom:18px;">'
      + '<span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#111111;letter-spacing:-0.3px;">'
      + 'HSBT<span style="color:#f5a623;">LEET</span>.com'
      + '</span>'
      + '</td></tr>';
  }

  // Colored top strip
  function topStrip(color) {
    return '<tr><td style="background:' + color + ';height:4px;border-radius:12px 12px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>';
  }

  // Section label
  function sectionLabel(text, color) {
    return '<p style="margin:0 0 6px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:' + (color || '#9ca3af') + ';">' + text + '</p>';
  }

  // Info table row
  function infoRow(label, value, valueColor) {
    return '<tr>'
      + '<td style="padding:9px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#9ca3af;width:120px;vertical-align:top;">' + label + '</td>'
      + '<td style="padding:9px 0;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600;color:' + (valueColor || '#111111') + ';text-align:right;word-break:break-all;">' + value + '</td>'
      + '</tr>';
  }

  // CTA Button
  function ctaBtn(href, text, bgColor, textColor) {
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:10px;">'
      + '<tr><td align="center">'
      + '<a href="' + href + '" style="display:block;padding:14px 24px;background:' + bgColor + ';color:' + (textColor || '#ffffff') + ';font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;text-align:center;">' + text + '</a>'
      + '</td></tr></table>';
  }

  // Footer
  function emailFooter(links) {
    var linkHtml = links.map(function (l) {
      return '<a href="' + l.href + '" style="color:#9ca3af;text-decoration:none;font-size:11.5px;">' + l.label + '</a>';
    }).join('<span style="color:#d1d5db;margin:0 8px;">·</span>');
    return '<tr><td style="padding:20px 0 4px;text-align:center;border-top:1px solid #e5e7eb;">'
      + '<p style="margin:0 0 6px 0;">' + linkHtml + '</p>'
      + '<p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.8;">'
      + '&copy; 2025 HSBTELEET.com &nbsp;&middot;&nbsp; Made with &#10084;&#65039; by <a href="https://itsnishant.com" style="color:#9ca3af;text-decoration:none;">Nishant</a>'
      + '</p></td></tr>';
  }

  // ═══════════════════════════════════════════════════════════
  //  EMAIL 1 — FREE WELCOME (Lead Capture)
  //  → Student ke email pe jaata hai
  // ═══════════════════════════════════════════════════════════

  function buildWelcomeHTML(data) {
    var name = data.name || 'Student';
    var fn = firstName(name);
    var branch = data.branch || '';
    var college = data.college || '';
    var prep = data.preparation || '';

    // Chips
    var chips = '';
    if (prep) chips += '<span style="display:inline-block;background:#fef3c7;border:1px solid #fcd34d;border-radius:20px;padding:3px 11px;font-size:11.5px;font-weight:600;color:#92400e;margin:2px 4px 2px 0;">&#127891; ' + prep + '</span>';
    if (branch) chips += '<span style="display:inline-block;background:#d1fae5;border:1px solid #6ee7b7;border-radius:20px;padding:3px 11px;font-size:11.5px;font-weight:600;color:#065f46;margin:2px 4px 2px 0;">&#128218; ' + branch + '</span>';
    if (college) chips += '<span style="display:inline-block;background:#f3f4f6;border:1px solid #d1d5db;border-radius:20px;padding:3px 11px;font-size:11.5px;font-weight:600;color:#6b7280;margin:2px 4px 2px 0;">&#127979; ' + college + '</span>';

    var body =
      logoRow()

      // ── CARD ──
      + '<tr><td style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'
      + topStrip('linear-gradient(90deg,#f5a623,#fb923c)')

      // Header block
      + '<tr><td style="padding:28px 28px 20px 28px;background:linear-gradient(135deg,#fffbf0 0%,#fff 60%);">'
      + sectionLabel('&#10022; Welcome Aboard', '#f5a623')
      + '<h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:26px;font-weight:700;color:#111111;line-height:1.2;">Hey ' + fn + ', glad<br/>you\'re here! &#127881;</h1>'
      + '<p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">You\'ve joined <strong style="color:#374151;">hsbteleet.com</strong> — Haryana\'s most organized free resource for <strong style="color:#374151;">LEET &amp; HSBTE</strong> exam prep.</p>'
      + '</td></tr>'

      // Chips
      + (chips ? '<tr><td style="padding:0 28px 16px 28px;">' + chips + '</td></tr>' : '')

      // Greeting message
      + '<tr><td style="padding:0 28px 20px 28px;">'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'
      + '<tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-left:3px solid #f5a623;border-radius:8px;padding:16px 18px;">'
      + '<p style="margin:0;font-size:13.5px;color:#6b7280;line-height:1.8;">Hey <strong style="color:#111111;">' + name + '!</strong> &#128075; Whether you\'re targeting <strong style="color:#111111;">Haryana LEET</strong> or need <strong style="color:#111111;">HSBTE PYQs</strong> for any branch — we\'ve organized everything so you can focus on <strong style="color:#111111;">studying smart.</strong> &#128640;</p>'
      + '</td></tr></table>'
      + '</td></tr>'

      // Stats
      + '<tr><td style="padding:0 28px 20px 28px;">'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'
      + '<tr>'
      + '<td width="33%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 8px;text-align:center;"><div style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#f5a623;line-height:1;">500+</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-top:4px;">PYQs</div></td>'
      + '<td width="4" style="padding:0;font-size:0;">&nbsp;</td>'
      + '<td width="33%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 8px;text-align:center;"><div style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#059669;line-height:1;">10+</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-top:4px;">Branches</div></td>'
      + '<td width="4" style="padding:0;font-size:0;">&nbsp;</td>'
      + '<td width="33%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 8px;text-align:center;"><div style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#f59e0b;line-height:1;">&#8734;</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-top:4px;">Free</div></td>'
      + '</tr></table>'
      + '</td></tr>'

      // Resources
      + '<tr><td style="padding:0 28px 20px 28px;">'
      + '<p style="margin:0 0 12px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;">&#128218; Quick Access</p>'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'
      + '<tr>'
      + '<td width="49%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;vertical-align:top;"><a href="https://hsbteleet.com/syllabus/syllabus.html" style="text-decoration:none;"><div style="font-size:18px;margin-bottom:5px;">&#128203;</div><div style="font-size:13px;font-weight:700;color:#111111;margin-bottom:2px;">Syllabus</div><div style="font-size:11.5px;color:#9ca3af;">Full LEET syllabus, topic-wise</div></a></td>'
      + '<td width="2%" style="font-size:0;">&nbsp;</td>'
      + '<td width="49%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;vertical-align:top;"><a href="https://hsbteleet.com/haryanaleet" style="text-decoration:none;"><div style="font-size:18px;margin-bottom:5px;">&#128221;</div><div style="font-size:13px;font-weight:700;color:#111111;margin-bottom:2px;">Haryana LEET</div><div style="font-size:11.5px;color:#9ca3af;">Sample papers &amp; practice sets</div></a></td>'
      + '</tr>'
      + '<tr><td colspan="3" style="padding-top:6px;font-size:0;">&nbsp;</td></tr>'
      + '<tr>'
      + '<td width="49%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;vertical-align:top;"><a href="https://hsbteleet.com/hsbte-pyq" style="text-decoration:none;"><div style="font-size:18px;margin-bottom:5px;">&#128194;</div><div style="font-size:13px;font-weight:700;color:#111111;margin-bottom:2px;">HSBTE PYQ</div><div style="font-size:11.5px;color:#9ca3af;">Previous year questions</div></a></td>'
      + '<td width="2%" style="font-size:0;">&nbsp;</td>'
      + '<td width="49%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;vertical-align:top;"><a href="https://hsbteleet.com" style="text-decoration:none;"><div style="font-size:18px;margin-bottom:5px;">&#127968;</div><div style="font-size:13px;font-weight:700;color:#111111;margin-bottom:2px;">Homepage</div><div style="font-size:11.5px;color:#9ca3af;">All resources &amp; updates</div></a></td>'
      + '</tr></table>'
      + '</td></tr>'

      // CTA
      + '<tr><td style="padding:0 28px 20px 28px;">'
      + ctaBtn('https://hsbteleet.com', '&#128640; Start Preparing Now &rarr;', '#f5a623', '#ffffff')
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'
      + '<tr>'
      + '<td align="center" style="font-size:12px;color:#9ca3af;"><span style="color:#059669;margin-right:4px;">&#10003;</span> No login needed &nbsp; <span style="color:#059669;margin-right:4px;">&#10003;</span> Free forever &nbsp; <span style="color:#059669;margin-right:4px;">&#10003;</span> Updated regularly</td>'
      + '</tr></table>'
      + '</td></tr>'

      // Divider + Contact
      + '<tr><td style="padding:0 28px 20px 28px;border-top:1px solid #f3f4f6;">'
      + '<p style="margin:16px 0 10px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;">&#129309; Need Help?</p>'
      + '<a href="https://wa.me/" style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:7px 14px;font-size:12.5px;font-weight:600;color:#15803d;text-decoration:none;margin-right:8px;margin-bottom:6px;">&#128172; +91 </a>'
      + '<a href="mailto:nishant@hsbteleet.com" style="display:inline-block;background:#fff7ed;border:1px solid #fed7aa;border-radius:20px;padding:7px 14px;font-size:12.5px;font-weight:600;color:#c2410c;text-decoration:none;margin-bottom:6px;">&#9993;&#65039; nishant@hsbteleet.com</a>'
      + '</td></tr>'

      // Footer
      + emailFooter([
        { href: 'https://hsbteleet.com', label: 'Website' },
        { href: 'https://hsbteleet.com/syllabus/syllabus.html', label: 'Syllabus' },
        { href: 'https://hsbteleet.com/hsbte-pyq', label: 'PYQs' }
      ])

      + '</table></td></tr>'; // end card

    return emailShell(body);
  }

  // ═══════════════════════════════════════════════════════════
  //  EMAIL 2 — PREMIUM CUSTOMER WELCOME
  //  → Student ke email pe jaata hai after 49 payment
  // ═══════════════════════════════════════════════════════════

  function buildCustomerWelcomeHTML(data) {
    var name = data.name || 'Student';
    var fn = firstName(name);
    var mobile = data.mobile || '—';
    var email = data.email || '—';
    var payId = data.payId || '—';
    var ts = nowStr();

    var body =
      logoRow()
      + '<tr><td style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'
      + topStrip('linear-gradient(90deg,#ea580c,#f97316)')

      // Header
      + '<tr><td style="padding:28px 28px 0 28px;background:linear-gradient(135deg,#fff7ed 0%,#fff 60%);">'
      + sectionLabel('&#128081; Premium Access Confirmed', '#ea580c')
      + '<h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:26px;font-weight:700;color:#111111;line-height:1.2;">Welcome, ' + fn + '!<br/>You\'re Premium. &#128081;</h1>'
      + '<p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;line-height:1.7;">Your <strong style="color:#ea580c;">&#8377;49 payment is confirmed.</strong> You now have <strong style="color:#374151;">lifetime access</strong> to 14 exclusive Haryana LEET sample papers. Let\'s get cracking! &#127919;</p>'
      + '</td></tr>'

      // Activated banner
      + '<tr><td style="padding:0 28px 20px 28px;">'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>'
      + '<td style="background:#fff7ed;border:1px solid #fed7aa;border-left:3px solid #ea580c;border-radius:8px;padding:13px 16px;">'
      + '<p style="margin:0;font-size:13.5px;font-weight:700;color:#c2410c;">&#9989; Account Activated &mdash; ' + name + '</p>'
      + '<p style="margin:4px 0 0 0;font-size:12.5px;color:#9a3412;">Payment received &amp; verified. All 5 papers unlocked and ready for you.</p>'
      + '</td></tr></table>'
      + '</td></tr>'

      // Order Details
      + '<tr><td style="padding:0 28px 20px 28px;">'
      + '<p style="margin:0 0 10px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;">&#128196; Your Order Details</p>'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #f3f4f6;border-radius:8px;overflow:hidden;">'
      + '<tr><td style="padding:0 16px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'
      + infoRow('Name', name)
      + infoRow('Email', email)
      + infoRow('Mobile', mobile)
      + infoRow('Amount Paid', '&#8377;49 &nbsp;&#10003; Confirmed', '#059669')
      + infoRow('Activated On', ts)
      + '<tr><td style="padding:9px 0;font-size:13px;color:#9ca3af;width:120px;vertical-align:top;">Payment ID</td><td style="padding:9px 0;font-size:11.5px;font-family:monospace;color:#6b7280;text-align:right;word-break:break-all;">' + payId + '</td></tr>'
      + '</table></td></tr>'
      + '</table>'
      + '</td></tr>'

      // What unlocked
      + '<tr><td style="padding:0 28px 20px 28px;">'
      + '<p style="margin:0 0 12px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;">&#128081; What You\'ve Unlocked</p>'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>'
      + '<td width="49%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;vertical-align:top;"><div style="font-size:20px;margin-bottom:6px;">&#128221;</div><div style="font-size:13px;font-weight:700;color:#111111;margin-bottom:3px;">5 Sample Papers</div><div style="font-size:11.5px;color:#9ca3af;">Exclusive Haryana LEET papers</div></td>'
      + '<td width="2%" style="font-size:0;">&nbsp;</td>'
      + '<td width="49%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;vertical-align:top;"><div style="font-size:20px;margin-bottom:6px;">&#9854;&#65039;</div><div style="font-size:13px;font-weight:700;color:#111111;margin-bottom:3px;">Lifetime Access</div><div style="font-size:11.5px;color:#9ca3af;">No expiry, no renewal</div></td>'
      + '</tr><tr><td colspan="3" style="height:6px;font-size:0;">&nbsp;</td></tr><tr>'
      + '<td width="49%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;vertical-align:top;"><div style="font-size:20px;margin-bottom:6px;">&#127919;</div><div style="font-size:13px;font-weight:700;color:#111111;margin-bottom:3px;">Exam-Pattern Match</div><div style="font-size:11.5px;color:#9ca3af;">Mirrors actual LEET format</div></td>'
      + '<td width="2%" style="font-size:0;">&nbsp;</td>'
      + '<td width="49%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;vertical-align:top;"><div style="font-size:20px;margin-bottom:6px;">&#9889;</div><div style="font-size:13px;font-weight:700;color:#111111;margin-bottom:3px;">Instant Access</div><div style="font-size:11.5px;color:#9ca3af;">Login &amp; start right now</div></td>'
      + '</tr></table>'
      + '</td></tr>'

      // CTAs
      + '<tr><td style="padding:0 28px 20px 28px;">'
      + ctaBtn('https://hsbteleet.com/premium-papers.html', '&#128218; Open My Premium Papers &rarr;', '#ea580c', '#ffffff')
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td>'
      + '<a href="#" style="display:block;padding:12px 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:13.5px;font-weight:600;color:#15803d;text-decoration:none;text-align:center;">&#128172; Need help? WhatsApp Nishant</a>'
      + '</td></tr></table>'
      + '</td></tr>'

      // Contact
      + '<tr><td style="padding:0 28px 20px 28px;border-top:1px solid #f3f4f6;">'
      + '<p style="margin:16px 0 10px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;">&#129309; Support</p>'
      + '<a href="#" style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:7px 14px;font-size:12.5px;font-weight:600;color:#15803d;text-decoration:none;margin-right:8px;margin-bottom:6px;">&#128172; +91 79883 16241</a>'
      + '<a href="mailto:nishant@hsbteleet.com" style="display:inline-block;background:#fff7ed;border:1px solid #fed7aa;border-radius:20px;padding:7px 14px;font-size:12.5px;font-weight:600;color:#c2410c;text-decoration:none;margin-right:8px;margin-bottom:6px;">&#9993;&#65039; Email Nishant</a>'
      + '<a href="https://hsbteleet.com/premium-papers.html" style="display:inline-block;background:#fef3c7;border:1px solid #fcd34d;border-radius:20px;padding:7px 14px;font-size:12.5px;font-weight:600;color:#92400e;text-decoration:none;margin-bottom:6px;">&#128081; My Papers</a>'
      + '</td></tr>'

      + emailFooter([
        { href: 'https://hsbteleet.com', label: 'Website' },
        { href: 'https://hsbteleet.com/premium-papers.html', label: 'My Papers' },
        { href: '#', label: 'Support' }
      ])

      + '</table></td></tr>';

    return emailShell(body);
  }

  // ═══════════════════════════════════════════════════════════
  //  EMAIL 3 — ADMIN REGISTRATION ALERT (Green)
  //  → nishant@hsbteleet.com pe jaata hai
  // ═══════════════════════════════════════════════════════════

  function buildAdminRegistrationHTML(data) {
    var name = data.name || 'Unknown';
    var mobile = data.mobile || '—';
    var email = data.email || '—';
    var payId = data.payId || '—';
    var ts = nowStr();

    var body =
      logoRow()
      + '<tr><td style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'
      + topStrip('linear-gradient(90deg,#059669,#34d399)')

      // Header
      + '<tr><td style="padding:28px 28px 20px 28px;background:linear-gradient(135deg,#f0fdf4 0%,#fff 60%);">'
      + '<span style="display:inline-block;background:#dcfce7;border:1px solid #86efac;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;color:#166534;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">&#128994; New Registration</span>'
      + '<h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#111111;line-height:1.3;">New Premium Member Joined!</h1>'
      + '<p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;"><strong style="color:#374151;">' + name + '</strong> just registered and paid &#8377;49. Account is now active.</p>'
      + '</td></tr>'

      // Stats
      + '<tr><td style="padding:0 28px 20px 28px;">'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>'
      + '<td width="32%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 8px;text-align:center;"><div style="font-size:22px;font-weight:700;color:#059669;line-height:1;">&#8377;49</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-top:4px;">Earned</div></td>'
      + '<td width="2%" style="font-size:0;">&nbsp;</td>'
      + '<td width="32%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 8px;text-align:center;"><div style="font-size:22px;font-weight:700;color:#059669;line-height:1;">5</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-top:4px;">Papers Given</div></td>'
      + '<td width="2%" style="font-size:0;">&nbsp;</td>'
      + '<td width="32%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 8px;text-align:center;"><div style="font-size:22px;font-weight:700;color:#059669;line-height:1;">&#10003;</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-top:4px;">Active</div></td>'
      + '</tr></table>'
      + '</td></tr>'

      // Student details
      + '<tr><td style="padding:0 28px 20px 28px;">'
      + '<p style="margin:0 0 10px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;">&#128196; Student Details</p>'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #f3f4f6;border-radius:8px;">'
      + '<tr><td style="padding:0 16px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'
      + infoRow('Name', name)
      + infoRow('Mobile', mobile)
      + infoRow('Email', email)
      + infoRow('Amount', '&#8377;49 &#10003; Paid', '#059669')
      + infoRow('Time', ts)
      + '<tr><td style="padding:9px 0;font-size:13px;color:#9ca3af;vertical-align:top;">Payment ID</td><td style="padding:9px 0;font-size:11.5px;font-family:monospace;color:#6b7280;text-align:right;word-break:break-all;">' + payId + '</td></tr>'
      + '</table></td></tr></table>'
      + '</td></tr>'

      // Buttons
      + '<tr><td style="padding:0 28px 20px 28px;">'
      + ctaBtn('https://vzfpltvchsxsfqlldafd.supabase.co', '&#128202; View in Supabase &rarr;', '#059669', '#ffffff')
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td>'
      + '<a href="https://wa.me/91' + mobile.replace(/\D/g, '') + '" style="display:block;padding:12px 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:13.5px;font-weight:600;color:#15803d;text-decoration:none;text-align:center;">&#128172; WhatsApp ' + name + ' directly</a>'
      + '</td></tr></table>'
      + '</td></tr>'

      + '<tr><td style="padding:12px 28px;border-top:1px solid #f3f4f6;"><p style="margin:0;font-size:11.5px;color:#9ca3af;text-align:center;">Admin notification &middot; hsbteleet.com &middot; &copy; 2025</p></td></tr>'

      + '</table></td></tr>';

    return emailShell(body);
  }

  // ═══════════════════════════════════════════════════════════
  //  EMAIL 4 — ADMIN LOGIN ALERT (Blue)
  //  → nishant@hsbteleet.com pe jaata hai
  // ═══════════════════════════════════════════════════════════

  function buildAdminLoginHTML(data) {
    var name = data.name || 'Unknown';
    var mobile = data.mobile || '—';
    var email = data.email || '—';
    var ts = nowStr();

    var body =
      logoRow()
      + '<tr><td style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'
      + topStrip('linear-gradient(90deg,#1d4ed8,#60a5fa)')

      // Header
      + '<tr><td style="padding:28px 28px 20px 28px;background:linear-gradient(135deg,#eff6ff 0%,#fff 60%);">'
      + '<span style="display:inline-block;background:#dbeafe;border:1px solid #93c5fd;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;color:#1e40af;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">&#128275; Login Detected</span>'
      + '<h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#111111;line-height:1.3;">Premium Login Alert</h1>'
      + '<p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;"><strong style="color:#374151;">' + name + '</strong> just logged in and is accessing their papers on hsbteleet.com.</p>'
      + '</td></tr>'

      // Details
      + '<tr><td style="padding:0 28px 20px 28px;">'
      + '<p style="margin:0 0 10px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;">&#128196; Login Details</p>'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #f3f4f6;border-radius:8px;">'
      + '<tr><td style="padding:0 16px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'
      + infoRow('Name', name)
      + infoRow('Mobile', mobile)
      + infoRow('Email', email)
      + infoRow('Time', ts)
      + infoRow('Status', '&#10003; Active &middot; Premium', '#059669')
      + '</table></td></tr></table>'
      + '</td></tr>'

      // Buttons
      + '<tr><td style="padding:0 28px 20px 28px;">'
      + ctaBtn('https://vzfpltvchsxsfqlldafd.supabase.co', '&#128202; Open Supabase Dashboard &rarr;', '#1d4ed8', '#ffffff')
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td>'
      + '<a href="https://wa.me/91' + mobile.replace(/\D/g, '') + '" style="display:block;padding:12px 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:13.5px;font-weight:600;color:#15803d;text-decoration:none;text-align:center;">&#128172; WhatsApp ' + name + '</a>'
      + '</td></tr></table>'
      + '</td></tr>'

      + '<tr><td style="padding:12px 28px;border-top:1px solid #f3f4f6;"><p style="margin:0;font-size:11.5px;color:#9ca3af;text-align:center;">Login alert &middot; hsbteleet.com &middot; &copy; 2025</p></td></tr>'

      + '</table></td></tr>';

    return emailShell(body);
  }

  // ═══════════════════════════════════════════════════════════
  //  ROW/STAT HELPERS (for backward compat — not used above)
  // ═══════════════════════════════════════════════════════════
  function row(clr, label, val) { return infoRow(label, val, clr); }
  function rowG(label, val) { return infoRow(label, val, '#059669'); }
  function statBox(clr, num, lbl) { return ''; }

  function sendWelcomeEmail(data) {
    if (!data || !data.email) return;
    ensureEmailJS(function () {
      emailjs.send(EJS_SERVICE_ID, EJS_TEMPLATE_ID, {
        to_name: data.name || 'Student',
        to_email: data.email,
        mobile: data.mobile || '',
        college: data.college || '',
        branch: data.branch || '',
        preparation: data.preparation || '',
        html_message: buildWelcomeHTML(data)
      }).then(function (res) {
        console.log('[LEET] Welcome email sent:', res.status, res.text);
      }).catch(function (err) {
        console.error('[LEET] Welcome email failed:', err);
      });
    });
  }
  async function submitLead(form) {
    var client = getSupabaseClient();
    if (!client) throw new Error('supabase_client_unavailable');
    var payload = {
      name: (form.elements.name.value || '').trim(),
      college: (form.elements.college.value || '').trim(),
      mobile: (form.elements.mobile.value || '').trim(),
      branch: (form.elements.branch.value || '').trim(),
      email: (form.elements.email.value || '').trim(),
      preparation: form.elements.preparation.value,
      page: window.location.href
    };
    var result = await client.from('leet_leads').insert([payload]);
    if (result.error) throw result.error;
    return result;
  }
  function handleSubmit(event) {
    event.preventDefault();
    var form = event.target;
    var submitBtn = qs('.leet-modal-submit', form);
    setMessage('', null);
    var validationError = validateForm(form);
    if (validationError) {
      setMessage(validationError, 'error');
      return;
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';
      submitBtn.classList.add('leet-loading');
    }
    ensureSupabaseLoaded(function (loadError) {
      if (loadError) {
        console.error('Supabase load error:', loadError);
        setMessage('Unable to submit right now. Please try again later.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
          submitBtn.classList.remove('leet-loading');
        }
        return;
      }
      submitLead(form)
        .then(function () {
          ['leet-name', 'leet-mobile', 'leet-college', 'leet-branch', 'leet-email', 'leet-preparation'].forEach(function (id) {
            var el = qs('#' + id);
            if (el && el.value.trim()) setInputState(el, 'success');
          });
          setMessage('🎉 You\'re in! Details submitted successfully.', 'success');
          try { localStorage.setItem('leetLeadCaptured', '1'); } catch (e) { }
          /* Send welcome email to the registrant (Commented out for now)
          try {
            sendWelcomeEmail({
              name: (form.elements.name.value || '').trim(),
              email: (form.elements.email.value || '').trim(),
              mobile: (form.elements.mobile.value || '').trim(),
              college: (form.elements.college.value || '').trim(),
              branch: (form.elements.branch.value || '').trim(),
              preparation: form.elements.preparation.value
            });
          } catch (eje) { console.error('[LEET] sendWelcomeEmail threw:', eje); }
          */
          setTimeout(hideModal, 2000);
        })
        .catch(function (err) {
          console.error('Supabase insert error:', err);
          setMessage('Submission failed. Please try again in a moment.', 'error');
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
            submitBtn.classList.remove('leet-loading');
          }
        });
    });
  }
  function attachEvents() {
    var overlay = qs('#leet-lead-modal-overlay');
    if (!overlay) return;
    var form = qs('#leet-lead-form', overlay);
    var closeBtn = qs('.leet-modal-close', overlay);
    if (form && !form.__leetBound) {
      form.addEventListener('submit', handleSubmit);
      form.__leetBound = true;
    }
    if (closeBtn && !closeBtn.__leetBound) {
      closeBtn.addEventListener('click', hideModal);
      closeBtn.__leetBound = true;
    }
    if (!overlay.__leetBound) {
      overlay.addEventListener('click', handleOverlayClick);
      overlay.__leetBound = true;
    }
    if (!document.__leetKeyBound) {
      document.addEventListener('keydown', handleKeydown);
      document.__leetKeyBound = true;
    }
  }
  var MODAL_HTML = [
    '<div id="leet-lead-modal-overlay" class="leet-modal-overlay leet-modal-hidden" aria-hidden="true">',
    '<div class="leet-modal" role="dialog" aria-modal="true" aria-labelledby="leet-modal-title">',
    '<div class="leet-modal-body">',
    '<div class="leet-modal-badge">Free LEET Guidance</div>',
    '<h2 id="leet-modal-title" class="leet-modal-title">Get Free HSBTE PYQ & Haryana Leet &#127891;</h2>',
    '<p class="leet-modal-subtitle">Fill your details to receive study material, PYQs and important exam updates.</p>',
    '<form id="leet-lead-form" class="leet-modal-form" novalidate>',
    '<div class="leet-field">',
    '<label for="leet-name" class="leet-label">Name <span style="color:#ec4899;font-size:0.6rem;vertical-align:super;">&#10022;</span></label>',
    '<input id="leet-name" name="name" type="text" class="leet-input" placeholder="e.g. Nishant" autocomplete="name" required />',
    '</div>',
    '<div class="leet-field">',
    '<label for="leet-college" class="leet-label">College Name</label>',
    '<input id="leet-college" name="college" type="text" class="leet-input" placeholder="e.g. GP Mandi Adampur" autocomplete="organization" />',
    '</div>',
    '<div class="leet-field">',
    '<label for="leet-mobile" class="leet-label">Mobile Number <span style="color:#ec4899;font-size:0.6rem;vertical-align:super;">&#10022;</span></label>',
    '<input id="leet-mobile" name="mobile" type="tel" class="leet-input" placeholder="e.g. " inputmode="numeric" pattern="\\d{10,15}" autocomplete="tel" required />',
    '<small class="leet-hint">&#128241; 10digit mobile number</small>',
    '</div>',
    '<div class="leet-field">',
    '<label for="leet-branch" class="leet-label">Branch <span style="color:#ec4899;font-size:0.6rem;vertical-align:super;">&#10022;</span></label>',
    '<input id="leet-branch" name="branch" type="text" class="leet-input" placeholder="e.g. Computer Science" autocomplete="off" required />',
    '</div>',
    '<div class="leet-field">',
    '<label for="leet-email" class="leet-label">Email <span style="color:#ec4899;font-size:0.6rem;vertical-align:super;">&#10022;</span></label>',
    '<input id="leet-email" name="email" type="email" class="leet-input" placeholder="you@example.com" autocomplete="email" required/>',
    '</div>',
    '<div class="leet-field">',
    '<label for="leet-preparation" class="leet-label">Preparation For <span style="color:#ec4899;font-size:0.6rem;vertical-align:super;">&#10022;</span></label>',
    '<select id="leet-preparation" name="preparation" class="leet-input leet-select" required>',
    '<option value="" disabled selected>Select an option</option>',
    '<option value="HSBTE PYQ">HSBTE PYQ</option>',
    '<option value="B.Tech LEET">B.Tech LEET</option>',
    '<option value="B.Pharmacy LEET">B.Pharmacy LEET</option>',
    '</select>',
    '</div>',
    '<button type="submit" class="leet-modal-submit">',
    '<span>Get Free Access &rarr;</span>',
    '</button>',
    '<p id="leet-modal-message" class="leet-modal-message" aria-live="polite"></p>',
    '<p class="leet-modal-privacy">We respect your privacy. Your details are used only for HSBTE LEET related communication.</p>',
    '</form>',
    '</div>',
    '</div>',
    '</div>'
  ].join('');
  function buildModal() {
    if (!document.body) return;
    if (qs('#leet-lead-modal-overlay')) {
      attachEvents();
      return;
    }
    var wrapper = document.createElement('div');
    wrapper.innerHTML = MODAL_HTML;
    var overlay = wrapper.firstElementChild;
    if (!overlay) return;
    document.body.appendChild(overlay);
    attachEvents();
  }
  function initLeadModal() {
    ensureFont();
    ensureStylesheet();
    buildModal();
    if (!shouldShowModalThisSession()) return;
    setTimeout(showModal, 1000);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLeadModal);
  } else {
    initLeadModal();
  }
})();
