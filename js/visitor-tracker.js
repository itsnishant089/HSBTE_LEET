// Visitor Tracker - Tracks page views and analytics
(function() {
  'use strict';

  // Generate unique session ID
  function getSessionId() {
    let sessionId = sessionStorage.getItem('visitorSessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('visitorSessionId', sessionId);
    }
    return sessionId;
  }

  // Track page view
  function trackPageView() {
    const page = window.location.pathname + window.location.search;
    const referrer = document.referrer || '';

    // Use absolute API path that works from any location
    const baseUrl = window.location.origin;
    const apiPath = `${baseUrl}/api/visitor-track`;

    // Send to visitor tracking API
    fetch(apiPath + '?page=' + encodeURIComponent(page) + '&referrer=' + encodeURIComponent(referrer), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, log for debugging
        console.warn('API returned non-JSON response. Status:', response.status);
        return response.text().then(text => {
          console.warn('Response text:', text.substring(0, 200));
          return null;
        });
      }
      if (!response.ok) {
        console.warn('API error:', response.status, response.statusText);
        return null;
      }
      return response.json();
    })
    .then(data => {
      if (data && data.success) {
        // Update counter display with new count
        console.log('Visitor counter updated:', data.totalVisitors, data.message || '');
        updateVisitorCounter(data.totalVisitors);
      } else if (data) {
        console.warn('API response:', data);
      }
    })
    .catch(error => {
      // Log error but don't break the page
      console.error('Error tracking visitor:', error);
      console.log('Visitor counter will show default value (4000)');
    });
  }

  // Update visitor counter display
  function updateVisitorCounter(count) {
    const counterElement = document.getElementById('visitor-counter');
    if (counterElement) {
      const countStr = count.toString().padStart(5, '0');
      counterElement.innerHTML = '';
      
      for (let i = 0; i < countStr.length; i++) {
        const digit = document.createElement('span');
        digit.className = 'counter-digit';
        digit.textContent = countStr[i];
        digit.setAttribute('aria-label', `Digit ${i + 1}: ${countStr[i]}`);
        counterElement.appendChild(digit);
      }
    }
  }

  // Initialize counter with default value (4000) while loading
  function initializeCounter() {
    const counterElement = document.getElementById('visitor-counter');
    if (counterElement && !counterElement.hasAttribute('data-initialized')) {
      updateVisitorCounter(4000);
      counterElement.setAttribute('data-initialized', 'true');
    }
  }

  // Track time spent on page
  let startTime = Date.now();
  let timeSpent = 0;
  let clickCount = 0;
  const sessionId = getSessionId();

  // Track clicks
  document.addEventListener('click', function() {
    clickCount++;
  }, true);

  // Track time spent before leaving
  window.addEventListener('beforeunload', function() {
    timeSpent = Math.floor((Date.now() - startTime) / 1000); // in seconds
    const page = window.location.pathname + window.location.search;

    // Send analytics update (use sendBeacon for reliability)
    const baseUrl = window.location.origin;
    const apiPath = `${baseUrl}/api/analytics/update`;
    const data = JSON.stringify({
      page: page,
      timeSpent: timeSpent,
      clicks: clickCount,
      sessionId: sessionId
    });

    navigator.sendBeacon(apiPath, data);
  });

  // Also send periodic updates (every 30 seconds)
  setInterval(function() {
    timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const page = window.location.pathname + window.location.search;

    if (timeSpent > 0) {
      const baseUrl = window.location.origin;
      const apiPath = `${baseUrl}/api/analytics/update`;
      fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page: page,
          timeSpent: timeSpent,
          clicks: clickCount,
          sessionId: sessionId
        })
      }).catch(error => {
        console.error('Error updating analytics:', error);
      });
    }
  }, 30000); // Every 30 seconds

  // Initialize counter display first
  initializeCounter();

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initializeCounter();
      trackPageView();
    });
  } else {
    initializeCounter();
    trackPageView();
  }

  // Also track when page becomes visible again
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      startTime = Date.now();
    }
  });

})();
