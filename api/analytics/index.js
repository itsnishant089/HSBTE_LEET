const fs = require('fs');
const path = require('path');

// Database file paths - Using /tmp for Vercel compatibility
// Note: /tmp is ephemeral. For production, consider using a database (MongoDB, PostgreSQL, etc.)
const DB_PATH = process.env.VERCEL ? 
  path.join('/tmp', 'visitors.json') : 
  path.join(__dirname, '../../data/visitors.json');
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
      pageViews: {}, // { page: { views: number, timeSpent: number, clicks: number } }
      sessions: [], // { sessionId, startTime, endTime, pages: [] }
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(ANALYTICS_DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(ANALYTICS_DB_PATH, 'utf8'));
}

// Get analytics data
function getAnalytics() {
  if (!fs.existsSync(DB_PATH)) {
    return {
      totalVisitors: 1000,
      visitors: [],
      lastUpdated: new Date().toISOString()
    };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

// Calculate statistics
function calculateStats(visitors, analytics) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter visitors by date
  const todayVisitors = visitors.filter(v => new Date(v.timestamp) >= today);
  const weekVisitors = visitors.filter(v => new Date(v.timestamp) >= weekAgo);
  const monthVisitors = visitors.filter(v => new Date(v.timestamp) >= monthAgo);

  // Get unique visitors
  const getUniqueVisitors = (visits) => {
    const unique = new Set();
    visits.forEach(v => {
      const visitDate = new Date(v.timestamp).toDateString();
      unique.add(`${v.visitorId}-${visitDate}`);
    });
    return unique.size;
  };

  // Calculate page statistics
  const pageStats = {};
  visitors.forEach(v => {
    if (!pageStats[v.page]) {
      pageStats[v.page] = {
        views: 0,
        timeSpent: 0,
        clicks: 0,
        uniqueVisitors: new Set()
      };
    }
    pageStats[v.page].views += 1;
    pageStats[v.page].uniqueVisitors.add(v.visitorId);
  });

  // Add analytics data
  if (analytics && analytics.pageViews) {
    Object.keys(analytics.pageViews).forEach(page => {
      if (!pageStats[page]) {
        pageStats[page] = {
          views: 0,
          timeSpent: 0,
          clicks: 0,
          uniqueVisitors: new Set()
        };
      }
      pageStats[page].views += analytics.pageViews[page].views || 0;
      pageStats[page].timeSpent += analytics.pageViews[page].timeSpent || 0;
      pageStats[page].clicks += analytics.pageViews[page].clicks || 0;
    });
  }

  // Convert to array and format
  const pageStatsArray = Object.keys(pageStats).map(page => ({
    page,
    views: pageStats[page].views,
    timeSpent: Math.round(pageStats[page].timeSpent / 60), // Convert to minutes
    clicks: pageStats[page].clicks,
    uniqueVisitors: pageStats[page].uniqueVisitors.size
  }));

  // Sort by views
  pageStatsArray.sort((a, b) => b.views - a.views);

  // Calculate total time spent
  const totalTimeSpent = pageStatsArray.reduce((sum, p) => sum + p.timeSpent, 0);

  // Get total visitors from database
  let totalVisitors = 4000;
  if (fs.existsSync(DB_PATH)) {
    try {
      const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      totalVisitors = dbData.totalVisitors || 4000;
    } catch (e) {
      console.error('Error reading visitors DB:', e);
    }
  }

  return {
    totalVisitors: totalVisitors,
    todayVisitors: getUniqueVisitors(todayVisitors),
    weekVisitors: getUniqueVisitors(weekVisitors),
    monthVisitors: getUniqueVisitors(monthVisitors),
    totalTimeSpent: totalTimeSpent,
    mostViewedPages: pageStatsArray.slice(0, 10),
    mostTimeSpentPages: [...pageStatsArray].sort((a, b) => b.timeSpent - a.timeSpent).slice(0, 10),
    mostClickedPages: [...pageStatsArray].sort((a, b) => b.clicks - a.clicks).slice(0, 10),
    pageDetails: pageStatsArray
  };
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check password
    const password = req.query.password || req.body?.password;
    const correctPassword = 'Nishant@089';

    if (password !== correctPassword) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const visitors = getAnalytics();
    const analytics = initAnalyticsDB();
    const stats = calculateStats(visitors.visitors || [], analytics);

    return res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
