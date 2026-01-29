// Visitor Tracker - FINAL (FIXED)
(function () {
  "use strict";

  function updateVisitorCounter(count) {
    const el = document.getElementById("visitor-counter");
    if (!el) {
      console.warn("❌ visitor-counter element not found");
      return;
    }

    const str = String(count).padStart(5, "0");
    el.innerHTML = "";

    for (let i = 0; i < str.length; i++) {
      const span = document.createElement("span");
      span.className = "counter-digit";
      span.textContent = str[i];
      el.appendChild(span);
    }
  }

  function trackPageView() {
    const page = window.location.pathname + window.location.search;
    const referrer = document.referrer || "";

    const url =
      "/api/visitor-track?page=" +
      encodeURIComponent(page) +
      "&referrer=" +
      encodeURIComponent(referrer) +
      "&t=" +
      Date.now(); // cache buster

    console.log("📡 Calling:", url);

    fetch(url, { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        console.log("✅ Visitor API:", data);
        if (data && data.success) {
          updateVisitorCounter(data.totalVisitors);
        }
      })
      .catch(err => console.error("❌ Visitor error:", err));
  }

  document.addEventListener("DOMContentLoaded", trackPageView);
})();
