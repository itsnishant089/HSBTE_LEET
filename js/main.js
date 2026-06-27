/**
 * main.js — core site logic with robust error handling and performance optimizations.
 */

// ─── Global Error Handler ───────────────────────────────────────────────
window.addEventListener('error', function (e) {
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

/** Mobile Menu handled in header.html partial */
function initMobileNav() {
  // Logic moved to partials/header.html for better scoping and reliability.
}

/** Google Translate Integration Helper */
function initLanguageSelect() {
  const languageSelect = document.getElementById("languageSelect");
  if (!languageSelect) return;

  languageSelect.onchange = function () {
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
  } catch (e) { }
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

// --- BTech LEET / Haryana LEET / Premium Popup ---
function runWhenReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

runWhenReady(() => {
  const path = window.location.pathname.toLowerCase();
  const shouldShow = path.includes('btech') || path.includes('haryana-leet') || path.includes('haryanaleet') || path.includes('premium');
  if (!shouldShow) return;
  if (localStorage.getItem('btech_leet_popup_filled')) return;

  // Load Supabase JS
  function loadSupabase(cb) {
    if (window.supabase) return cb();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.48.0/dist/umd/supabase.js';
    script.onload = cb;
    document.head.appendChild(script);
  }

  // Create UI
  const modalHTML = `
    <div id="leet-popup-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.8);backdrop-filter:blur(5px);z-index:999999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.4s ease;">
      <div id="leet-popup-box" style="background:#fff;border-radius:16px;width:90%;max-width:450px;padding:30px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);transform:translateY(20px);transition:transform 0.4s ease;max-height:90vh;overflow-y:auto;position:relative;">
        <button id="leet-popup-close" style="position:absolute;top:15px;right:15px;background:none;border:none;font-size:24px;cursor:pointer;color:#64748b;transition:color 0.2s;">&times;</button>
        <div style="text-align:center;margin-bottom:20px;">
          <div style="background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 15px;"><i class="fas fa-graduation-cap"></i></div>
          <h2 style="font-size:22px;color:#1e293b;margin:0 0 8px;font-weight:700;">Ace Your LEET Exam!</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Share your exam date and basic details to get exclusive, personalized updates and last-minute tips tailored just for you.</p>
        </div>
        <form id="leet-popup-form" style="display:flex;flex-direction:column;gap:12px;">
          <input type="text" id="lp-name" placeholder="Full Name" required style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;outline:none;transition:border-color 0.2s;" />
          <input type="tel" id="lp-mobile" placeholder="Mobile Number" required style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;outline:none;" />
          <input type="email" id="lp-email" placeholder="Email Address" required style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;outline:none;" />
          <input type="text" id="lp-college" placeholder="Current College" required style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;outline:none;" />
          <input type="text" id="lp-branch" placeholder="Branch / Stream" required style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;outline:none;" />
          
          <select id="lp-date" required style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;outline:none;background:#fff;cursor:pointer;">
            <option value="" disabled selected>Select Exam Date</option>
            <option value="2 July">2 July</option>
            <option value="3 July">3 July</option>
            <option value="4 July">4 July</option>
          </select>

          <select id="lp-shift" required style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;outline:none;background:#fff;cursor:pointer;">
            <option value="" disabled selected>Select Shift</option>
            <option value="Shift 1">Shift 1</option>
            <option value="Shift 2">Shift 2</option>
            <option value="Shift 3">Shift 3</option>
          </select>

          <button type="submit" id="lp-submit-btn" style="width:100%;padding:14px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;margin-top:10px;transition:opacity 0.2s, transform 0.1s;">Submit & Get Updates</button>
        </form>
      </div>
    </div>
  `;

  // Wait a bit before showing to not disrupt page load
  setTimeout(() => {
    // If user filled it while another tab was open
    if (localStorage.getItem('btech_leet_popup_filled')) return;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const overlay = document.getElementById('leet-popup-overlay');
    const box = document.getElementById('leet-popup-box');
    const closeBtn = document.getElementById('leet-popup-close');
    const form = document.getElementById('leet-popup-form');

    // Show animation
    setTimeout(() => {
      overlay.style.opacity = '1';
      box.style.transform = 'translateY(0)';
    }, 50);

    const closePopup = () => {
      overlay.style.opacity = '0';
      box.style.transform = 'translateY(20px)';
      setTimeout(() => overlay.remove(), 400);
    };

    if (closeBtn) closeBtn.onclick = closePopup;

    // Handle form submit
    form.onsubmit = (e) => {
      e.preventDefault();
      const btn = document.getElementById('lp-submit-btn');
      btn.textContent = 'Submitting...';
      btn.style.opacity = '0.7';
      btn.style.pointerEvents = 'none';

      loadSupabase(async () => {
        try {
          const SUPA_URL = 'https://vzfpltvchsxsfqlldafd.supabase.co';
          const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZnBsdHZjaHN4c2ZxbGxkYWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTY3NzksImV4cCI6MjA4ODczMjc3OX0.u9oVBYup_-OdTuY2i14sHGQIvZ4gKReMS919_7zxqCA';
          const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);

          const data = {
            name: document.getElementById('lp-name').value.trim(),
            mobile: document.getElementById('lp-mobile').value.trim(),
            email: document.getElementById('lp-email').value.trim(),
            college: document.getElementById('lp-college').value.trim(),
            branch: document.getElementById('lp-branch').value.trim(),
            exam_date: document.getElementById('lp-date').value,
            shift: document.getElementById('lp-shift').value
          };

          const { error } = await sb.from('btech_leet_leads').insert([data]);
          if (error) throw error;

          localStorage.setItem('btech_leet_popup_filled', 'true');
          btn.textContent = 'Success!';
          btn.style.background = '#10b981';
          setTimeout(() => closePopup(), 1000);
        } catch (err) {
          console.error('Submission error:', err);
          alert('Something went wrong. Please try again.');
          btn.textContent = 'Submit & Get Updates';
          btn.style.opacity = '1';
          btn.style.pointerEvents = 'auto';
        }
      });
    };
  }, 2500); // 2.5 second delay after load
});

// --- BTech LEET Quick Links Injector ---
runWhenReady(() => {
  const path = window.location.pathname.toLowerCase();
  // Inject on ALL LEET-related pages: btech, bpharmacy, haryana-leet, premium, sample papers, section papers
  const showQuickLinks = path.includes('btech') || path.includes('b-pharmacy') || path.includes('bpharma') || path.includes('haryana-leet') || path.includes('haryanaleet') || path.includes('leet-') || path.includes('premium') || path.includes('section-') || path.includes('sample-paper');
  if (!showQuickLinks) return;

  const quickLinksHTML = `
    <div style="background: linear-gradient(90deg, #1e3a8a, #3b82f6); padding: 12px 20px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 15px; max-width: 1200px; margin: 0 auto;">
        <span style="color: #fff; font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 6px;">
          <i class="fas fa-bell" style="color: #fcd34d; animation: swing 2s infinite;"></i> 
          Haryana LEET 2026 Updates:
        </span>
        <a href="/haryana-leet-admit-card" style="background: #fff; color: #1e3a8a; padding: 6px 14px; border-radius: 50px; font-weight: 800; font-size: 13px; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; display: inline-flex; align-items: center; gap: 6px;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <i class="fas fa-id-badge"></i> Download Admit Card
        </a>
        <a href="/haryana-leet-rank-card" style="background: #f59e0b; color: #0f172a; padding: 6px 14px; border-radius: 50px; font-weight: 800; font-size: 13px; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; display: inline-flex; align-items: center; gap: 6px;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <i class="fas fa-trophy"></i> View Rank Card
        </a>
      </div>
    </div>
    <style>
      @keyframes swing {
        0% { transform: rotate(0deg); }
        20% { transform: rotate(15deg); }
        40% { transform: rotate(-10deg); }
        60% { transform: rotate(5deg); }
        80% { transform: rotate(-5deg); }
        100% { transform: rotate(0deg); }
      }
    </style>
  `;

  // Inject right after the header if possible, else prepend to main content
  setTimeout(() => {
    const mainContent = document.getElementById('main-content') || document.querySelector('main');
    if (mainContent) {
      mainContent.insertAdjacentHTML('beforebegin', quickLinksHTML);
    } else {
      document.body.insertAdjacentHTML('afterbegin', quickLinksHTML);
    }
  }, 500); // Slight delay to let partials load
});