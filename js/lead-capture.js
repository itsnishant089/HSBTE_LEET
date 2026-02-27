(function () {
'use strict';
try {
if (localStorage.getItem('leetLeadCaptured') === '1') {
return;
}
} catch (e) {}
var SUPABASE_URL      = 'https://jnsowbnkccddcrkuonan.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impuc293Ym5rY2NkZGNya3VvbmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjY0MzksImV4cCI6MjA4NzcwMjQzOX0.PbiJI8SOxjgDPAP0njNN8aIW3yArJmstxi_VRhPuM5k';
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
if (!preparation) {
setInputState(qs('#leet-preparation'), 'error');
return 'Please select what you are preparing for.';
}
if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
setInputState(qs('#leet-email'), 'error');
return 'Please enter a valid email address.';
}
if (college.length > 200 || branch.length > 200) {
return 'College and Branch should not be excessively long.';
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
async function submitLead(form) {
var client = getSupabaseClient();
if (!client) throw new Error('supabase_client_unavailable');
var payload = {
name:        (form.elements.name.value        || '').trim(),
college:     (form.elements.college.value     || '').trim() || null,
mobile:      (form.elements.mobile.value      || '').trim(),
branch:      (form.elements.branch.value      || '').trim() || null,
email:       (form.elements.email.value       || '').trim() || null,
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
'<input id="leet-name" name="name" type="text" class="leet-input" placeholder="e.g. Rahul Sharma" autocomplete="name" required />',
'</div>',
'<div class="leet-field">',
'<label for="leet-college" class="leet-label">College Name</label>',
'<input id="leet-college" name="college" type="text" class="leet-input" placeholder="e.g. GPCG Patiala" autocomplete="organization" />',
'</div>',
'<div class="leet-field">',
'<label for="leet-mobile" class="leet-label">Mobile Number <span style="color:#ec4899;font-size:0.6rem;vertical-align:super;">&#10022;</span></label>',
'<input id="leet-mobile" name="mobile" type="tel" class="leet-input" placeholder="e.g. 9876543210" inputmode="numeric" pattern="\\d{10,15}" autocomplete="tel" required />',
'<small class="leet-hint">&#128241; 10digit mobile number</small>',
'</div>',
'<div class="leet-field">',
'<label for="leet-branch" class="leet-label">Branch</label>',
'<input id="leet-branch" name="branch" type="text" class="leet-input" placeholder="e.g. Computer Science" autocomplete="off" />',
'</div>',
'<div class="leet-field">',
'<label for="leet-email" class="leet-label">Email</label>',
'<input id="leet-email" name="email" type="email" class="leet-input" placeholder="you@example.com" autocomplete="email" />',
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