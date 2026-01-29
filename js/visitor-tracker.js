(function () {
  "use strict";

  function updateVisitorCounter(count) {
    const el = document.getElementById("visitor-counter");
    if (!el) return;

    const str = String(count).padStart(5, "0");
    el.innerHTML = "";

    for (let ch of str) {
      const span = document.createElement("span");
      span.className = "counter-digit";
      span.textContent = ch;
      el.appendChild(span);
    }
  }

  function loadCounter() {
    // Check if we're on dashboard page - don't load counter there
    if (window.location.pathname.includes("analytics-dashboard")) {
      return;
    }
    
    fetch("/api/visitor-track?nocache=" + Date.now() + "&page=" + encodeURIComponent(window.location.pathname))
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then(data => {
        if (data && data.success) {
          // Ensure we have a valid count (at least 4125 for display)
          const count = data.totalVisitors || 4125;
          updateVisitorCounter(count);
          console.log("Visitor counter updated:", count, "(Actual:", (data.actualVisitors || 4000) + ")");
        } else {
          // Fallback to 4125 if API returns error
          console.warn("Visitor counter API returned error, using fallback:", data);
          updateVisitorCounter(4125);
        }
      })
      .catch(err => {
        console.error("Visitor counter error:", err);
        // Fallback to 4125 on error
        updateVisitorCounter(4125);
      });
  }

  document.addEventListener("DOMContentLoaded", loadCounter);
})();
