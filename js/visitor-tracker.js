(function () {
  "use strict";

  let retryCount = 0;
  const MAX_RETRIES = 50; // Maximum 5 seconds of retries (50 * 100ms)

  function updateVisitorCounter(count) {
    const el = document.getElementById("visitor-counter");
    if (!el) {
      console.warn("Visitor counter element not found");
      return false;
    }

    // Ensure count is a valid number
    const numCount = Number(count);
    if (isNaN(numCount) || numCount < 0) {
      console.warn("Invalid count value:", count);
      return false;
    }

    const str = String(Math.floor(numCount)).padStart(5, "0");
    
    // Clear existing content
    el.innerHTML = "";

    // Add each digit as a span
    for (let ch of str) {
      const span = document.createElement("span");
      span.className = "counter-digit";
      span.textContent = ch;
      el.appendChild(span);
    }
    
    console.log("✅ Visitor counter updated successfully to:", str, "(" + numCount + " visitors)");
    return true;
  }

  function loadCounter() {
    // Check if we're on dashboard page - don't load counter there
    if (window.location.pathname.includes("analytics-dashboard")) {
      return;
    }
    
    // Check if counter element exists, if not wait a bit and retry
    const counterEl = document.getElementById("visitor-counter");
    if (!counterEl) {
      retryCount++;
      if (retryCount < MAX_RETRIES) {
        // Retry after a short delay (footer might be loading via include.js)
        setTimeout(loadCounter, 100);
      } else {
        console.error("❌ Visitor counter element not found after", MAX_RETRIES, "retries");
      }
      return;
    }
    
    // Reset retry count once element is found
    retryCount = 0;
    
    console.log("🔄 Loading visitor counter...");
    fetch("/api/visitor-track?nocache=" + Date.now() + "&page=" + encodeURIComponent(window.location.pathname))
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then(data => {
        console.log("📊 Visitor counter API response:", data);
        if (data && data.success && data.totalVisitors !== undefined) {
          // Use the totalVisitors from API response (already includes offset for display)
          const count = Number(data.totalVisitors);
          if (updateVisitorCounter(count)) {
            console.log("✅ Visitor counter updated:", count, "(Actual:", (data.actualVisitors || 4000) + ")");
          } else {
            console.error("❌ Failed to update visitor counter display");
          }
        } else {
          // Fallback to 4125 if API returns error
          console.warn("⚠️ Visitor counter API returned error, using fallback:", data);
          updateVisitorCounter(4125);
        }
      })
      .catch(err => {
        console.error("❌ Visitor counter error:", err);
        // Fallback to 4125 on error
        updateVisitorCounter(4125);
      });
  }

  // Try to load counter on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", function() {
    console.log("📄 DOMContentLoaded - waiting for includes...");
    // Wait a bit for includes to load
    setTimeout(loadCounter, 200);
  });
  
  // Also listen for partialsLoaded event (from include.js)
  document.addEventListener("partialsLoaded", function() {
    console.log("✅ Partials loaded - loading visitor counter...");
    setTimeout(loadCounter, 100);
  });
  
  // Fallback: try immediately if DOM is already loaded
  if (document.readyState === "complete" || document.readyState === "interactive") {
    console.log("📄 DOM already loaded - loading visitor counter...");
    setTimeout(loadCounter, 300);
  }
})();
