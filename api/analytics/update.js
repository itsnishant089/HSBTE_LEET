const fs = require("fs");
const path = require("path");
//ji
// DB path (Vercel compatible)
const ANALYTICS_DB_PATH = process.env.VERCEL
  ? path.join("/tmp", "analytics.json")
  : path.join(__dirname, "../../data/analytics.json");

// Ensure data directory exists
const dataDir = process.env.VERCEL ? "/tmp" : path.join(__dirname, "../../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Init DB
function initAnalyticsDB() {
  if (!fs.existsSync(ANALYTICS_DB_PATH)) {
    const initialData = {
      pageViews: {},   // { page: { views, timeSpent, clicks } }
      sessions: [],   // { sessionId, startTime, endTime, pages: [] }
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(ANALYTICS_DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(ANALYTICS_DB_PATH, "utf8"));
}

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
    const { page, timeSpent = 0, clicks = 0, sessionId } = req.body || {};

    if (!page) {
      return res.status(400).json({
        success: false,
        error: "Page is required"
      });
    }

    const analytics = initAnalyticsDB();

    // Init page
    if (!analytics.pageViews[page]) {
      analytics.pageViews[page] = {
        views: 0,
        timeSpent: 0,
        clicks: 0
      };
    }

    // Update page stats
    analytics.pageViews[page].views += 1;
    analytics.pageViews[page].timeSpent += Number(timeSpent) || 0;
    analytics.pageViews[page].clicks += Number(clicks) || 0;

    // Session tracking (optional)
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

    fs.writeFileSync(ANALYTICS_DB_PATH, JSON.stringify(analytics, null, 2));

    return res.status(200).json({
      success: true,
      message: "Analytics updated"
    });

  } catch (error) {
    console.error("Analytics update error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

