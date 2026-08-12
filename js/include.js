/**
 * include.js
 * Loads all [data-include] partials with caching.
 * Auto-injects bottom navigation on all non-admin pages.
 */

(function () {
  "use strict";

  // Allow PYQ/PDF links to open directly.
  // Blocks legacy ads.js download.html hijack (even if an old ads.js is cached).
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest && e.target.closest("a");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (!href || href.charAt(0) === "#") return;
      var lower = href.toLowerCase();
      if (
        href.indexOf("/paper/") !== -1 ||
        href.indexOf("/pdf/") !== -1 ||
        href.indexOf("/syllabus/") !== -1 ||
        lower.endsWith(".pdf")
      ) {
        e.stopImmediatePropagation();
      }
    },
    true
  );

  // Cache for already fetched partials
  const partialCache = new Map();

  /**
   * Fetch partial HTML with cache
   */
  async function fetchPartial(url) {
    if (partialCache.has(url)) {
      return partialCache.get(url);
    }

    const res = await fetch(url, {
      cache: "force-cache"
    });

    if (!res.ok) {
      throw new Error(
        `Failed to load partial: ${url} (${res.status})`
      );
    }

    const html = await res.text();

    partialCache.set(url, html);

    return html;
  }

  /**
   * Execute scripts inside included partials
   */
  function executeScripts(container) {
    const scripts = container.querySelectorAll("script");

    scripts.forEach(oldScript => {
      const newScript = document.createElement("script");

      // Copy attributes
      [...oldScript.attributes].forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });

      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else {
        newScript.textContent = oldScript.textContent;
      }

      oldScript.parentNode.replaceChild(
        newScript,
        oldScript
      );
    });
  }

  /**
   * Auto inject bottom navigation
   */
  function autoInjectBottomNav() {
    const path = window.location.pathname.toLowerCase();

    // Skip admin pages and premium pages
    if (path.includes("admin") || path.includes("premium")) return;

    // Prevent duplicate nav
    const existing = document.querySelector(
      '[data-include*="bottom-nav"]'
    );

    if (existing) return;

    // Create nav container
    const navDiv = document.createElement("div");

    navDiv.setAttribute(
      "data-include",
      "/partials/bottom-nav.html"
    );

    // Append at end of body
    document.body.appendChild(navDiv);
  }

  /**
   * Ensure FontAwesome is loaded
   */
  function ensureFontAwesome() {
    const faUrl = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css";
    const existing = document.querySelector(`link[href*="font-awesome"]`);

    if (!existing) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = faUrl;
      document.head.appendChild(link);
      console.log("FontAwesome injected by include.js");
    }
  }

  /**
   * Ensure Related LEET Resources CSS is always loaded
   */
  function ensureSeoRelatedCss() {
    if (document.querySelector('link[href*="seo-related.css"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/seo-related.css";
    document.head.appendChild(link);
  }

  /**
   * Load all partials
   */
  async function loadPartials() {
    ensureFontAwesome();
    ensureSeoRelatedCss();
    autoInjectBottomNav();

    // Get ALL includes AFTER nav injection
    const includes = [
      ...document.querySelectorAll("[data-include]")
    ];

    if (includes.length === 0) {
      document.dispatchEvent(
        new Event("partialsLoaded")
      );
      return;
    }

    await Promise.all(
      includes.map(async el => {
        const url = el.getAttribute("data-include");

        try {
          const html = await fetchPartial(url);

          el.innerHTML = html;

          executeScripts(el);
        } catch (err) {
          console.error(
            "Error loading partial:",
            err
          );
        }
      })
    );

    // Fire custom event after all partials loaded
    document.dispatchEvent(
      new Event("partialsLoaded")
    );
  }

  // Start after page fully loaded
  window.addEventListener("DOMContentLoaded", loadPartials);

})();