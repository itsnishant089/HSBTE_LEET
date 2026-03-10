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
  var name = data.name || 'Student';
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Welcome to HSBTELEET.com</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/><style>:root{--bg:#0e0c09;--card:#141209;--surf:#1c1912;--surf2:#221f15;--bdr:rgba(255,220,130,0.08);--bdr2:rgba(255,220,130,0.18);--amber:#f5a623;--amber2:#ffcd6b;--green:#3ecf7a;--green2:#86efac;--rose:#f87171;--cream:#fdf6e3;--text:rgba(253,246,227,0.9);--muted:rgba(253,246,227,0.45);--faint:rgba(253,246,227,0.2);--vfaint:rgba(253,246,227,0.1)}*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg);font-family:"Plus Jakarta Sans",sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 16px}.wrapper{max-width:580px;width:100%}.card{background:var(--card);border-radius:28px;overflow:hidden;border:1px solid var(--bdr);box-shadow:0 0 0 1px rgba(245,166,35,0.04),0 60px 140px rgba(0,0,0,0.85),inset 0 1px 0 rgba(255,220,130,0.06)}.header{position:relative;padding:48px 44px 40px;overflow:hidden}.hdr-bg{position:absolute;inset:0;background:radial-gradient(ellipse 90% 60% at 95% -10%,rgba(245,166,35,0.18) 0%,transparent 55%),radial-gradient(ellipse 60% 50% at -5% 100%,rgba(62,207,122,0.1) 0%,transparent 55%),radial-gradient(ellipse 40% 40% at 50% 110%,rgba(245,166,35,0.06) 0%,transparent 60%),linear-gradient(170deg,#1e1a0f 0%,#110f08 60%,#0b0906 100%)}.hdr-texture{position:absolute;inset:0;background-image:repeating-linear-gradient(-45deg,transparent 0px,transparent 18px,rgba(245,166,35,0.022) 18px,rgba(245,166,35,0.022) 19px)}.hdr-circle{position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(245,166,35,0.14) 0%,transparent 65%)}.hdr-inner{position:relative;z-index:2}.logo-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:40px}.logo-left{display:flex;align-items:center;gap:12px}.logo-mark{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#f5a623,#ffcd6b);display:flex;align-items:center;justify-content:center;font-family:"Playfair Display",serif;font-weight:700;font-size:17px;color:#1a1400;box-shadow:0 0 24px rgba(245,166,35,0.5),0 4px 14px rgba(0,0,0,0.4)}.logo-name{font-size:16px;font-weight:800;color:var(--cream);letter-spacing:0.3px}.logo-name b{color:var(--amber)}.chip-live{display:flex;align-items:center;gap:6px;background:rgba(62,207,122,0.1);border:1px solid rgba(62,207,122,0.25);border-radius:20px;padding:5px 12px 5px 8px;font-size:11px;font-weight:700;color:var(--green)}.chip-dot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green)}.eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(245,166,35,0.1);border:1px solid rgba(245,166,35,0.28);border-radius:20px;padding:5px 14px;font-size:10.5px;font-weight:700;color:var(--amber2);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:20px}.headline{font-family:"Playfair Display",serif;font-size:46px;font-weight:900;line-height:1.0;color:var(--cream);letter-spacing:-1px;margin-bottom:12px}.headline .glow{color:var(--amber);text-shadow:0 0 40px rgba(245,166,35,0.4),0 0 80px rgba(245,166,35,0.2)}.headline em{font-style:italic}.subline{font-size:14.5px;color:var(--muted);line-height:1.75;max-width:400px;font-weight:400}.ty-wrap{margin:0 44px;position:relative;z-index:2}.ty-card{border:1px solid rgba(245,166,35,0.2);border-top:none;border-radius:0 0 22px 22px;overflow:hidden;background:linear-gradient(135deg,rgba(245,166,35,0.07) 0%,rgba(62,207,122,0.05) 100%)}.ty-bar{height:2px;background:linear-gradient(90deg,#f5a623,#ffcd6b,#3ecf7a)}.ty-inner{padding:20px 26px 22px;display:flex;gap:16px;align-items:flex-start}.ty-icon{width:46px;height:46px;flex-shrink:0;border-radius:14px;background:rgba(245,166,35,0.14);border:1px solid rgba(245,166,35,0.28);display:flex;align-items:center;justify-content:center;font-size:21px}.ty-title{font-size:14.5px;font-weight:800;color:var(--cream);margin-bottom:5px}.ty-desc{font-size:13px;color:var(--muted);line-height:1.72}.ty-desc strong{color:rgba(253,246,227,0.78);font-weight:600}.body{padding:36px 44px}.greeting{background:var(--surf);border:1px solid var(--bdr);border-radius:20px;padding:24px 26px;margin-bottom:30px;position:relative;overflow:hidden}.greeting::before{content:"";position:absolute;top:0;left:0;bottom:0;width:3px;background:linear-gradient(180deg,var(--amber),var(--green));border-radius:20px 0 0 20px}.greeting p{font-size:14px;color:var(--muted);line-height:1.9;padding-left:4px}.greeting p strong{color:var(--cream);font-weight:700}.greeting p a{color:var(--amber);text-decoration:none}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:34px}.stat{background:var(--surf);border:1px solid var(--bdr);border-radius:16px;padding:16px 10px;text-align:center}.stat-n{font-family:"Playfair Display",serif;font-size:30px;font-weight:900;line-height:1;margin-bottom:3px}.stat:nth-child(1) .stat-n{color:var(--amber)}.stat:nth-child(2) .stat-n{color:var(--green)}.stat:nth-child(3) .stat-n{color:var(--amber2)}.stat-n sup{font-size:14px;vertical-align:super}.stat-l{font-size:10px;font-weight:700;color:var(--faint);text-transform:uppercase;letter-spacing:1px}.stat-s{font-size:10px;color:rgba(253,246,227,0.15);margin-top:2px}.sec{display:flex;align-items:center;gap:12px;margin-bottom:14px}.sec-l{height:1px;flex:1;background:var(--bdr)}.sec-t{font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--faint);white-space:nowrap}.resources{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:30px}.rc{display:block;text-decoration:none;background:var(--surf);border:1px solid var(--bdr);border-radius:18px;padding:20px 18px;position:relative;overflow:hidden}.rc-arr{position:absolute;top:14px;right:14px;width:26px;height:26px;border-radius:8px;background:rgba(253,246,227,0.05);border:1px solid rgba(253,246,227,0.08);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--faint);z-index:1}.rc-ico{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:13px;position:relative;z-index:1}.rc-a .rc-ico{background:rgba(245,166,35,0.14)}.rc-b .rc-ico{background:rgba(62,207,122,0.12)}.rc-c .rc-ico{background:rgba(248,113,113,0.12)}.rc-d .rc-ico{background:rgba(255,205,107,0.12)}.rc-title{font-size:14px;font-weight:800;color:var(--cream);margin-bottom:3px;position:relative;z-index:1;letter-spacing:-0.2px}.rc-desc{font-size:11.5px;color:var(--muted);line-height:1.5;position:relative;z-index:1}.cta{display:flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;border-radius:16px;background:linear-gradient(130deg,#f5a623 0%,#e8831a 100%);color:#1a1000;font-size:15.5px;font-weight:800;letter-spacing:-0.2px;padding:17px 28px;margin-bottom:10px;box-shadow:0 8px 32px rgba(245,166,35,0.35),0 2px 8px rgba(0,0,0,0.5)}.cta-note{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:30px}.cta-ni{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--faint);font-weight:500}.cta-dot{color:var(--green);font-size:14px}.divider{height:1px;background:linear-gradient(90deg,transparent,var(--bdr2),transparent);margin:28px 0}.contact-box{background:var(--surf);border:1px solid var(--bdr);border-radius:20px;padding:22px 24px}.contact-lbl{font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--faint);margin-bottom:14px}.contacts{display:flex;flex-wrap:wrap;gap:8px}.pill{display:flex;align-items:center;gap:8px;text-decoration:none;background:rgba(253,246,227,0.04);border:1px solid rgba(253,246,227,0.08);border-radius:100px;padding:7px 14px 7px 8px;font-size:12.5px;font-weight:500;color:var(--muted)}.pill-dot{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}.pd-wa{background:rgba(37,211,102,0.18);color:#25d366}.pd-mail{background:rgba(245,166,35,0.2);color:#f5a623}.pd-web{background:rgba(62,207,122,0.18);color:#3ecf7a}.footer{padding:24px 44px;background:rgba(0,0,0,0.35);border-top:1px solid var(--bdr);text-align:center}.ft-links{display:flex;justify-content:center;gap:20px;margin-bottom:10px;flex-wrap:wrap}.ft-links a{font-size:12px;font-weight:500;color:var(--faint);text-decoration:none}.ft-copy{font-size:11.5px;color:rgba(253,246,227,0.14);line-height:1.8}.ft-copy a{color:rgba(245,166,35,0.5);text-decoration:none}.stamp{text-align:center;margin-top:22px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(253,246,227,0.08);font-weight:600}@media(max-width:500px){.header,.body{padding:28px 22px}.ty-wrap{margin:0 22px}.footer{padding:20px 22px}.headline{font-size:32px}.resources{grid-template-columns:1fr}.ty-inner{flex-direction:column;gap:12px}.contacts{flex-direction:column}}</style></head><body><div class="wrapper"><div class="card"><div class="header"><div class="hdr-bg"></div><div class="hdr-texture"></div><div class="hdr-circle"></div><div class="hdr-inner"><div class="logo-row"><div class="logo-left"><div class="logo-mark">HL</div><div class="logo-name">HSBT<b>LEET</b>.com</div></div><div class="chip-live"><div class="chip-dot"></div>100% Free</div></div><div class="eyebrow">&#10022; &nbsp; Welcome Aboard</div><h1 class="headline">Your Polytechnic<br/>Journey <em>Starts</em> <span class="glow">Here.</span></h1><p class="subline">Crack Haryana LEET &amp; HSBTE with organized syllabi, previous year papers, and practice sets &mdash; all free, all in one place.</p></div></div><div class="ty-wrap"><div class="ty-card"><div class="ty-bar"></div><div class="ty-inner"><div class="ty-icon">&#127942;</div><div><div class="ty-title">Hey ' + name + ', welcome to hsbteleet.com!</div><div class="ty-desc">We\'re genuinely grateful you\'re here. <strong>Thousands of students</strong> across Haryana trust us for their LEET prep &mdash; and we promise to keep being the <strong>best free resource</strong> for your journey. You made a great choice. Let\'s get cracking! &#127919;</div></div></div></div></div><div class="body"><div class="greeting"><p><strong>Hey ' + name + '! &#128075;</strong><br/><br/>Welcome to <a href="https://hsbteleet.com"><strong>hsbteleet.com</strong></a> &mdash; we\'re absolutely thrilled you\'re here. Whether you\'re gearing up for <strong>Haryana LEET</strong> or need <strong>HSBTE PYQs</strong> for any branch, we\'ve built this platform just for students like you. Well-organized, regularly updated, and always free.<br/><br/>Let\'s get you fully prepared. <strong>You\'ve got this! &#128640;</strong></p></div><div class="stats"><div class="stat"><div class="stat-n">500<sup>+</sup></div><div class="stat-l">PYQs</div><div class="stat-s">All branches</div></div><div class="stat"><div class="stat-n">10<sup>+</sup></div><div class="stat-l">Branches</div><div class="stat-s">HSBTE covered</div></div><div class="stat"><div class="stat-n">&infin;</div><div class="stat-l">Free</div><div class="stat-s">Always</div></div></div><div class="sec"><div class="sec-l"></div><div class="sec-t">&#128218; Quick Access Resources</div><div class="sec-l"></div></div><div class="resources"><a href="https://hsbteleet.com/syllabus/syllabus.html" class="rc rc-a" target="_blank"><div class="rc-arr">&#8599;</div><div class="rc-ico">&#128203;</div><div class="rc-title">Syllabus</div><div class="rc-desc">Full updated LEET syllabus with topic-wise breakdown</div></a><a href="https://hsbteleet.com/haryanaleet" class="rc rc-b" target="_blank"><div class="rc-arr">&#8599;</div><div class="rc-ico">&#128221;</div><div class="rc-title">Haryana LEET</div><div class="rc-desc">Sample papers &amp; full practice sets</div></a><a href="https://hsbteleet.com/hsbte-pyq" class="rc rc-c" target="_blank"><div class="rc-arr">&#8599;</div><div class="rc-ico">&#128194;</div><div class="rc-title">HSBTE PYQ</div><div class="rc-desc">Previous year questions &mdash; all branches covered</div></a><a href="https://hsbteleet.com" class="rc rc-d" target="_blank"><div class="rc-arr">&#8599;</div><div class="rc-ico">&#127968;</div><div class="rc-title">Homepage</div><div class="rc-desc">Browse all resources &amp; latest updates</div></a></div><a href="https://hsbteleet.com" class="cta" target="_blank">&#128640; &nbsp; Start Preparing Now &mdash; hsbteleet.com</a><div class="cta-note"><div class="cta-ni"><span class="cta-dot">&#10003;</span> No login needed</div><div class="cta-ni"><span class="cta-dot">&#10003;</span> Updated regularly</div><div class="cta-ni"><span class="cta-dot">&#10003;</span> Free forever</div></div><div class="divider"></div><div class="contact-box"><div class="contact-lbl">&#129309; Need Help? Reach Out Anytime</div><div class="contacts"><a href="https://wa.me/917988316241" class="pill" target="_blank"><div class="pill-dot pd-wa">&#128241;</div>+91 79883 16241</a><a href="mailto:nishant@hsbteleet.com" class="pill"><div class="pill-dot pd-mail">&#9993;</div>nishant@hsbteleet.com</a><a href="https://itsnishant.com" class="pill" target="_blank"><div class="pill-dot pd-web">&#127760;</div>itsnishant.com</a></div></div></div><div class="footer"><div class="ft-links"><a href="https://hsbteleet.com">Website</a><a href="https://hsbteleet.com/syllabus/syllabus.html">Syllabus</a><a href="https://hsbteleet.com/hsbte-pyq">PYQs</a></div><div class="ft-copy">You received this because you signed up on <a href="https://hsbteleet.com">hsbteleet.com</a>.<br/>&copy; 2025 HSBTELEET.com &middot; Made with &#10084;&#65039; by <a href="https://itsnishant.com">Nishant</a></div></div></div><div class="stamp">hsbteleet.com &middot; Haryana, India</div></div></body></html>';
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
'<label for="leet-college" class="leet-label">College Name <span style="color:#ec4899;font-size:0.6rem;vertical-align:super;">&#10022;</span></label>',
'<input id="leet-college" name="college" type="text" class="leet-input" placeholder="e.g. GP Mandi Adampur" autocomplete="organization" required />',
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