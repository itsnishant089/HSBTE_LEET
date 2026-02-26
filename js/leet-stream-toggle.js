// js/leet-stream-toggle.js
// Simple B.Tech / B.Pharmacy LEET stream toggle for LEET-related pages.
// Usage:
// - Add a container with [data-leet-toggle] and two buttons with data-stream-select="btech" / "bpharmacy".
// - Wrap stream-specific sections in elements with data-leet-stream="btech" or "bpharmacy".
// - Generic content can omit data-leet-stream and will always be visible.

(function () {
  'use strict';

  var STORAGE_KEY = 'leetPreferredStream';
  var DEFAULT_STREAM = 'btech';

  function getPreferredStream() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      if (v === 'btech' || v === 'bpharmacy') return v;
    } catch (e) {
      // ignore
    }
    return DEFAULT_STREAM;
  }

  function setPreferredStream(stream) {
    try {
      localStorage.setItem(STORAGE_KEY, stream);
    } catch (e) {
      // ignore
    }
  }

  function applyStream(stream) {
    // Update active state on buttons
    var buttons = document.querySelectorAll('[data-leet-toggle] [data-stream-select]');
    buttons.forEach(function (btn) {
      var s = btn.getAttribute('data-stream-select');
      if (s === stream) {
        btn.classList.add('leet-stream-active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('leet-stream-active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Show/hide stream-specific blocks
    var blocks = document.querySelectorAll('[data-leet-stream]');
    blocks.forEach(function (el) {
      var s = el.getAttribute('data-leet-stream');
      if (s === stream) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  }

  function initToggle() {
    var containers = document.querySelectorAll('[data-leet-toggle]');
    if (!containers.length) return;

    var currentStream = getPreferredStream();

    containers.forEach(function (container) {
      var buttons = container.querySelectorAll('[data-stream-select]');
      buttons.forEach(function (btn) {
        if (btn.__leetBound) return;
        btn.__leetBound = true;
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var stream = btn.getAttribute('data-stream-select');
          if (stream !== 'btech' && stream !== 'bpharmacy') return;
          setPreferredStream(stream);
          applyStream(stream);
        });
      });
    });

    applyStream(currentStream);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToggle);
  } else {
    initToggle();
  }
})();

