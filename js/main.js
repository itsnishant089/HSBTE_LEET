/**
 * main.js — core site logic with robust error handling and performance optimizations.
 */

// ─── Global Error Handler ───────────────────────────────────────────────
window.addEventListener('error', function(e) {
  console.warn('Caught JS error:', e.message, 'at', e.filename, ':', e.lineno);
  return true; // Prevents the error from bubble-crashing some browsers
});

// ─── Core Functionality ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW registration failed:', err));
    });
  }

  // Partials Loading Trigger
  if (document.body.classList.contains("partials-ready")) {
    document.dispatchEvent(new Event("partialsLoaded"));
  }
});

document.addEventListener("partialsLoaded", () => {
  try {
    initDarkMode();
    initMobileNav();
    initLanguageSelect();
    initGoTopButton();
  } catch (err) {
    console.error("Error initializing core features:", err);
  }
});

/** Dark Mode Toggle with persistence */
function initDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;

  const savedMode = localStorage.getItem("darkMode");
  if (savedMode === "enabled") {
    document.body.classList.add("dark-mode");
    toggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
  }

  toggle.onclick = () => {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
    toggle.innerHTML = isDark ? '<i class="fas fa-sun"></i> Light Mode' : '<i class="fas fa-moon"></i> Dark Mode';
  };
}

/** Mobile Menu & Stream Toggles */
function initMobileNav() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (!toggle || !navMenu) return;

  // The partial header.html handles its own internal menu script, 
  // but we ensure the mobile-menu-overlay exists.
  let overlay = document.querySelector('.mobile-menu-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:999;display:none;';
    document.body.appendChild(overlay);
  }
}

/** Google Translate Integration Helper */
function initLanguageSelect() {
  const languageSelect = document.getElementById("languageSelect");
  if (!languageSelect) return;

  languageSelect.onchange = function() {
    const lang = this.value;
    if (!lang) return;
    const checkCount = 0;
    const interval = setInterval(() => {
      const googleSelect = document.querySelector(".goog-te-combo");
      if (googleSelect) {
        googleSelect.value = lang;
        googleSelect.dispatchEvent(new Event("change"));
        clearInterval(interval);
      } else if (checkCount > 20) {
        clearInterval(interval);
      }
    }, 300);
  };
}

/** Smooth Scroll to Top */
function initGoTopButton() {
  const goTopBtn = document.getElementById("goTopBtn");
  if (!goTopBtn) return;

  const handleScroll = () => {
    if (window.scrollY > 400) {
      goTopBtn.classList.add("show");
    } else {
      goTopBtn.classList.remove("show");
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  goTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── UI Enhancements & Accessibility ───────────────────────────────────

/** Text Zooming */
function setTextSize(size) {
  try {
    document.body.classList.remove("text-small", "text-medium", "text-large");
    document.body.classList.add("text-" + size);
    localStorage.setItem("textSize", size);
  } catch (e) {}
}

/** FAQ Accordions */
(function initFAQs() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.faq-question');
    if (!btn) return;
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    
    // Close others
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    
    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

/** Lazy Loading Images Fallback */
(function initLazyLoad() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  document.querySelectorAll('img[loading="lazy"]').forEach(img => observer.observe(img));
})();

/** Persistent Stream Toggles (BTech / BPharmacy) */
function initStreamToggles() {
  const streamWraps = document.querySelectorAll('[data-leet-toggle]');
  if (!streamWraps.length) return;

  function applyStream(stream) {
    document.querySelectorAll('[data-stream-select]').forEach(btn => {
      const active = btn.getAttribute('data-stream-select') === stream;
      btn.classList.toggle('lp-active', active);
    });
    document.querySelectorAll('[data-leet-stream]').forEach(el => {
      el.style.display = (el.getAttribute('data-leet-stream') === stream) ? '' : 'none';
    });
    localStorage.setItem('leet-stream', stream);
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-stream-select]');
    if (btn) applyStream(btn.getAttribute('data-stream-select'));
  });

  const saved = localStorage.getItem('leet-stream') || 'btech';
  applyStream(saved);
}

/** Dynamic Breadcrumb Generator for 260+ pages */
function initDynamicBreadcrumbs() {
  const container = document.querySelector('.leet-breadcrumb');
  if (!container) return; // Only if the page has a breadcrumb container

  const path = window.location.pathname;
  const parts = path.split('/').filter(p => p && !p.endsWith('.html'));
  let html = '<a href="/">Home</a>';
  let currentPath = '';

  parts.forEach((part, index) => {
    currentPath += `/${part}`;
    const cleanName = part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    html += ` <span class="sep">/</span> `;
    if (index === parts.length - 1) {
      html += `<span class="current">${cleanName}</span>`;
    } else {
      html += `<a href="${currentPath}">${cleanName}</a>`;
    }
  });
  container.innerHTML = html;
}

/** Sleek Page Progress Bar */
function initProgressBar() {
  const bar = document.createElement('div');
  bar.id = 'page-progress-bar';
  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg, #1565c0, #f59e0b);z-index:99999;width:0%;transition:width 0.2s ease;box-shadow: 0 0 10px rgba(21, 101, 192, 0.5);';
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    bar.style.width = scrolled + "%";
  }, { passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  initProgressBar();
  initDynamicBreadcrumbs();
  initStreamToggles();
  // Recovery helper...
  setTimeout(() => {
    if (!document.body.classList.contains("partials-ready")) {
       document.dispatchEvent(new Event("partialsLoaded"));
    }
  }, 2000);
});

document.addEventListener("partialsLoaded", () => {
  document.body.classList.add("partials-ready");
});