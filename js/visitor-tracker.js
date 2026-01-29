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
    fetch("/api/visitor-track?nocache=" + Date.now())
      .then(r => r.json())
      .then(data => {
        console.log("Visitor API:", data);
        if (data.success) {
          updateVisitorCounter(data.totalVisitors);
        }
      })
      .catch(err => console.error("Visitor counter error:", err));
  }

  document.addEventListener("DOMContentLoaded", loadCounter);
})();
