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
