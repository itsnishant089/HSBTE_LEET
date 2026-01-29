const fs = require("fs");
const path = require("path");

// Paths (Vercel compatible)
const VISITOR_DB_PATH = process.env.VERCEL
  ? path.join("/tmp", "visitors.json")
  : path.join(__dirname, "../../data/visitors.json");

const ANALYTICS_DB_PATH = process.env.VERCEL
  ? path.join("/tmp", "analytics.json")
  : path.join(__dirname, "../../data/analytics.json");

const PASSWORD = "Nishant@089";
//ji
// Ensure data directory exists
const dataDir = process.env.VERCEL ? "/tmp" : path.join(__dirname, "../../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Init analytics DB
function initAnalyticsDB() {
  if (!fs.existsSync(ANALYTICS_DB_PATH)) {
    const initialData = {
      pageViews: {}, // { page: { views, timeSpent, clicks } }
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(ANALYTICS_DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(ANALYTICS_DB_PATH, "utf8"));
}

// Read visitors DB
function readVisitorsDB() {
  if (!fs.existsSync(VISITOR_DB_PATH)) {
    return { totalVisitors: 4000, visitors: [] };
  }
  return JSON.parse(fs.readFileSync(VISITOR_DB_PATH, "utf8"));
}

// Calculate statistics
function calculateStats(visitors, analytics) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const todayVisitors = visitors.filter(v => new Date(v.timestamp) >= today);
  const weekVisitors = visitors.filter(v => new Date(v.timestamp) >= weekAgo);
  const monthVisitors = visitors.filter(v => new Date(v.timestamp) >= monthAgo);

  const getUniqueVisitors = list => {
    const set = new Set();
    list.forEach(v => set.add(v.visitorId));
    return set.size;
  };

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

  if (analytics.pageViews) {
    Object.entries(analytics.pageViews).forEach(([page, info]) => {
      if (!pageStats[page]) {
        pageStats[page] = {
          views: 0,
          timeSpent: 0,
          clicks: 0,
          uniqueVisitors: new Set()
        };
      }
      pageStats[page].timeSpent += info.timeSpent || 0;
      pageStats[page].clicks += info.clicks || 0;
    });
  }

  const pageStatsArray = Object.keys(pageStats).map(page => ({
    page,
    views: pageStats[page].views,
    timeSpent: Math.round(pageStats[page].timeSpent / 60),
    clicks: pageStats[page].clicks,
    uniqueVisitors: pageStats[page].uniqueVisitors.size
  }));

  pageStatsArray.sort((a, b) => b.views - a.views);

  const totalTimeSpent = pageStatsArray.reduce((sum, p) => sum + p.timeSpent, 0);

  return {
    totalVisitors: visitors.totalVisitors || 4000,
    todayVisitors: getUniqueVisitors(todayVisitors),
    weekVisitors: getUniqueVisitors(weekVisitors),
    monthVisitors: getUniqueVisitors(monthVisitors),
    totalTimeSpent,
    mostViewedPages: pageStatsArray.slice(0, 10),
    mostTimeSpentPages: [...pageStatsArray].sort((a, b) => b.timeSpent - a.timeSpent).slice(0, 10),
    mostClickedPages: [...pageStatsArray].sort((a, b) => b.clicks - a.clicks).slice(0, 10),
    pageDetails: pageStatsArray
  };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const auth = req.headers.authorization;

    if (auth !== PASSWORD) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    const visitorDB = readVisitorsDB();
    const analyticsDB = initAnalyticsDB();
    const stats = calculateStats(visitorDB.visitors || [], analyticsDB);

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

