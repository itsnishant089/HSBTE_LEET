// Visitor Tracker - Tracks page views and analytics
(function () {
  "use strict";

  // Generate unique session ID
  function getSessionId() {
    let sessionId = sessionStorage.getItem("visitorSessionId");
    if (!sessionId) {
      sessionId =
        "session_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("visitorSessionId", sessionId);
    }
    return sessionId;
  }

  // Update visitor counter display
  function updateVisitorCounter(count) {
    const counterElement = document.getElementById("visitor-counter");
    if (!counterElement) return;

    const countStr = count.toString().padStart(5, "0");
    counterElement.innerHTML = "";

    for (let i = 0; i < countStr.length; i++) {
      const digit = document.createElement("span");
      digit.className = "counter-digit";
      digit.textContent = countStr[i];
      counterElement.appendChild(digit);
    }
  }

  // Track page view (VISITOR COUNT)
  function trackPageView() {
    const page = window.location.pathname + window.location.search;
    const referrer = document.referrer || "";

    const url =
      "/api/visitor-track?nocache=" +
      Date.now() +
      "&page=" +
      encodeURIComponent(page) +
      "&referrer=" +
      encodeURIComponent(referrer);

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          console.log("Visitor count:", data.totalVisitors);
          updateVisitorCounter(data.totalVisitors);
        }
      })
      .catch(err => {
        console.error("Visitor tracking failed:", err);
      });
  }

  // Track time & clicks
  let startTime = Date.now();
  let clickCount = 0;
  const sessionId = getSessionId();

  document.addEventListener("click", function () {
    clickCount++;
  });

  // Send data before leaving
  window.addEventListener("beforeunload", function () {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const page = window.location.pathname + window.location.search;

    const payload = JSON.stringify({
      page: page,
      timeSpent: timeSpent,
      clicks: clickCount,
      sessionId: sessionId
    });

    navigator.sendBeacon("/api/analytics/update", payload);
  });

  // Periodic update every 30 seconds
  setInterval(function () {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const page = window.location.pathname + window.location.search;

    if (timeSpent > 0) {
      fetch("/api/analytics/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: page,
          timeSpent: timeSpent,
          clicks: clickCount,
          sessionId: sessionId
        })
      }).catch(err => {
        console.error("Analytics update failed:", err);
      });
    }
  }, 30000);

  // Init when page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", trackPageView);
  } else {
    trackPageView();
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      startTime = Date.now();
    }
  });
})();
