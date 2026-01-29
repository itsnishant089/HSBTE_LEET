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
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // Use totalVisitors which already has the offset (4125+) for display
          updateVisitorCounter(data.totalVisitors);
          console.log("Visitor counter updated:", data.totalVisitors, "(Actual:", data.actualVisitors + ")");
        }
      })
      .catch(err => console.error("Visitor counter error:", err));
  }

  document.addEventListener("DOMContentLoaded", loadCounter);
})();
