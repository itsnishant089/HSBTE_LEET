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
      toggle.textContent = "☀️ Light Mode";
    }

    toggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");

      if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("darkMode", "enabled");
        toggle.textContent = "☀️ Light Mode";
      } else {
        localStorage.setItem("darkMode", "disabled");
        toggle.textContent = "🌙 Dark Mode";
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
