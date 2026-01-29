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

  function formatNumber(num) {
    return Number(num || 0).toLocaleString();
  }

  function formatTime(minutes) {
    minutes = Number(minutes || 0);
    if (minutes < 60) return formatNumber(minutes) + " min";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return formatNumber(hours) + "h " + formatNumber(mins) + "m";
  }

  function truncatePage(page) {
    if (!page) return "/";
    if (page.length > 50) return "..." + page.substring(page.length - 47);
    return page;
  }

  function loadAnalytics() {
    if (!currentPassword) return;

    document.getElementById("totalVisitors").textContent = "Loading...";
    document.getElementById("todayVisitors").textContent = "Loading...";
    document.getElementById("weekVisitors").textContent = "Loading...";
    document.getElementById("monthVisitors").textContent = "Loading...";
    document.getElementById("totalTimeSpent").textContent = "Loading...";

    fetch("/api/analytics?nocache=" + Date.now(), {
      headers: {
        "Authorization": currentPassword,
        "Cache-Control": "no-cache"
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
      .then(result => {
        if (!result || !result.success) {
          showError("Failed to load analytics data");
          return;
        }
        updateDashboard(result.data);
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

    renderTable("mostViewedTable", data.mostViewedPages, p => `
      <tr>
        <td title="${p.page}">${truncatePage(p.page)}</td>
        <td>${formatNumber(p.views)}</td>
        <td>${formatNumber(p.uniqueVisitors)}</td>
      </tr>
    `, 3);

    renderTable("mostTimeSpentTable", data.mostTimeSpentPages, p => `
      <tr>
        <td title="${p.page}">${truncatePage(p.page)}</td>
        <td>${formatTime(p.timeSpent)}</td>
        <td>${formatNumber(p.views)}</td>
      </tr>
    `, 3);

    renderTable("mostClickedTable", data.mostClickedPages, p => `
      <tr>
        <td title="${p.page}">${truncatePage(p.page)}</td>
        <td>${formatNumber(p.clicks)}</td>
        <td>${formatNumber(p.views)}</td>
      </tr>
    `, 3);

    renderTable("detailedTable", data.pageDetails, p => `
      <tr>
        <td title="${p.page}">${truncatePage(p.page)}</td>
        <td>${formatNumber(p.views)}</td>
        <td>${formatNumber(p.uniqueVisitors)}</td>
        <td>${formatTime(p.timeSpent)}</td>
        <td>${formatNumber(p.clicks)}</td>
      </tr>
    `, 5);
  }

  function renderTable(id, list, rowFn, colspan) {
    const el = document.getElementById(id);
    if (list && list.length) {
      el.innerHTML = list.map(rowFn).join("");
    } else {
      el.innerHTML = `<tr><td colspan="${colspan}">No data available</td></tr>`;
    }
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
