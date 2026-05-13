/**
 * include.js — loads [data-include] partials with in-memory caching.
 * The same partial file (e.g. /partials/header.html) is only fetched ONCE
 * per page load, even if multiple elements reference it.
 *
 * Also auto-injects the bottom navigation bar on every page.
 */
(function () {
  "use strict";

  // In-memory cache: url → html string (lives for the page session)
  const partialCache = new Map();

  async function fetchPartial(url) {
    if (partialCache.has(url)) {
      return partialCache.get(url);
    }
    const res = await fetch(url, {
      // Tell the browser to use its HTTP cache aggressively
      cache: "force-cache"
    });
    if (!res.ok) throw new Error(`Failed to load partial: ${url} (${res.status})`);
    const html = await res.text();
    partialCache.set(url, html);
    return html;
  }

  function executeScripts(container) {
    container.querySelectorAll("script").forEach(oldScript => {
      const newScript = document.createElement("script");
      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else {
        newScript.textContent = oldScript.textContent;
      }
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  /**
   * Auto-inject bottom-nav partial if not already present.
   * Inserts a placeholder div before the first footer include element.
   */
  function autoInjectBottomNav() {
    // Skip admin / premium-admin pages
    const path = window.location.pathname.toLowerCase();
    if (path.includes('admin')) return;

    // Check if bottom-nav include already exists
    const existing = document.querySelector('[data-include*="bottom-nav"]');
    if (existing) return;

    // Find the footer include to insert before it
    const footerEl = document.querySelector('[data-include*="footer"]');
    if (footerEl) {
      const navDiv = document.createElement('div');
      navDiv.setAttribute('data-include', '/partials/bottom-nav.html');
      footerEl.parentNode.insertBefore(navDiv, footerEl);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Auto-inject bottom nav before processing includes
    autoInjectBottomNav();

    const includes = document.querySelectorAll("[data-include]");

    if (includes.length === 0) {
      document.dispatchEvent(new Event("partialsLoaded"));
      return;
    }

    let done = 0;
    const total = includes.length;

    function checkDone() {
      done++;
      if (done === total) {
        document.dispatchEvent(new Event("partialsLoaded"));
      }
    }

    includes.forEach(el => {
      const url = el.getAttribute("data-include");
      fetchPartial(url)
        .then(html => {
          el.innerHTML = html;
          executeScripts(el);
        })
        .catch(err => {
          console.error("Error loading partial:", err);
        })
        .finally(checkDone);
    });
  });
})();