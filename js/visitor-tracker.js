(function () {
  "use strict";

  let attempts = 0;
  const MAX_ATTEMPTS = 100; // Try for up to 10 seconds

  function updateVisitorCounter(count) {
    const el = document.getElementById("visitor-counter");
    if (!el) {
      console.warn("Visitor counter element not found");
      return false;
    }

    const numCount = Number(count);
    if (isNaN(numCount) || numCount < 0) {
      console.warn("Invalid count:", count);
      return false;
    }

    const str = String(Math.floor(numCount)).padStart(5, "0");
    el.innerHTML = "";

    for (let ch of str) {
      const span = document.createElement("span");
      span.className = "counter-digit";
      span.textContent = ch;
      el.appendChild(span);
    }
    
    console.log("Visitor counter updated to:", str);
    return true;
  }

  function loadCounter() {
    // Check if we're on dashboard page - don't load counter there
    if (window.location.pathname.includes("analytics-dashboard")) {
      return;
    }
    
    attempts++;
    
    // Make sure element exists
    const el = document.getElementById("visitor-counter");
    if (!el) {
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(loadCounter, 100);
        return;
      } else {
        console.error("Visitor counter element not found after", MAX_ATTEMPTS, "attempts");
        return;
      }
    }
    
    // Element found, reset attempts
    attempts = 0;
    
    console.log("Loading visitor counter from API...");
    fetch("/api/visitor-track?nocache=" + Date.now() + "&page=" + encodeURIComponent(window.location.pathname))
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then(data => {
        console.log("API response:", data);
        if (data && data.success && data.totalVisitors !== undefined) {
          const count = Number(data.totalVisitors);
          if (updateVisitorCounter(count)) {
            console.log("Successfully updated counter to:", count);
          }
        } else {
          console.warn("API returned invalid data, using fallback");
          updateVisitorCounter(4125);
        }
      })
      .catch(err => {
        console.error("Visitor counter error:", err);
        updateVisitorCounter(4125);
      });
  }

  // Multiple strategies to ensure it runs
  function initCounter() {
    // Strategy 1: Wait for partialsLoaded event
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function() {
        document.addEventListener("partialsLoaded", function() {
          setTimeout(loadCounter, 200);
        });
        // Fallback if partialsLoaded doesn't fire
        setTimeout(loadCounter, 1000);
      });
    } else {
      // DOM already loaded
      document.addEventListener("partialsLoaded", function() {
        setTimeout(loadCounter, 200);
      });
      // Fallback
      setTimeout(loadCounter, 500);
    }
  }

  // Start initialization
  initCounter();
  
  // Also try immediately if script is loaded after everything
  if (document.readyState === "complete") {
    setTimeout(loadCounter, 300);
  }
})();
