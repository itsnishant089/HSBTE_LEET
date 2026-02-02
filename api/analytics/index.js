// Use Vercel KV for persistent storage
const { getVisitorsDB, getAnalyticsDB, getStorageStatus, INITIAL_COUNT } = require('../../lib/kv-storage');

const PASSWORD = "Nishant@089";

// Calculate statistics
function calculateStats(visitorDB, analytics) {
  const visitors = visitorDB.visitors || [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter visitors (only count those after initial 4000)
  // For dashboard: we want to show visitors starting from 0
  // So we need to filter visitors that were added after the initial count
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

  const pageStatsArray = Object.keys(pageStats).map(page => {
    const stats = pageStats[page];
    const views = stats.views;
    const timeSpent = Math.round(stats.timeSpent / 60);
    const clicks = stats.clicks;
    const uniqueVisitors = stats.uniqueVisitors.size;
    
    // Calculate additional metrics
    const avgTimePerView = views > 0 ? Math.round((timeSpent / views) * 10) / 10 : 0;
    const clickThroughRate = views > 0 ? Math.round((clicks / views) * 100 * 10) / 10 : 0;
    const avgTimePerVisitor = uniqueVisitors > 0 ? Math.round((timeSpent / uniqueVisitors) * 10) / 10 : 0;
    
    return {
      page,
      views,
      timeSpent,
      clicks,
      uniqueVisitors,
      avgTimePerView,
      clickThroughRate,
      avgTimePerVisitor
    };
  });

  pageStatsArray.sort((a, b) => b.views - a.views);

  const totalTimeSpent = pageStatsArray.reduce((sum, p) => sum + p.timeSpent, 0);
  const totalClicks = pageStatsArray.reduce((sum, p) => sum + p.clicks, 0);
  const totalPageViews = pageStatsArray.reduce((sum, p) => sum + p.views, 0);
  const avgTimePerPage = pageStatsArray.length > 0 ? Math.round((totalTimeSpent / pageStatsArray.length) * 10) / 10 : 0;
  const overallCTR = totalPageViews > 0 ? Math.round((totalClicks / totalPageViews) * 100 * 10) / 10 : 0;

  // Visitor totals
  const actualTotalVisitors = visitorDB.totalVisitors || INITIAL_COUNT;
  const visitorsSinceBaseline = Math.max(0, actualTotalVisitors - INITIAL_COUNT);
  
  return {
    // Show REAL total visitors on dashboard (so it never looks like 0000)
    totalVisitors: actualTotalVisitors,
    visitorsSinceBaseline,
    todayVisitors: getUniqueVisitors(todayVisitors),
    weekVisitors: getUniqueVisitors(weekVisitors),
    monthVisitors: getUniqueVisitors(monthVisitors),
    totalTimeSpent,
    totalClicks,
    totalPageViews,
    avgTimePerPage,
    overallCTR,
    mostViewedPages: pageStatsArray.slice(0, 15),
    mostTimeSpentPages: [...pageStatsArray].sort((a, b) => b.timeSpent - a.timeSpent).slice(0, 15),
    mostClickedPages: [...pageStatsArray].sort((a, b) => b.clicks - a.clicks).slice(0, 15),
    highestCTRPages: [...pageStatsArray].filter(p => p.views >= 5).sort((a, b) => b.clickThroughRate - a.clickThroughRate).slice(0, 15),
    pageDetails: pageStatsArray
  };
}

module.exports = async (req, res) => {
  // Optimize for dashboard - no cache, fast response
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

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

    // Fast parallel reads for better performance
    const visitorDB = await getVisitorsDB();
    const analyticsDB = await getAnalyticsDB();
    const stats = calculateStats(visitorDB, analyticsDB);

    return res.status(200).json({
      success: true,
      data: stats,
      storage: getStorageStatus(),
      loadTime: new Date().toISOString()
    });
  } catch (error) {
    console.error("Analytics error:", error);
    if (error && error.code === "PERSISTENT_STORAGE_NOT_CONFIGURED") {
      return res.status(503).json({
        success: false,
        error: error.message,
        storage: getStorageStatus(),
      });
    }
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

