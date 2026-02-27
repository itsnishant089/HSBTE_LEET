// ================================
// ERROR HANDLING - PREVENT JS ERRORS
// ================================
window.addEventListener('error', function(e) {
  console.warn('JavaScript error caught:', e.message, e.filename, e.lineno);
  // Prevent error from breaking the page
  return true;
});
// ================================
// PARTIALS LOADED LOGIC
// ================================
document.addEventListener("partialsLoaded", () => {
  // ---------- DARK MODE ----------
  const toggle = document.getElementById("darkModeToggle");
  if (toggle) {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "enabled") {
      document.body.classList.add("dark-mode");
      toggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    }
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("darkMode", "enabled");
        toggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
      } else {
        localStorage.setItem("darkMode", "disabled");
        toggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
      }
    });
  }
  // ---------- MOBILE NAVIGATION MENU ----------
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navItems = document.querySelectorAll('.has-dropdown');
  let overlay = null;
  if (mobileMenuToggle && navMenu) {
    // Create overlay
    overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 999; display: none;';
    document.body.appendChild(overlay);
    mobileMenuToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      const isActive = this.classList.contains('active');
      this.classList.toggle('active');
      navMenu.classList.toggle('active');
      if (navMenu.classList.contains('active')) {
        document.body.classList.add("menu-open");
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
      } else {
        document.body.classList.remove("menu-open");
        overlay.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
    // Close menu when clicking overlay
    overlay.addEventListener('click', function() {
      mobileMenuToggle.classList.remove('active');
      navMenu.classList.remove('active');
      document.body.classList.remove("menu-open");
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    });
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768 && navMenu.classList.contains('active')) {
        if (!mobileMenuToggle.contains(e.target) && !navMenu.contains(e.target) && !overlay.contains(e.target)) {
          mobileMenuToggle.classList.remove('active');
          navMenu.classList.remove('active');
          document.body.classList.remove("menu-open");
          overlay.style.display = 'none';
          document.body.style.overflow = '';
        }
      }
    });
    // Handle dropdown toggle on mobile
    navItems.forEach(item => {
      const link = item.querySelector('.nav-link');
      if (link) {
        link.addEventListener('click', function(e) {
          if (window.innerWidth <= 768) {
            e.preventDefault();
            item.classList.toggle('active');
          }
        });
      }
    });
  }
  // ---------- LANGUAGE TRANSLATOR ----------
  const languageSelect = document.getElementById("languageSelect");
  if (languageSelect) {
    languageSelect.addEventListener("change", function () {
      const lang = this.value;
      if (!lang) return;
      const interval = setInterval(() => {
        const googleSelect = document.querySelector(".goog-te-combo");
        if (googleSelect) {
          googleSelect.value = lang;
          googleSelect.dispatchEvent(new Event("change"));
          clearInterval(interval);
        }
      }, 300);
    });
  }
});
// ---------- FALLBACK IF NO PARTIALS ----------
document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector("[data-include]")) {
    setTimeout(() => {
      document.dispatchEvent(new Event("partialsLoaded"));
    }, 100);
  }
});
// ================================
// TEXT SIZE (ZOOM IN / OUT)
// ================================
function setTextSize(size) {
  document.body.classList.remove("text-small", "text-medium", "text-large");
  document.body.classList.add("text-" + size);
  localStorage.setItem("textSize", size);
}
document.addEventListener("DOMContentLoaded", () => {
  const savedSize = localStorage.getItem("textSize") || "medium";
  setTextSize(savedSize);
});
// ================================
// GO TO TOP BUTTON (SMART & RESPONSIVE)
// ================================
function initGoTopButton() {
  const goTopBtn = document.getElementById("goTopBtn");
  if (!goTopBtn) return;
  // Calculate smart threshold based on page characteristics
  function calculateSmartThreshold() {
    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollableHeight = documentHeight - viewportHeight;
    // For very short pages (less than 2 viewports), use viewport-based threshold
    if (scrollableHeight < viewportHeight * 2) {
      // Short pages: appear after scrolling 15% of viewport
      return Math.max(150, viewportHeight * 0.15);
    }
    // For medium pages (2-5 viewports), use 8% of viewport
    if (scrollableHeight < viewportHeight * 5) {
      return Math.max(200, viewportHeight * 0.08);
    }
    // For long pages (5+ viewports), use 5% of document height
    // This ensures button appears earlier on long pages
    return Math.max(300, scrollableHeight * 0.05);
  }
  let scrollThreshold = calculateSmartThreshold();
  // Recalculate on resize and when content loads
  let resizeTimeout;
  function recalculateThreshold() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      scrollThreshold = calculateSmartThreshold();
      // Re-check current scroll position after recalculation
      toggleGoTopButton();
    }, 150);
  }
  window.addEventListener("resize", recalculateThreshold, { passive: true });
  // Recalculate when content changes (for pages with includes)
  const observer = new MutationObserver(() => {
    recalculateThreshold();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  function toggleGoTopButton() {
    const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > scrollThreshold) {
      goTopBtn.classList.add("show");
    } else {
      goTopBtn.classList.remove("show");
    }
  }
  window.addEventListener("scroll", toggleGoTopButton, { passive: true });
  // Initial check after a small delay to ensure content is loaded
  setTimeout(() => {
    scrollThreshold = calculateSmartThreshold();
    toggleGoTopButton();
  }, 300);
  goTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}
// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", initGoTopButton);
// Also initialize after partials load (for pages with includes)
document.addEventListener("partialsLoaded", () => {
  setTimeout(initGoTopButton, 100);
});
// AdSense - No interference, let it work normally
(function () {
  var goTopBtn = document.getElementById('goTopBtn');
  if (!goTopBtn) return;
  window.addEventListener('scroll', function () {
    goTopBtn.classList.toggle('visible', window.scrollY > 300);
  });
  goTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
(function () {
  var faqBtns = document.querySelectorAll('.faq-question');
  if (!faqBtns.length) return;
  faqBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = this.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (i) {
        i.classList.remove('open');
        i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        this.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();
// ================================
// LEET 2026 — PERFORMANCE & SEO HELPERS
// ================================
(function () {
  if ('loading' in HTMLImageElement.prototype) return; // native support
  var imgs = document.querySelectorAll('img[loading="lazy"]');
  if (!imgs.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var img = entry.target;
        if (img.dataset.src) img.src = img.dataset.src;
        io.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });
  imgs.forEach(function (img) { io.observe(img); });
})();
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var faqs = document.querySelectorAll('.leet-faq-q');
    faqs.forEach(function (q) {
      q.addEventListener('click', function () {
        var item = this.closest('.leet-faq-item');
        var isOpen = item.classList.contains('open');
        // Close all siblings first
        var siblings = item.parentElement.querySelectorAll('.leet-faq-item');
        siblings.forEach(function (s) { s.classList.remove('open'); });
        // Toggle current
        if (!isOpen) item.classList.add('open');
      });
    });
  });
})();
(function () {
  function initLeetToggle() {
    document.querySelectorAll('[data-leet-toggle]').forEach(function (toggleWrap) {
      var btns = toggleWrap.querySelectorAll('[data-stream-select]');
      if (!btns.length) return;
      function applyStream(stream) {
        btns.forEach(function (b) {
          var active = b.getAttribute('data-stream-select') === stream;
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
          b.classList.toggle('lp-active', active);
        });
        document.querySelectorAll('[data-leet-stream]').forEach(function (el) {
          el.style.display = (el.getAttribute('data-leet-stream') === stream) ? '' : 'none';
        });
        try { localStorage.setItem('leet-stream', stream); } catch (e) {}
      }
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          applyStream(btn.getAttribute('data-stream-select'));
        });
      });
      var saved = '';
      try { saved = localStorage.getItem('leet-stream') || ''; } catch (e) {}
      applyStream(saved || 'btech');
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLeetToggle);
  } else {
    initLeetToggle();
  }
  // Also init after partials load
  document.addEventListener('partialsLoaded', function () {
    setTimeout(initLeetToggle, 80);
  });
})();
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var bc = document.querySelector('.leet-breadcrumb');
    if (!bc) return;
    var items = bc.querySelectorAll('a');
    if (!items.length) return;
    var list = [];
    items.forEach(function (a, i) {
      list.push({ '@type': 'ListItem', 'position': i + 1, 'name': a.textContent.trim(), 'item': a.href });
    });
    var current = bc.querySelector('.current');
    if (current) {
      list.push({ '@type': 'ListItem', 'position': list.length + 1, 'name': current.textContent.trim(), 'item': window.location.href });
    }
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': list });
    document.head.appendChild(script);
  });
})();
(function () {
  if (window.performance && window.performance.mark) {
    window.performance.mark('leet-page-interactive');
  }
})();