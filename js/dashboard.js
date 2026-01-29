// Analytics Dashboard JavaScript
(function () {
  "use strict";

  const PASSWORD = "Nishant@089";
  let currentPassword = "";

  const loginScreen = document.getElementById("loginScreen");
  const dashboardContent = document.getElementById("dashboardContent");
  const loginForm = document.getElementById("loginForm");
  const passwordInput = document.getElementById("passwordInput");
  const loginError = document.getElementById("loginError");
  const refreshBtn = document.getElementById("refreshBtn");

  // Restore session
  const savedPassword = sessionStorage.getItem("dashboardPassword");
  if (savedPassword === PASSWORD) {
    currentPassword = savedPassword;
    showDashboard();
    loadAnalytics();
  }

  // Login form
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const password = passwordInput.value.trim();

    if (password === PASSWORD) {
      currentPassword = password;
      sessionStorage.setItem("dashboardPassword", password);
      loginError.textContent = "";
      passwordInput.value = "";
      showDashboard();
      loadAnalytics();
    } else {
      loginError.textContent = "Incorrect password. Please try again.";
      passwordInput.value = "";
      passwordInput.focus();
    }
  });

  function showDashboard() {
    loginScreen.style.display = "none";
    dashboardContent.style.display = "block";
  }

  // Format number
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Format time
  function formatTime(minutes) {
    if (minutes < 60) return formatNumber(minutes) + " min";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return formatNumber(hours) + "h " + formatNumber(mins) + "m";
  }

  // Truncate long page paths
  function truncatePage(page) {
    if (page.length > 50) return "..." + page.substring(page.length - 47);
    return page || "/";
  }

  // Load analytics
  function loadAnalytics() {
    if (!currentPassword) return;

    document.getElementById("totalVisitors").textContent = "Loading...";
    document.getElementById("todayVisitors").textContent = "Loading...";
    document.getElementById("weekVisitors").textContent = "Loading...";
    document.getElementById("monthVisitors").textContent = "Loading...";
    document.getElementById("totalTimeSpent").textContent = "Loading...";

    fetch("/api/analytics", {
      headers: {
        Authorization: currentPassword
      }
    })
      .then(res => {
        if (res.status === 401) {
          sessionStorage.removeItem("dashboardPassword");
          currentPassword = "";
          loginScreen.style.display = "flex";
          dashboardContent.style.display = "none";
          loginError.textContent = "Session expired. Please login again.";
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        if (data.success && data.data) {
          updateDashboard(data.data);
        } else {
          showError("Failed to load analytics data");
        }
      })
      .catch(err => {
        console.error("Analytics fetch error:", err);
        showError("Network error. Try again.");
      });
  }

  function updateDashboard(data) {
    document.getElementById("totalVisitors").textContent = formatNumber(data.totalVisitors);
    document.getElementById("todayVisitors").textContent = formatNumber(data.todayVisitors);
    document.getElementById("weekVisitors").textContent = formatNumber(data.weekVisitors);
    document.getElementById("monthVisitors").textContent = formatNumber(data.monthVisitors);
    document.getElementById("totalTimeSpent").textContent = formatTime(data.totalTimeSpent);

    const mostViewedTable = document.getElementById("mostViewedTable");
    mostViewedTable.innerHTML = data.mostViewedPages.length
      ? data.mostViewedPages.map(p => `
        <tr>
          <td title="${p.page}">${truncatePage(p.page)}</td>
          <td>${formatNumber(p.views)}</td>
          <td>${formatNumber(p.uniqueVisitors)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="3">No data available</td></tr>`;

    const mostTimeSpentTable = document.getElementById("mostTimeSpentTable");
    mostTimeSpentTable.innerHTML = data.mostTimeSpentPages.length
      ? data.mostTimeSpentPages.map(p => `
        <tr>
          <td title="${p.page}">${truncatePage(p.page)}</td>
          <td>${formatTime(p.timeSpent)}</td>
          <td>${formatNumber(p.views)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="3">No data available</td></tr>`;

    const mostClickedTable = document.getElementById("mostClickedTable");
    mostClickedTable.innerHTML = data.mostClickedPages.length
      ? data.mostClickedPages.map(p => `
        <tr>
          <td title="${p.page}">${truncatePage(p.page)}</td>
          <td>${formatNumber(p.clicks)}</td>
          <td>${formatNumber(p.views)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="3">No data available</td></tr>`;

    const detailedTable = document.getElementById("detailedTable");
    detailedTable.innerHTML = data.pageDetails.length
      ? data.pageDetails.map(p => `
        <tr>
          <td title="${p.page}">${truncatePage(p.page)}</td>
          <td>${formatNumber(p.views)}</td>
          <td>${formatNumber(p.uniqueVisitors)}</td>
          <td>${formatTime(p.timeSpent)}</td>
          <td>${formatNumber(p.clicks)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="5">No data available</td></tr>`;
  }

  function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-toast";
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }

  refreshBtn.addEventListener("click", function () {
    refreshBtn.querySelector("i").classList.add("fa-spin");
    loadAnalytics();
    setTimeout(() => {
      refreshBtn.querySelector("i").classList.remove("fa-spin");
    }, 1000);
  });

  setInterval(() => {
    if (currentPassword && dashboardContent.style.display !== "none") {
      loadAnalytics();
    }
  }, 30000);

})();
