// Analytics Dashboard JavaScript
(function() {
  'use strict';

  const PASSWORD = 'Nishant@089';
  let currentPassword = '';

  const loginScreen = document.getElementById('loginScreen');
  const dashboardContent = document.getElementById('dashboardContent');
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('passwordInput');
  const loginError = document.getElementById('loginError');
  const refreshBtn = document.getElementById('refreshBtn');

  // Check if already logged in
  const savedPassword = sessionStorage.getItem('dashboardPassword');
  if (savedPassword === PASSWORD) {
    currentPassword = savedPassword;
    showDashboard();
    loadAnalytics();
  }

  // Login form handler
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const password = passwordInput.value.trim();

    if (password === PASSWORD) {
      currentPassword = password;
      sessionStorage.setItem('dashboardPassword', password);
      loginError.textContent = '';
      passwordInput.value = '';
      showDashboard();
      loadAnalytics();
    } else {
      loginError.textContent = 'Incorrect password. Please try again.';
      passwordInput.value = '';
      passwordInput.focus();
    }
  });

  function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardContent.style.display = 'block';
  }

  // Format number with commas
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Format time
  function formatTime(minutes) {
    if (minutes < 60) {
      return formatNumber(Math.round(minutes)) + ' min';
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return formatNumber(hours) + 'h ' + formatNumber(mins) + 'm';
  }

  // Truncate page path for display
  function truncatePage(page) {
    if (page.length > 50) {
      return '...' + page.substring(page.length - 47);
    }
    return page || '/';
  }

  // Load analytics data
  function loadAnalytics() {
    if (!currentPassword) {
      return;
    }

    // Show loading state
    document.getElementById('totalVisitors').textContent = 'Loading...';
    document.getElementById('todayVisitors').textContent = 'Loading...';
    document.getElementById('weekVisitors').textContent = 'Loading...';
    document.getElementById('monthVisitors').textContent = 'Loading...';
    document.getElementById('totalTimeSpent').textContent = 'Loading...';

    // Use absolute API path that works from any location
    const baseUrl = window.location.origin;
    const apiPath = `${baseUrl}/api/analytics`;
    
    fetch(`${apiPath}?password=${encodeURIComponent(currentPassword)}`)
      .then(response => {
        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format');
        }
        
        if (response.status === 401) {
          sessionStorage.removeItem('dashboardPassword');
          currentPassword = '';
          loginScreen.style.display = 'flex';
          dashboardContent.style.display = 'none';
          loginError.textContent = 'Session expired. Please login again.';
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
      })
      .then(data => {
        if (!data) return;

        if (data.success && data.data) {
          updateDashboard(data.data);
        } else {
          console.error('Error loading analytics:', data.error);
          showError('Failed to load analytics data');
        }
      })
      .catch(async error => {
        console.error('Error fetching analytics:', error);
        
        // Try to get response text for better error info
        let errorMsg = 'Network error. Please try again.';
        
        // Check if we're in local development
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
        
        if (isLocalhost && error.message === 'Invalid response format') {
          errorMsg = 'API server not running. Please run: npm install && npm run dev';
          showError(errorMsg);
          console.log('\n⚠️  Local Development Notice:');
          console.log('The API endpoints require a local server.');
          console.log('To run locally:');
          console.log('  1. Install dependencies: npm install');
          console.log('  2. Start server: npm run dev');
          console.log('  3. Access dashboard at: http://localhost:3000/html/analytics-dashboard.html\n');
          return;
        }
        
        if (error.message) {
          errorMsg = error.message;
        }
        showError(errorMsg);
        // Log the actual response for debugging
        console.log('API Path used:', apiPath);
        console.log('Full error details:', error);
      });
  }

  function updateDashboard(data) {
    // Update stat cards
    document.getElementById('totalVisitors').textContent = formatNumber(data.totalVisitors);
    document.getElementById('todayVisitors').textContent = formatNumber(data.todayVisitors);
    document.getElementById('weekVisitors').textContent = formatNumber(data.weekVisitors);
    document.getElementById('monthVisitors').textContent = formatNumber(data.monthVisitors);
    document.getElementById('totalTimeSpent').textContent = formatTime(data.totalTimeSpent);

    // Update most viewed table
    const mostViewedTable = document.getElementById('mostViewedTable');
    if (data.mostViewedPages && data.mostViewedPages.length > 0) {
      mostViewedTable.innerHTML = data.mostViewedPages.map(page => `
        <tr>
          <td title="${page.page}">${truncatePage(page.page)}</td>
          <td>${formatNumber(page.views)}</td>
          <td>${formatNumber(page.uniqueVisitors)}</td>
        </tr>
      `).join('');
    } else {
      mostViewedTable.innerHTML = '<tr><td colspan="3">No data available</td></tr>';
    }

    // Update most time spent table
    const mostTimeSpentTable = document.getElementById('mostTimeSpentTable');
    if (data.mostTimeSpentPages && data.mostTimeSpentPages.length > 0) {
      mostTimeSpentTable.innerHTML = data.mostTimeSpentPages.map(page => `
        <tr>
          <td title="${page.page}">${truncatePage(page.page)}</td>
          <td>${formatTime(page.timeSpent)}</td>
          <td>${formatNumber(page.views)}</td>
        </tr>
      `).join('');
    } else {
      mostTimeSpentTable.innerHTML = '<tr><td colspan="3">No data available</td></tr>';
    }

    // Update most clicked table
    const mostClickedTable = document.getElementById('mostClickedTable');
    if (data.mostClickedPages && data.mostClickedPages.length > 0) {
      mostClickedTable.innerHTML = data.mostClickedPages.map(page => `
        <tr>
          <td title="${page.page}">${truncatePage(page.page)}</td>
          <td>${formatNumber(page.clicks)}</td>
          <td>${formatNumber(page.views)}</td>
        </tr>
      `).join('');
    } else {
      mostClickedTable.innerHTML = '<tr><td colspan="3">No data available</td></tr>';
    }

    // Update detailed table
    const detailedTable = document.getElementById('detailedTable');
    if (data.pageDetails && data.pageDetails.length > 0) {
      detailedTable.innerHTML = data.pageDetails.map(page => `
        <tr>
          <td title="${page.page}">${truncatePage(page.page)}</td>
          <td>${formatNumber(page.views)}</td>
          <td>${formatNumber(page.uniqueVisitors)}</td>
          <td>${formatTime(page.timeSpent)}</td>
          <td>${formatNumber(page.clicks)}</td>
        </tr>
      `).join('');
    } else {
      detailedTable.innerHTML = '<tr><td colspan="5">No data available</td></tr>';
    }
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  // Refresh button
  refreshBtn.addEventListener('click', function() {
    refreshBtn.querySelector('i').classList.add('fa-spin');
    loadAnalytics();
    setTimeout(() => {
      refreshBtn.querySelector('i').classList.remove('fa-spin');
    }, 1000);
  });

  // Auto-refresh every 30 seconds
  setInterval(() => {
    if (currentPassword && dashboardContent.style.display !== 'none') {
      loadAnalytics();
    }
  }, 30000);

})();
