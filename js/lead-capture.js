(function () {
'use strict';
try {
if (localStorage.getItem('leetLeadCaptured') === '1') {
return;
}
} catch (e) {}
var SUPABASE_URL      = 'https://jnsowbnkccddcrkuonan.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impuc293Ym5rY2NkZGNya3VvbmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjY0MzksImV4cCI6MjA4NzcwMjQzOX0.PbiJI8SOxjgDPAP0njNN8aIW3yArJmstxi_VRhPuM5k';
/* EmailJS config for welcome message after lead capture */
var EJS_SERVICE_ID  = 'service_xwq0gnl';
var EJS_TEMPLATE_ID = 'template_ed04169';
var EJS_PUBLIC_KEY  = 'tSLSXcGfuU3S3XDr4';
var ejsLoaded       = false;
var ejsLoading      = false;
var supabaseClient           = null;
var supabaseLoading          = false;
var supabaseReadyCallbacks   = [];
function qs(selector, root) {
return (root || document).querySelector(selector);
}
function ensureStylesheet() {
if (document.querySelector('link[data-leet-modal="1"]')) return;
var link = document.createElement('link');
link.rel  = 'stylesheet';
link.href = '/css/lead-modal.css';
link.setAttribute('data-leet-modal', '1');
(document.head || document.documentElement).appendChild(link);
}
function ensureFont() {
if (document.querySelector('link[data-leet-font="1"]')) return;
var link = document.createElement('link');
link.rel  = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap';
link.setAttribute('data-leet-font', '1');
(document.head || document.documentElement).appendChild(link);
}
function ensureSupabaseLoaded(callback) {
if (typeof callback !== 'function') callback = function () {};
if (window.supabase) { callback(null); return; }
supabaseReadyCallbacks.push(callback);
if (supabaseLoading) return;
supabaseLoading = true;
var script   = document.createElement('script');
script.src   = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.48.0/dist/umd/supabase.js';
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
msgEl.className   = 'leet-modal-message';
if (type === 'error')   msgEl.classList.add('leet-modal-message--error');
if (type === 'success') msgEl.classList.add('leet-modal-message--success');
}
function setInputState(inputEl, state) {
if (!inputEl) return;
inputEl.classList.remove('leet-input--error', 'leet-input--success');
if (state) inputEl.classList.add('leet-input--' + state);
}
function validateForm(form) {
var name        = (form.elements.name.value        || '').trim();
var mobile      = (form.elements.mobile.value      || '').trim();
var college     = (form.elements.college.value     || '').trim();
var branch      = (form.elements.branch.value      || '').trim();
var email       = (form.elements.email.value       || '').trim();
var preparation = form.elements.preparation.value;
['leet-name','leet-mobile','leet-college','leet-branch','leet-email','leet-preparation'].forEach(function (id) {
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
var dialog  = overlay && qs('.leet-modal', overlay);
if (!overlay || !dialog) return;
overlay.classList.remove('leet-modal-hidden');
overlay.setAttribute('aria-hidden', 'false');
overlay.__openedAt = Date.now();
try { sessionStorage.setItem('leetLeadModalShown', '1'); } catch (e) {}
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
  if (ejsLoading) { setTimeout(function(){ ensureEmailJS(cb); }, 150); return; }
  ejsLoading = true;
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  s.async = true;
  s.onload = function() {
    try { emailjs.init(EJS_PUBLIC_KEY); } catch(e) {}
    ejsLoaded = true;
    ejsLoading = false;
    cb();
  };
  s.onerror = function() { ejsLoading = false; /* silent fail */ };
  document.head.appendChild(s);
}
/* ── Send welcome email via EmailJS after successful lead capture ── */
function buildWelcomeHTML(data) {
  var name       = data.name        || 'Student';
  var branch     = data.branch      || '';
  var college    = data.college     || '';
  var prep       = data.preparation || '';
  var mobile     = data.mobile      || '';

  var prepLine = '';
  if (prep)    prepLine += '<span style="display:inline-block;background:#1c1910;border:1px solid rgba(233,160,26,0.25);border-radius:20px;padding:3px 12px;font-size:11px;color:rgba(247,200,74,0.85);font-weight:600;margin-right:6px;margin-bottom:4px;">&#127891; ' + prep + '</span>';
  if (branch)  prepLine += '<span style="display:inline-block;background:#1c1910;border:1px solid rgba(41,196,122,0.2);border-radius:20px;padding:3px 12px;font-size:11px;color:rgba(110,231,183,0.8);font-weight:600;margin-right:6px;margin-bottom:4px;">&#128218; ' + branch + '</span>';
  if (college) prepLine += '<span style="display:inline-block;background:#1c1910;border:1px solid rgba(233,160,26,0.15);border-radius:20px;padding:3px 12px;font-size:11px;color:rgba(253,243,216,0.5);font-weight:500;margin-bottom:4px;">&#127979; ' + college + '</span>';

  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Welcome to HSBTELEET.com</title><link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>'
  + '<style>'
  + '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}'
  + 'body{background:#050403;font-family:\'DM Sans\',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px 16px;}'
  + '.wrapper{max-width:600px;width:100%;}'
  + '.pre-header{text-align:center;font-family:\'Syne\',sans-serif;font-size:10px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:rgba(233,160,26,0.4);margin-bottom:14px;}'
  + '.card{background:#0d0b07;border-radius:32px;overflow:hidden;border:1px solid rgba(233,160,26,0.1);box-shadow:0 80px 160px rgba(0,0,0,0.9),0 24px 60px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,220,100,0.07);}'
  + '.hero{position:relative;padding:0;overflow:hidden;min-height:320px;}'
  + '.hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse 100% 80% at 50% -20%,rgba(233,160,26,0.22) 0%,transparent 55%),radial-gradient(ellipse 60% 50% at 100% 60%,rgba(247,200,74,0.1) 0%,transparent 50%),radial-gradient(ellipse 50% 40% at 0% 100%,rgba(41,196,122,0.08) 0%,transparent 50%),linear-gradient(175deg,#1c1608 0%,#0e0b06 50%,#080604 100%);}'
  + '.hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(233,160,26,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(233,160,26,0.04) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(ellipse 80% 70% at 50% 0%,black 0%,transparent 80%);-webkit-mask-image:radial-gradient(ellipse 80% 70% at 50% 0%,black 0%,transparent 80%);}'
  + '.hero-arc{position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:800px;height:400px;border-radius:50%;border:1px solid rgba(233,160,26,0.06);pointer-events:none;}'
  + '.hero-arc.a2{width:600px;height:300px;top:-160px;border-color:rgba(233,160,26,0.08);}'
  + '.hero-arc.a3{width:400px;height:200px;top:-120px;border-color:rgba(233,160,26,0.12);}'
  + '.hero-inner{position:relative;z-index:3;padding:36px 44px 40px;}'
  + '.topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:44px;}'
  + '.brand{display:flex;align-items:center;gap:11px;}'
  + '.brand-mark{width:40px;height:40px;border-radius:12px;background:linear-gradient(145deg,#f7c84a 0%,#e9a01a 100%);display:flex;align-items:center;justify-content:center;font-family:\'Syne\',sans-serif;font-weight:800;font-size:14px;color:#1a0f00;box-shadow:0 0 20px rgba(233,160,26,0.5),0 4px 12px rgba(0,0,0,0.5);}'
  + '.brand-text{font-family:\'Syne\',sans-serif;font-size:15px;font-weight:700;color:#fdf3d8;letter-spacing:0.5px;}'
  + '.brand-text span{color:#e9a01a;}'
  + '.badge-free{display:flex;align-items:center;gap:6px;background:rgba(41,196,122,0.1);border:1px solid rgba(41,196,122,0.22);border-radius:24px;padding:5px 13px 5px 7px;font-family:\'Syne\',sans-serif;font-size:10.5px;font-weight:700;letter-spacing:1px;color:#29c47a;}'
  + '.badge-dot{width:7px;height:7px;border-radius:50%;background:#29c47a;box-shadow:0 0 8px #29c47a;}'
  + '.welcome-tag{display:inline-flex;align-items:center;gap:8px;margin-bottom:20px;}'
  + '.tag-line{height:1px;width:28px;background:linear-gradient(90deg,transparent,#e9a01a);}'
  + '.tag-line-r{height:1px;width:28px;background:linear-gradient(90deg,#e9a01a,transparent);}'
  + '.tag-text{font-family:\'Syne\',sans-serif;font-size:10px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;color:#f7c84a;}'
  + '.h1{font-family:\'DM Serif Display\',serif;font-size:48px;line-height:1.0;letter-spacing:-1.5px;color:#fdf3d8;margin-bottom:16px;}'
  + '.h1-gold{color:#e9a01a;text-shadow:0 0 30px rgba(233,160,26,0.4),0 0 60px rgba(233,160,26,0.2);}'
  + '.h1-italic{font-style:italic;}'
  + '.subtext{font-size:14.5px;color:rgba(253,243,216,0.48);line-height:1.8;max-width:440px;font-weight:400;}'
  + '.hero-pills{display:flex;gap:8px;margin-top:32px;flex-wrap:wrap;}'
  + '.hpill{display:inline-flex;align-items:center;gap:8px;background:rgba(253,243,216,0.04);border:1px solid rgba(253,243,216,0.08);border-radius:100px;padding:7px 16px 7px 10px;font-family:\'Syne\',sans-serif;font-size:11.5px;font-weight:600;color:rgba(253,243,216,0.22);letter-spacing:0.3px;}'
  + '.hpill-ico{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;}'
  + '.hpill-a .hpill-ico{background:rgba(233,160,26,0.18);}'
  + '.hpill-b .hpill-ico{background:rgba(41,196,122,0.16);}'
  + '.hpill-c .hpill-ico{background:rgba(247,200,74,0.16);}'
  + '.acclaim{background:linear-gradient(135deg,rgba(233,160,26,0.1) 0%,rgba(41,196,122,0.07) 100%);border-left:3px solid #e9a01a;padding:18px 28px;display:flex;gap:16px;align-items:center;border-bottom:1px solid rgba(233,160,26,0.1);}'
  + '.acclaim-trophy{font-size:28px;flex-shrink:0;}'
  + '.acclaim-text strong{display:block;font-family:\'Syne\',sans-serif;font-size:13.5px;font-weight:700;color:#fdf3d8;margin-bottom:3px;}'
  + '.acclaim-text p{font-size:12.5px;color:rgba(253,243,216,0.48);line-height:1.65;}'
  + '.acclaim-text p em{color:rgba(233,160,26,0.8);font-style:normal;font-weight:600;}'
  + '.personalized-tag{padding:14px 44px;background:rgba(0,0,0,0.2);border-bottom:1px solid rgba(255,210,100,0.06);display:flex;gap:8px;flex-wrap:wrap;align-items:center;}'
  + '.ptag-label{font-family:\'Syne\',sans-serif;font-size:9.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(253,243,216,0.22);margin-right:4px;}'
  + '.body{padding:40px 44px;}'
  + '.greeting{position:relative;background:#131009;border-radius:24px;border:1px solid rgba(255,210,100,0.07);padding:26px 28px;margin-bottom:32px;overflow:hidden;}'
  + '.greeting::before{content:"";position:absolute;top:0;left:0;bottom:0;width:3px;background:linear-gradient(180deg,#e9a01a,#29c47a);border-radius:24px 0 0 24px;}'
  + '.greeting-avatar{width:40px;height:40px;border-radius:13px;background:linear-gradient(135deg,rgba(233,160,26,0.2),rgba(247,200,74,0.1));border:1px solid rgba(233,160,26,0.2);display:flex;align-items:center;justify-content:center;font-size:19px;margin-bottom:14px;}'
  + '.greeting p{font-size:14px;color:rgba(253,243,216,0.48);line-height:1.9;}'
  + '.greeting p+p{margin-top:12px;}'
  + '.greeting strong{color:#fdf3d8;font-weight:600;}'
  + '.greeting a{color:#e9a01a;text-decoration:none;border-bottom:1px solid rgba(233,160,26,0.3);}'
  + '.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:36px;}'
  + '.stat{background:#131009;border:1px solid rgba(255,210,100,0.07);border-radius:20px;padding:20px 12px 18px;text-align:center;position:relative;overflow:hidden;}'
  + '.stat-top{position:absolute;top:0;left:0;right:0;height:2px;}'
  + '.stat:nth-child(1) .stat-top{background:linear-gradient(90deg,#e9a01a,transparent);}'
  + '.stat:nth-child(2) .stat-top{background:linear-gradient(90deg,#29c47a,transparent);}'
  + '.stat:nth-child(3) .stat-top{background:linear-gradient(90deg,#f7c84a,transparent);}'
  + '.stat-num{font-family:\'DM Serif Display\',serif;font-size:34px;line-height:1;font-weight:400;margin-bottom:4px;}'
  + '.stat:nth-child(1) .stat-num{color:#e9a01a;}'
  + '.stat:nth-child(2) .stat-num{color:#29c47a;}'
  + '.stat:nth-child(3) .stat-num{color:#f7c84a;}'
  + '.stat-num sup{font-size:14px;vertical-align:super;}'
  + '.stat-label{font-family:\'Syne\',sans-serif;font-size:9.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(253,243,216,0.22);}'
  + '.stat-sub{font-size:10px;color:rgba(253,243,216,0.15);margin-top:3px;}'
  + '.sec-head{display:flex;align-items:center;gap:14px;margin-bottom:14px;}'
  + '.sec-line{height:1px;flex:1;background:rgba(255,210,100,0.07);}'
  + '.sec-title{font-family:\'Syne\',sans-serif;font-size:9.5px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(253,243,216,0.22);white-space:nowrap;}'
  + '.resources{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:34px;}'
  + '.rc{display:block;text-decoration:none;background:#131009;border:1px solid rgba(255,210,100,0.07);border-radius:22px;padding:20px 18px;position:relative;overflow:hidden;}'
  + '.rc-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:13px;}'
  + '.rc-ico{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:17px;}'
  + '.rc-a .rc-ico{background:rgba(233,160,26,0.14);border:1px solid rgba(233,160,26,0.2);}'
  + '.rc-b .rc-ico{background:rgba(41,196,122,0.12);border:1px solid rgba(41,196,122,0.2);}'
  + '.rc-c .rc-ico{background:rgba(240,108,78,0.12);border:1px solid rgba(240,108,78,0.2);}'
  + '.rc-d .rc-ico{background:rgba(247,200,74,0.12);border:1px solid rgba(247,200,74,0.2);}'
  + '.rc-arr{width:26px;height:26px;border-radius:8px;background:rgba(253,243,216,0.04);border:1px solid rgba(253,243,216,0.08);display:flex;align-items:center;justify-content:center;font-size:11px;color:rgba(253,243,216,0.22);}'
  + '.rc-title{font-family:\'Syne\',sans-serif;font-size:13.5px;font-weight:700;color:#fdf3d8;letter-spacing:-0.2px;margin-bottom:4px;}'
  + '.rc-desc{font-size:11.5px;color:rgba(253,243,216,0.48);line-height:1.55;}'
  + '.cta-wrap{margin-bottom:12px;}'
  + '.cta{display:flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;border-radius:18px;background:linear-gradient(130deg,#f7c84a 0%,#e49010 60%,#d4780a 100%);color:#1a0d00;font-family:\'Syne\',sans-serif;font-size:15px;font-weight:800;letter-spacing:0.5px;padding:18px 32px;margin-bottom:12px;box-shadow:0 8px 32px rgba(233,160,26,0.4),0 2px 8px rgba(0,0,0,0.6);}'
  + '.cta-trust{display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;margin-bottom:34px;}'
  + '.trust-item{display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(253,243,216,0.22);font-weight:500;}'
  + '.trust-check{color:#29c47a;font-size:13px;}'
  + '.divider{height:1px;background:linear-gradient(90deg,transparent,rgba(233,160,26,0.15),rgba(41,196,122,0.1),transparent);margin:30px 0;}'
  + '.contact-label{font-family:\'Syne\',sans-serif;font-size:9.5px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(253,243,216,0.22);margin-bottom:14px;}'
  + '.contacts{display:flex;flex-wrap:wrap;gap:8px;}'
  + '.pill{display:inline-flex;align-items:center;gap:9px;text-decoration:none;background:#131009;border:1px solid rgba(255,210,100,0.07);border-radius:100px;padding:8px 16px 8px 8px;font-size:12.5px;font-weight:500;color:rgba(253,243,216,0.48);}'
  + '.pill-dot{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;}'
  + '.pd-wa{background:rgba(37,211,102,0.18);color:#25d366;}'
  + '.pd-mail{background:rgba(233,160,26,0.2);color:#e9a01a;}'
  + '.pd-web{background:rgba(41,196,122,0.16);color:#29c47a;}'
  + '.footer{background:rgba(0,0,0,0.4);border-top:1px solid rgba(255,210,100,0.07);padding:26px 44px 24px;}'
  + '.ft-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:16px;}'
  + '.ft-brand{font-family:\'Syne\',sans-serif;font-size:13px;font-weight:700;color:rgba(253,243,216,0.22);letter-spacing:0.5px;}'
  + '.ft-brand b{color:rgba(233,160,26,0.7);}'
  + '.ft-links{display:flex;gap:16px;flex-wrap:wrap;}'
  + '.ft-links a{font-size:11.5px;font-weight:500;color:rgba(253,243,216,0.12);text-decoration:none;}'
  + '.ft-divider{height:1px;background:rgba(255,210,100,0.07);margin-bottom:16px;}'
  + '.ft-copy{font-size:11px;color:rgba(253,243,216,0.14);text-align:center;line-height:1.85;}'
  + '.ft-copy a{color:rgba(233,160,26,0.4);text-decoration:none;}'
  + '.stamp{text-align:center;margin-top:24px;font-family:\'Syne\',sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:rgba(253,243,216,0.06);font-weight:700;}'
  + '@media(max-width:520px){.hero-inner,.body{padding:26px 22px;}.footer{padding:20px 22px;}.h1{font-size:34px;}.resources{grid-template-columns:1fr;}.personalized-tag{padding:12px 22px;}.acclaim{padding:14px 18px;}.stats{grid-template-columns:repeat(3,1fr);}}'
  + '</style></head><body>'
  + '<div class="wrapper">'
  + '<div class="pre-header">hsbteleet.com &middot; Official Welcome</div>'
  + '<div class="card">'

  /* ── HERO ── */
  + '<div class="hero">'
  + '<div class="hero-bg"></div>'
  + '<div class="hero-grid"></div>'
  + '<div class="hero-arc"></div>'
  + '<div class="hero-arc a2"></div>'
  + '<div class="hero-arc a3"></div>'
  + '<div class="hero-inner">'
  + '<div class="topbar">'
  + '<div class="brand"><div class="brand-mark">HL</div><div class="brand-text">HSBT<span>LEET</span>.com</div></div>'
  + '<div class="badge-free"><div class="badge-dot"></div>100% Free</div>'
  + '</div>'
  + '<div class="welcome-tag"><div class="tag-line"></div><div class="tag-text">Welcome Aboard</div><div class="tag-line-r"></div></div>'
  + '<h1 class="h1">Your Polytechnic<br/><span class="h1-italic">Journey </span><span class="h1-gold">Starts Here.</span></h1>'
  + '<p class="subtext">Crack Haryana LEET &amp; ace HSBTE with organized syllabi, previous year papers, and practice sets &mdash; all free, all in one place, always updated.</p>'
  + '<div class="hero-pills">'
  + '<div class="hpill hpill-a"><div class="hpill-ico">&#128203;</div>Full Syllabus</div>'
  + '<div class="hpill hpill-b"><div class="hpill-ico">&#128194;</div>HSBTE PYQs</div>'
  + '<div class="hpill hpill-c"><div class="hpill-ico">&#128221;</div>Practice Sets</div>'
  + '</div>'
  + '</div>'
  + '</div>'

  /* ── ACCLAIM ── */
  + '<div class="acclaim">'
  + '<div class="acclaim-trophy">&#127942;</div>'
  + '<div class="acclaim-text">'
  + '<strong>Hey ' + name + ', welcome to hsbteleet.com!</strong>'
  + '<p>We\'re genuinely grateful you\'re here. <em>Thousands of students</em> across Haryana trust us &mdash; and we promise to keep delivering the <em>best free resource</em> for your journey. You made a great choice! &#127919;</p>'
  + '</div>'
  + '</div>'

  /* ── PERSONALIZED TAGS ── */
  + (prepLine ? '<div class="personalized-tag"><span class="ptag-label">Your details &rarr;</span>' + prepLine + '</div>' : '')

  /* ── BODY ── */
  + '<div class="body">'

  /* GREETING */
  + '<div class="greeting">'
  + '<div class="greeting-avatar">&#128075;</div>'
  + '<p>Welcome to <a href="https://hsbteleet.com"><strong>hsbteleet.com</strong></a> &mdash; we\'re absolutely thrilled you\'re here, <strong>' + name + '</strong>! Whether you\'re gearing up for <strong>Haryana LEET</strong> or need <strong>HSBTE PYQs</strong> for any branch, we\'ve built this platform just for students like you.</p>'
  + '<p>Well-organized, regularly updated, and always free. Let\'s get you fully prepared. <strong>You\'ve got this! &#128640;</strong></p>'
  + '</div>'

  /* STATS */
  + '<div class="stats">'
  + '<div class="stat"><div class="stat-top"></div><div class="stat-num">500<sup>+</sup></div><div class="stat-label">PYQs</div><div class="stat-sub">All branches</div></div>'
  + '<div class="stat"><div class="stat-top"></div><div class="stat-num">10<sup>+</sup></div><div class="stat-label">Branches</div><div class="stat-sub">HSBTE covered</div></div>'
  + '<div class="stat"><div class="stat-top"></div><div class="stat-num">&infin;</div><div class="stat-label">Free</div><div class="stat-sub">Always &amp; forever</div></div>'
  + '</div>'

  /* RESOURCES */
  + '<div class="sec-head"><div class="sec-line"></div><div class="sec-title">&#128218; Quick Access Resources</div><div class="sec-line"></div></div>'
  + '<div class="resources">'
  + '<a href="https://hsbteleet.com/syllabus/syllabus.html" class="rc rc-a" target="_blank"><div class="rc-top"><div class="rc-ico">&#128203;</div><div class="rc-arr">&#8599;</div></div><div class="rc-title">Syllabus</div><div class="rc-desc">Full updated LEET syllabus with topic-wise breakdown</div></a>'
  + '<a href="https://hsbteleet.com/haryanaleet" class="rc rc-b" target="_blank"><div class="rc-top"><div class="rc-ico">&#128221;</div><div class="rc-arr">&#8599;</div></div><div class="rc-title">Haryana LEET</div><div class="rc-desc">Sample papers &amp; full practice sets</div></a>'
  + '<a href="https://hsbteleet.com/hsbte-pyq" class="rc rc-c" target="_blank"><div class="rc-top"><div class="rc-ico">&#128194;</div><div class="rc-arr">&#8599;</div></div><div class="rc-title">HSBTE PYQ</div><div class="rc-desc">Previous year questions &mdash; all branches covered</div></a>'
  + '<a href="https://hsbteleet.com" class="rc rc-d" target="_blank"><div class="rc-top"><div class="rc-ico">&#127968;</div><div class="rc-arr">&#8599;</div></div><div class="rc-title">Homepage</div><div class="rc-desc">Browse all resources &amp; latest updates</div></a>'
  + '</div>'

  /* CTA */
  + '<div class="cta-wrap"><a href="https://hsbteleet.com" class="cta" target="_blank">Start Preparing Now &rarr;</a></div>'
  + '<div class="cta-trust">'
  + '<div class="trust-item"><span class="trust-check">&#10003;</span> No login needed</div>'
  + '<div class="trust-item"><span class="trust-check">&#10003;</span> Updated regularly</div>'
  + '<div class="trust-item"><span class="trust-check">&#10003;</span> Free forever</div>'
  + '</div>'

  + '<div class="divider"></div>'

  /* CONTACT */
  + '<div class="contact-label">&#129309; Need Help? Reach Out Anytime</div>'
  + '<div class="contacts">'
  + '<a href="https://wa.me/917988316241" class="pill" target="_blank"><div class="pill-dot pd-wa"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></div>+91 79883 16241</a>'
  + '<a href="mailto:nishant@hsbteleet.com" class="pill"><div class="pill-dot pd-mail">&#9993;</div>nishant@hsbteleet.com</a>'
  + '<a href="https://itsnishant.com" class="pill" target="_blank"><div class="pill-dot pd-web">&#127760;</div>itsnishant.com</a>'
  + '</div>'

  + '</div>'

  /* ── FOOTER ── */
  + '<div class="footer">'
  + '<div class="ft-row">'
  + '<div class="ft-brand">HSBT<b>LEET</b>.com</div>'
  + '<div class="ft-links"><a href="https://hsbteleet.com">Website</a><a href="https://hsbteleet.com/syllabus/syllabus.html">Syllabus</a><a href="https://hsbteleet.com/hsbte-pyq">PYQs</a><a href="#">Unsubscribe</a></div>'
  + '</div>'
  + '<div class="ft-divider"></div>'
  + '<div class="ft-copy">You received this because you signed up on <a href="https://hsbteleet.com">hsbteleet.com</a>.<br/>&copy; 2025 HSBTELEET.com &middot; Made with &#10084;&#65039; by <a href="https://itsnishant.com">Nishant</a> &middot; Haryana, India</div>'
  + '</div>'

  + '</div>'
  + '<div class="stamp">hsbteleet.com &middot; Haryana, India &middot; Est. 2024</div>'
  + '</div>'
  + '</body></html>';
}

function sendWelcomeEmail(data) {
  if (!data || !data.email) return;
  ensureEmailJS(function() {
    emailjs.send(EJS_SERVICE_ID, EJS_TEMPLATE_ID, {
      to_name:      data.name        || 'Student',
      to_email:     data.email,
      mobile:       data.mobile      || '',
      college:      data.college     || '',
      branch:       data.branch      || '',
      preparation:  data.preparation || '',
      html_message: buildWelcomeHTML(data)
    }).then(function(res) {
      console.log('[LEET] Welcome email sent:', res.status, res.text);
    }).catch(function(err) {
      console.error('[LEET] Welcome email failed:', err);
    });
  });
}
async function submitLead(form) {
var client = getSupabaseClient();
if (!client) throw new Error('supabase_client_unavailable');
var payload = {
name:        (form.elements.name.value        || '').trim(),
college:     (form.elements.college.value     || '').trim(),
mobile:      (form.elements.mobile.value      || '').trim(),
branch:      (form.elements.branch.value      || '').trim(),
email:       (form.elements.email.value       || '').trim(),
preparation: form.elements.preparation.value,
page:        window.location.href
};
var result = await client.from('leet_leads').insert([payload]);
if (result.error) throw result.error;
return result;
}
function handleSubmit(event) {
event.preventDefault();
var form      = event.target;
var submitBtn = qs('.leet-modal-submit', form);
setMessage('', null);
var validationError = validateForm(form);
if (validationError) {
setMessage(validationError, 'error');
return;
}
if (submitBtn) {
submitBtn.disabled     = true;
submitBtn.textContent  = 'Submitting…';
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
['leet-name','leet-mobile','leet-college','leet-branch','leet-email','leet-preparation'].forEach(function (id) {
var el = qs('#' + id);
if (el && el.value.trim()) setInputState(el, 'success');
});
setMessage('🎉 You\'re in! Details submitted successfully.', 'success');
try { localStorage.setItem('leetLeadCaptured', '1'); } catch (e) {}
/* Send welcome email to the registrant */
try {
  sendWelcomeEmail({
    name:        (form.elements.name.value        || '').trim(),
    email:       (form.elements.email.value       || '').trim(),
    mobile:      (form.elements.mobile.value      || '').trim(),
    college:     (form.elements.college.value     || '').trim(),
    branch:      (form.elements.branch.value      || '').trim(),
    preparation: form.elements.preparation.value
  });
} catch(eje) { console.error('[LEET] sendWelcomeEmail threw:', eje); }
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
var overlay  = qs('#leet-lead-modal-overlay');
if (!overlay) return;
var form     = qs('#leet-lead-form', overlay);
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
'<input id="leet-college" name="college" type="text" class="leet-input" placeholder="e.g. GPCG Patiala" autocomplete="organization" />',
'</div>',
'<div class="leet-field">',
'<label for="leet-mobile" class="leet-label">Mobile Number <span style="color:#ec4899;font-size:0.6rem;vertical-align:super;">&#10022;</span></label>',
'<input id="leet-mobile" name="mobile" type="tel" class="leet-input" placeholder="e.g. 7988316241" inputmode="numeric" pattern="\\d{10,15}" autocomplete="tel" required />',
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
