/**
 * include.js — loads [data-include] partials with in-memory caching.
 * The same partial file (e.g. /partials/header.html) is only fetched ONCE
 * per page load, even if multiple elements reference it.
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

  document.addEventListener("DOMContentLoaded", () => {
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