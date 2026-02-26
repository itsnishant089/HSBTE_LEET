// js/lead-capture.js
// Lightweight, production-ready lead capture modal for HSBTE LEET site
// Uses Supabase JS v2 (UMD) loaded on demand from CDN.
// Fill in SUPABASE_URL and SUPABASE_ANON_KEY with your Supabase project credentials.

(function () {
  'use strict';

  // Supabase project configuration (client-side safe anon key)
  // URL: https://jnsowbnkccddcrkuonan.supabase.co
  var SUPABASE_URL = 'https://jnsowbnkccddcrkuonan.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impuc293Ym5rY2NkZGNya3VvbmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjY0MzksImV4cCI6MjA4NzcwMjQzOX0.PbiJI8SOxjgDPAP0njNN8aIW3yArJmstxi_VRhPuM5k';

  var supabaseClient = null;
  var supabaseLoading = false;
  var supabaseReadyCallbacks = [];

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function ensureStylesheet() {
    // Avoid duplicates
    if (document.querySelector('link[data-leet-modal="1"]')) {
      return;
    }
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    // Use root-relative path so it works from / and /html/* pages
    link.href = '/css/lead-modal.css';
    link.setAttribute('data-leet-modal', '1');
    (document.head || document.documentElement).appendChild(link);
  }

  function ensureSupabaseLoaded(callback) {
    // callback(error) – error is null/undefined on success
    if (typeof callback !== 'function') {
      callback = function () {};
    }

    if (window.supabase) {
      callback(null);
      return;
    }

    supabaseReadyCallbacks.push(callback);

    if (supabaseLoading) {
      return;
    }

    supabaseLoading = true;

    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.48.0/dist/umd/supabase.js';
    script.async = true;

    script.onload = function () {
      supabaseLoading = false;
      var callbacks = supabaseReadyCallbacks.slice();
      supabaseReadyCallbacks = [];
      for (var i = 0; i < callbacks.length; i++) {
        try {
          callbacks[i](null);
        } catch (e) {
          console.error('Supabase callback error:', e);
        }
      }
    };

    script.onerror = function () {
      supabaseLoading = false;
      console.error('Failed to load Supabase JS library.');
      var callbacks = supabaseReadyCallbacks.slice();
      supabaseReadyCallbacks = [];
      for (var i = 0; i < callbacks.length; i++) {
        try {
          callbacks[i](new Error('supabase_load_failed'));
        } catch (e) {
          console.error('Supabase error callback error:', e);
        }
      }
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
    msgEl.classList.remove('leet-modal-message--error', 'leet-modal-message--success');
    if (type === 'error') {
      msgEl.classList.add('leet-modal-message--error');
    } else if (type === 'success') {
      msgEl.classList.add('leet-modal-message--success');
    }
  }

  function validateForm(form) {
    var name = (form.elements.name.value || '').trim();
    var college = (form.elements.college.value || '').trim();
    var mobile = (form.elements.mobile.value || '').trim();
    var branch = (form.elements.branch.value || '').trim();
    var email = (form.elements.email.value || '').trim();
    var preparation = form.elements.preparation.value;

    if (!name || !mobile || !preparation) {
      return 'Name, Mobile Number and Preparation For are required.';
    }

    if (!/^\d{10,15}$/.test(mobile)) {
      return 'Please enter a valid mobile number (10–15 digits).';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.';
    }

    // Optional fields – ensure they are not too long
    if (college.length > 200 || branch.length > 200) {
      return 'College and Branch should not be excessively long.';
    }

    return null;
  }

  function showModal() {
    var overlay = qs('#leet-lead-modal-overlay');
    var dialog = overlay && qs('.leet-modal', overlay);
    if (!overlay || !dialog) return;
  
    overlay.classList.remove('leet-modal-hidden');
    overlay.setAttribute('aria-hidden', 'false');
  
    // mark open time
    overlay.__openedAt = Date.now();
  
    try {
      sessionStorage.setItem('leetLeadModalShown', '1');
    } catch (e) {}
  
    var firstInput = qs('input, select, button', dialog);
    if (firstInput && typeof firstInput.focus === 'function') {
      firstInput.focus();
    }
  }
  function hideModal() {
    var overlay = qs('#leet-lead-modal-overlay');
    if (!overlay) return;
    overlay.classList.add('leet-modal-hidden');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function shouldShowModalThisSession() {
    try {
      return sessionStorage.getItem('leetLeadModalShown') !== '1';
    } catch (e) {
      // If sessionStorage not available, show modal on each visit
      return true;
    }
  }
  function handleOverlayClick(event) {
    var overlay = qs('#leet-lead-modal-overlay');
    var dialog = overlay && qs('.leet-modal', overlay);
    if (!overlay || !dialog) return;
  
    // ignore first click after open
    if (Date.now() - (overlay.__openedAt || 0) < 400) {
      return;
    }
  
    if (event.target === overlay) {
      hideModal();
    }
  }
 

  async function submitLead(form) {
    var client = getSupabaseClient();
    if (!client) {
      throw new Error('supabase_client_unavailable');
    }

    var payload = {
      name: (form.elements.name.value || '').trim(),
      college: (form.elements.college.value || '').trim() || null,
      mobile: (form.elements.mobile.value || '').trim(),
      branch: (form.elements.branch.value || '').trim() || null,
      email: (form.elements.email.value || '').trim() || null,
      preparation: form.elements.preparation.value,
      page: window.location.href
    };

    var result = await client.from('leet_leads').insert([payload]);
    if (result.error) {
      throw result.error;
    }
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
      submitBtn.textContent = 'Submitting...';
    }

    ensureSupabaseLoaded(function (loadError) {
      if (loadError) {
        console.error('Supabase load error:', loadError);
        setMessage('Unable to submit right now. Please try again later.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        }
        return;
      }

      submitLead(form)
        .then(function () {
          setMessage('Thank you! Your details have been submitted.', 'success');
          form.reset();
          setTimeout(hideModal, 1200);
        })
        .catch(function (err) {
          console.error('Supabase insert error:', err);
          setMessage('Submission failed. Please try again in a moment.', 'error');
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
          }
        });
    });
  }
  function handleKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      hideModal();
    }
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
 

  function buildModal() {
    if (!document.body) {
      return;
    }
    // If already present (e.g. added manually), just wire up events
    if (qs('#leet-lead-modal-overlay')) {
      attachEvents();
      return;
    }

    var wrapper = document.createElement('div');

    // Only modal markup – scripts and styles are handled separately
    wrapper.innerHTML =
      '<div id="leet-lead-modal-overlay" class="leet-modal-overlay leet-modal-hidden" aria-hidden="true">' +
      '  <div class="leet-modal" role="dialog" aria-modal="true" aria-labelledby="leet-modal-title">' +
      '    <button type="button" class="leet-modal-close" aria-label="Close lead capture form">×</button>' +
      '    <h2 id="leet-modal-title" class="leet-modal-title">Get Free HSBTE LEET Preparation Help</h2>' +
      '    <p class="leet-modal-subtitle">Fill your details to receive important updates, study material and guidance.</p>' +
      '    <form id="leet-lead-form" class="leet-modal-form" novalidate>' +
      '      <div class="leet-field">' +
      '        <label for="leet-name" class="leet-label">Name *</label>' +
      '        <input id="leet-name" name="name" type="text" class="leet-input" autocomplete="name" required />' +
      '      </div>' +
      '      <div class="leet-field">' +
      '        <label for="leet-college" class="leet-label">College Name</label>' +
      '        <input id="leet-college" name="college" type="text" class="leet-input" autocomplete="organization" />' +
      '      </div>' +
      '      <div class="leet-field">' +
      '        <label for="leet-mobile" class="leet-label">Mobile Number *</label>' +
      '        <input id="leet-mobile" name="mobile" type="tel" class="leet-input" inputmode="numeric" pattern="\\d{10,15}" autocomplete="tel" required />' +
      '        <small class="leet-hint">10–15 digit mobile number</small>' +
      '      </div>' +
      '      <div class="leet-field">' +
      '        <label for="leet-branch" class="leet-label">Branch</label>' +
      '        <input id="leet-branch" name="branch" type="text" class="leet-input" autocomplete="off" />' +
      '      </div>' +
      '      <div class="leet-field">' +
      '        <label for="leet-email" class="leet-label">Email</label>' +
      '        <input id="leet-email" name="email" type="email" class="leet-input" autocomplete="email" />' +
      '      </div>' +
      '      <div class="leet-field">' +
      '        <label for="leet-preparation" class="leet-label">Preparation For *</label>' +
      '        <select id="leet-preparation" name="preparation" class="leet-input" required>' +
      '          <option value="" disabled selected>Select an option</option>' +
      '          <option value="HSBTE PYQ">HSBTE PYQ</option>' +
      '          <option value="B.Tech LEET">B.Tech LEET</option>' +
      '          <option value="B.Pharmacy LEET">B.Pharmacy LEET</option>' +
      '        </select>' +
      '      </div>' +
      '      <button type="submit" class="leet-modal-submit">Submit</button>' +
      '      <p class="leet-modal-privacy">We respect your privacy. Your details are used only for HSBTE LEET related communication.</p>' +
      '    </form>' +
      '    <div id="leet-modal-message" class="leet-modal-message" aria-live="polite"></div>' +
      '  </div>' +
      '</div>';

    var overlay = wrapper.firstElementChild;
    if (!overlay) {
      return;
    }

    document.body.appendChild(overlay);
    attachEvents();
  }

  function initLeadModal() {
    ensureStylesheet();
    buildModal();

    if (!shouldShowModalThisSession()) {
      return;
    }

    // Small delay so it never blocks initial render
    setTimeout(showModal, 1000);
  }

  // Initialize when DOM is ready (works even if script is loaded late via partials)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLeadModal);
  } else {
    // DOM already parsed
    initLeadModal();
  }
})();

