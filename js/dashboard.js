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
        console.log("📊 Dashboard API response:", result);
        if (!result || !result.success) {
          console.error("❌ Dashboard API returned error:", result);
          showError("Failed to load analytics data");
          return;
        }
        if (!result.data) {
          console.error("❌ Dashboard API response missing data:", result);
          showError("Invalid data received from server");
          return;
        }
        const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Dashboard loaded in ${loadTime}s`);
        console.log("📈 Dashboard data:", result.data);
        updateDashboard(result.data);
      })
      .catch(err => {
        console.error("Analytics fetch error:", err);
        showError("Network error. Try again.");
      });
  }

  function updateDashboard(data) {
    if (!data) {
      console.error("❌ updateDashboard called with no data");
      return;
    }
    
    console.log("🔄 Updating dashboard with data:", data);
    
    const totalVisitorsEl = document.getElementById("totalVisitors");
    const todayVisitorsEl = document.getElementById("todayVisitors");
    const weekVisitorsEl = document.getElementById("weekVisitors");
    const monthVisitorsEl = document.getElementById("monthVisitors");
    
    if (totalVisitorsEl) {
      totalVisitorsEl.textContent = formatNumber(data.totalVisitors || 0);
      console.log("✅ Total visitors updated:", data.totalVisitors);
    } else {
      console.error("❌ totalVisitors element not found");
    }
    
    if (todayVisitorsEl) {
      todayVisitorsEl.textContent = formatNumber(data.todayVisitors || 0);
    } else {
      console.error("❌ todayVisitors element not found");
    }
    
    if (weekVisitorsEl) {
      weekVisitorsEl.textContent = formatNumber(data.weekVisitors || 0);
    } else {
      console.error("❌ weekVisitors element not found");
    }
    
    if (monthVisitorsEl) {
      monthVisitorsEl.textContent = formatNumber(data.monthVisitors || 0);
    } else {
      console.error("❌ monthVisitors element not found");
    }
    
    const totalTimeSpentEl = document.getElementById("totalTimeSpent");
    if (totalTimeSpentEl) {
      totalTimeSpentEl.textContent = formatTime(data.totalTimeSpent || 0);
    }
    
    const totalClicksEl = document.getElementById("totalClicks");
    if (totalClicksEl) {
      totalClicksEl.textContent = formatNumber(data.totalClicks || 0);
    }
    
    const avgTimePerPageEl = document.getElementById("avgTimePerPage");
    if (avgTimePerPageEl) {
      avgTimePerPageEl.textContent = formatNumber(data.avgTimePerPage || 0);
    }
    
    const overallCTREl = document.getElementById("overallCTR");
    if (overallCTREl) {
      overallCTREl.textContent = formatNumber(data.overallCTR || 0);
    }

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
