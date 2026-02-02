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

    // Use cache-busting and request with dashboard flag for faster loading
    const startTime = performance.now();
    fetch("/api/analytics?nocache=" + Date.now() + "&dashboard=true", {
      headers: {
        "Authorization": currentPassword,
        "Cache-Control": "no-cache",
        "X-Requested-With": "Dashboard"
      }
    })
      .then(res => {
        // Handle KV misconfiguration explicitly
        if (res.status === 503) {
          return res.json().then(payload => {
            const msg =
              (payload && payload.error) ||
              "Storage not configured. Please setup Vercel KV and redeploy.";
            showError(msg);
            throw new Error(msg);
          });
        }
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
        const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`Dashboard loaded in ${loadTime}s`);
        updateDashboard(result.data);
      })
      .catch(err => {
        console.error("Analytics fetch error:", err);
        // Don't double-toast if we already showed a specific error
        if (String(err && err.message || "").includes("Storage not configured")) return;
        showError("Network error. Try again.");
      });
  }

  function updateDashboard(data) {
    document.getElementById("totalVisitors").textContent = formatNumber(data.totalVisitors);
    document.getElementById("todayVisitors").textContent = formatNumber(data.todayVisitors);
    document.getElementById("weekVisitors").textContent = formatNumber(data.weekVisitors);
    document.getElementById("monthVisitors").textContent = formatNumber(data.monthVisitors);
    document.getElementById("totalTimeSpent").textContent = formatTime(data.totalTimeSpent);
    document.getElementById("totalClicks").textContent = formatNumber(data.totalClicks || 0);
    document.getElementById("avgTimePerPage").textContent = formatNumber(data.avgTimePerPage || 0);
    document.getElementById("overallCTR").textContent = formatNumber(data.overallCTR || 0);

    renderTable("mostViewedTable", data.mostViewedPages, (p, index) => `
      <tr>
        <td class="rank-cell">${index + 1}</td>
        <td title="${p.page}">${truncatePage(p.page)}</td>
        <td>${formatNumber(p.views)}</td>
        <td>${formatNumber(p.uniqueVisitors)}</td>
      </tr>
    `, 4);

    renderTable("mostTimeSpentTable", data.mostTimeSpentPages, (p, index) => `
      <tr>
        <td class="rank-cell">${index + 1}</td>
        <td title="${p.page}">${truncatePage(p.page)}</td>
        <td>${formatTime(p.timeSpent)}</td>
        <td>${formatNumber(p.views)}</td>
      </tr>
    `, 4);

    renderTable("mostClickedTable", data.mostClickedPages, (p, index) => `
      <tr>
        <td class="rank-cell">${index + 1}</td>
        <td title="${p.page}">${truncatePage(p.page)}</td>
        <td>${formatNumber(p.clicks)}</td>
        <td>${formatNumber(p.views)}</td>
      </tr>
    `, 4);

    renderTable("highestCTRTable", data.highestCTRPages || [], (p, index) => `
      <tr>
        <td class="rank-cell">${index + 1}</td>
        <td title="${p.page}">${truncatePage(p.page)}</td>
        <td>${formatNumber(p.clickThroughRate || 0)}%</td>
        <td>${formatNumber(p.clicks)}</td>
        <td>${formatNumber(p.views)}</td>
      </tr>
    `, 5);

    renderTable("detailedTable", data.pageDetails, p => `
      <tr>
        <td title="${p.page}">${truncatePage(p.page)}</td>
        <td>${formatNumber(p.views)}</td>
        <td>${formatNumber(p.uniqueVisitors)}</td>
        <td>${formatTime(p.timeSpent)}</td>
        <td>${formatNumber(p.clicks)}</td>
        <td>${formatNumber(p.avgTimePerView || 0)} min</td>
        <td>${formatNumber(p.clickThroughRate || 0)}%</td>
        <td>${formatNumber(p.avgTimePerVisitor || 0)} min</td>
      </tr>
    `, 8);
  }

  function renderTable(id, list, rowFn, colspan) {
    const el = document.getElementById(id);
    if (list && list.length) {
      el.innerHTML = list.map((item, index) => rowFn(item, index)).join("");
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
