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

    const res = await fetch(url + (url.indexOf('?') === -1 ? '?v=20261018' : ''), {
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

  function ensureLayoutFixCss() {
    if (document.querySelector('link[href*="layout-fix.css"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/layout-fix.css?v=20261011";
    document.head.appendChild(link);
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
   * Auto-inject the LEET resource card on eligible pages
   * that don't already have it embedded inline.
   * Skips admin, premium, LEET-specific, and utility pages.
   */
  function autoInjectSeoRelatedLinks() {
    // Already present — skip to avoid duplicates
    if (document.querySelector("[data-seo-related-links]")) return;

    const path = window.location.pathname.toLowerCase();

    // Pages that should NOT get the card
    var skipPatterns = [
      "admin", "premium", "login", "contact",
      "download", "email-preview", "papers-updating",
      "haryanaleet", "haryana-leet-", "leet-overview",
      "leet-syllabus", "leet-sample-paper", "leet-preparation",
      "leet-tentative", "leet-counselling", "btech-leet",
      "b-pharmacy-leet", "section-a", "section-b",
      "section-c", "section-d", "404",
      "rank-analysis", "study-plan", "college-comparison",
      "college-predictor", "cutoff-analytics", "last-year-cutoff",
      "counseling", "user-counseling", "terms", "book", "privacy"
    ];

    for (var i = 0; i < skipPatterns.length; i++) {
      if (path.indexOf(skipPatterns[i]) !== -1) return;
    }

    // Build the card HTML
    var html =
      '<section class="seo-related-links" data-seo-related-links="1" aria-label="Related Haryana LEET resources">' +
      '<div class="seo-related-inner">' +
        '<div class="seo-related-head">' +
          '<span class="seo-related-badge"><i class="fas fa-compass" aria-hidden="true"></i> Explore</span>' +
          '<h2>Related Haryana LEET 2027 Resources</h2>' +
          '<p>Useful links for diploma students preparing for B.Tech lateral entry in Haryana.</p>' +
        '</div>' +
        '<div class="seo-related-grid">' +
          '<a class="seo-related-card" href="/haryanaleet"><i class="fas fa-graduation-cap" aria-hidden="true"></i><span>Haryana LEET 2027 guide</span></a>' +
          '<a class="seo-related-card" href="/leet-syllabus"><i class="fas fa-book-open" aria-hidden="true"></i><span>Haryana LEET syllabus</span></a>' +
          '<a class="seo-related-card" href="/leet-sample-paper"><i class="fas fa-file-lines" aria-hidden="true"></i><span>LEET sample papers</span></a>' +
          '<a class="seo-related-card" href="/haryana-leet-exam-pattern"><i class="fas fa-clipboard-list" aria-hidden="true"></i><span>LEET exam pattern</span></a>' +
          '<a class="seo-related-card" href="/last-year-cutoff"><i class="fas fa-chart-line" aria-hidden="true"></i><span>Haryana LEET cutoff</span></a>' +
          '<a class="seo-related-card" href="/haryana-leet-counselling"><i class="fas fa-users" aria-hidden="true"></i><span>LEET counselling process</span></a>' +
          '<a class="seo-related-card" href="/btech-leet-premium"><i class="fas fa-crown" aria-hidden="true"></i><span>Premium LEET papers</span></a>' +
          '<a class="seo-related-card" href="/counseling"><i class="fas fa-headset" aria-hidden="true"></i><span>Personalized counselling help</span></a>' +
        '</div>' +
      '</div>' +
      '</section>';

    // Insert before footer or at end of body
    var footer = document.querySelector("footer") ||
                 document.querySelector('[data-include*="footer"]');
    if (footer) {
      footer.insertAdjacentHTML("beforebegin", html);
    } else {
      document.body.insertAdjacentHTML("beforeend", html);
    }
  }

  /**
   * Auto-inject the shared LEET sub-navigation (and a "next step" strip)
   * on every Haryana LEET page so users can jump between LEET sections.
   */
  var LEET_NAV_EXACT = [
    "/haryanaleet", "/btech-leet", "/b-pharmacy-leet", "/btech-leet-key-dates",
    "/b-pharmacy-leet-key-dates", "/btech-leet-sample-paper", "/b-pharmacy-leet-sample-paper",
    "/btech-leet-premium", "/leet-overview", "/leet-syllabus", "/leet-sample-paper",
    "/leet-preparation-guide", "/leet-notes", "/leet-tentative-dates", "/leet-counselling",
    "/last-year-cutoff", "/cutoff-analytics", "/college-comparison", "/college-predictor",
    "/rank-analysis", "/study-plan", "/counseling"
  ];

  function autoInjectLeetNav() {
    if (document.querySelector("[data-leet-nav]")) return;
    var path = window.location.pathname.toLowerCase().replace(/\.html$/, "").replace(/\/$/, "");
    path = path.replace(/^\/html/, "");
    var isLeet = LEET_NAV_EXACT.indexOf(path) !== -1 ||
      (path.indexOf("/haryana-leet-") === 0 && path.indexOf("admin") === -1);
    if (!isLeet) return;

    var header = document.querySelector('[data-include*="header"]');
    if (!header) return;
    var nav = document.createElement("div");
    nav.setAttribute("data-include", "/partials/leet-nav.html");
    nav.setAttribute("data-leet-nav", "1");
    header.insertAdjacentElement("afterend", nav);
    leetNavPath = path;

    if (path !== "/btech-leet-premium" && path !== "/counseling") {
      var next = document.createElement("div");
      next.className = "leet-next";
      next.setAttribute("data-leet-next", "1");
      next.innerHTML =
        '<div class="leet-next-box"><div><h2>Ready to practise for Haryana LEET 2027?</h2>' +
        '<p>Solve free sample papers, then check cutoffs and plan your counselling.</p></div>' +
        '<div class="leet-next-btns"><a href="/leet-sample-paper">Free Sample Papers</a>' +
        '<a href="/last-year-cutoff">Check Cutoffs</a><a href="/haryana-leet-book">LEET Book</a><a class="gold" href="/btech-leet-premium">Premium Papers</a></div></div>';
      var footer = document.querySelector('[data-include*="footer"]');
      if (footer) footer.insertAdjacentElement("beforebegin", next);
    }
  }

  /**
   * LEET look & feel (same design language as the Haryana LEET Book page) on every LEET page.
   */
  function autoLeetTheme() {
    var path = window.location.pathname.toLowerCase().replace(/\.html$/, "").replace(/\/$/, "").replace(/^\/html/, "");
    var isLeet = LEET_NAV_EXACT.indexOf(path) !== -1 || path === "/premium-login" ||
      (path.indexOf("/haryana-leet-") === 0 && path.indexOf("admin") === -1);
    if (!isLeet || path === "/haryana-leet-book") return;
    document.body.classList.add("leet-themed");
    if (!document.querySelector('link[href*="leet-theme.css"]')) {
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "/css/leet-theme.css?v=20261019"; document.head.appendChild(l);
    }
    var sc = document.createElement("script"); sc.src = "/js/leet-theme.js?v=20261019"; sc.defer = true; document.body.appendChild(sc);
  }

  var leetNavPath = "";
  function markLeetNavActive() {
    if (!leetNavPath) return;
    var alias = { "/leet-syllabus": "/haryana-leet-syllabus", "/btech-leet": "/haryanaleet",
      "/leet-overview": "/haryanaleet", "/leet-counselling": "/haryana-leet-counselling",
      "/btech-leet-sample-paper": "/leet-sample-paper", "/cutoff-analytics": "/last-year-cutoff",
      "/leet-tentative-dates": "/leet-tentative-dates" };
    var target = alias[leetNavPath] || leetNavPath;
    document.querySelectorAll(".leet-subnav a").forEach(function (a) {
      if (a.getAttribute("href") === target) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
        if (a.scrollIntoView) { try { a.scrollIntoView({ inline: "center", block: "nearest" }); } catch (e) {} }
      }
    });
  }

  /**
   * Load all partials
   */
  async function loadPartials() {
    ensureFontAwesome();
    ensureSeoRelatedCss();
    ensureLayoutFixCss();
    autoInjectBottomNav();
    autoInjectSeoRelatedLinks();
    autoInjectLeetNav();
    autoLeetTheme();

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

    markLeetNavActive();

    // Fire custom event after all partials loaded
    document.dispatchEvent(
      new Event("partialsLoaded")
    );
  }

  // Start after page fully loaded
  window.addEventListener("DOMContentLoaded", loadPartials);

})();