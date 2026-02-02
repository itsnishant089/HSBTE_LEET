// Use Vercel KV for persistent storage
const { getAnalyticsDB, saveAnalyticsDB, getStorageStatus } = require('../../lib/kv-storage');

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { page, timeSpent = 0, clicks = 0, sessionId, event = "engagement" } = req.body || {};

    if (!page) {
      return res.status(400).json({
        success: false,
        error: "Page is required"
      });
    }

    const analytics = await getAnalyticsDB();

    // Init page
    if (!analytics.pageViews[page]) {
      analytics.pageViews[page] = {
        views: 0,
        timeSpent: 0,
        clicks: 0
      };
    }

    // Update page stats
    // Count views only for explicit pageview events (prevents inflating views on periodic engagement pings)
    if (event === "pageview") {
      analytics.pageViews[page].views += 1;
    }
    analytics.pageViews[page].timeSpent += Number(timeSpent) || 0;
    analytics.pageViews[page].clicks += Number(clicks) || 0;

    // Session tracking (optional)
    if (!analytics.sessions) {
      analytics.sessions = [];
    }
    
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

      // Track page in session
      session.pages.push({
        page,
        timestamp: new Date().toISOString(),
        timeSpent: Number(timeSpent) || 0
      });
    }

    // Limit sessions to last 1000
    if (analytics.sessions.length > 1000) {
      analytics.sessions = analytics.sessions.slice(-1000);
    }

    analytics.lastUpdated = new Date().toISOString();

    // Save to KV (persistent storage)
    await saveAnalyticsDB(analytics);

    return res.status(200).json({
      success: true,
      message: "Analytics updated",
      storage: getStorageStatus()
    });

  } catch (error) {
    console.error("Analytics update error:", error);
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

