const fs = require('fs');
const path = require('path');

// Database file path - Using /tmp for Vercel compatibility
// Note: /tmp is ephemeral. For production, consider using a database (MongoDB, PostgreSQL, etc.)
const ANALYTICS_DB_PATH = process.env.VERCEL ? 
  path.join('/tmp', 'analytics.json') : 
  path.join(__dirname, '../../data/analytics.json');

// Ensure data directory exists
const dataDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize analytics database
function initAnalyticsDB() {
  if (!fs.existsSync(ANALYTICS_DB_PATH)) {
    const initialData = {
      pageViews: {},
      sessions: [],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(ANALYTICS_DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(ANALYTICS_DB_PATH, 'utf8'));
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { page, timeSpent, clicks, sessionId } = req.body;

    if (!page) {
      return res.status(400).json({ success: false, error: 'Page is required' });
    }

    const analytics = initAnalyticsDB();

    // Initialize page if it doesn't exist
    if (!analytics.pageViews[page]) {
      analytics.pageViews[page] = {
        views: 0,
        timeSpent: 0,
        clicks: 0
      };
    }

    // Update page statistics
    analytics.pageViews[page].views += 1;
    if (timeSpent) {
      analytics.pageViews[page].timeSpent += timeSpent; // in seconds
    }
    if (clicks) {
      analytics.pageViews[page].clicks += clicks;
    }

    // Handle session tracking
    if (sessionId) {
      let session = analytics.sessions.find(s => s.sessionId === sessionId);
      if (!session) {
        session = {
          sessionId,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          pages: []
        };
        analytics.sessions.push(session);
      } else {
        session.endTime = new Date().toISOString();
      }

      // Add page to session if not already there
      if (!session.pages.find(p => p.page === page)) {
        session.pages.push({
          page,
          timestamp: new Date().toISOString(),
          timeSpent: timeSpent || 0
        });
      }
    }

    // Keep only last 1000 sessions
    if (analytics.sessions.length > 1000) {
      analytics.sessions = analytics.sessions.slice(-1000);
    }

    analytics.lastUpdated = new Date().toISOString();

    // Save to file
    fs.writeFileSync(ANALYTICS_DB_PATH, JSON.stringify(analytics, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Analytics updated'
    });

  } catch (error) {
    console.error('Error updating analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
