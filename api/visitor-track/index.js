// Use Vercel KV for persistent storage (or file system for local dev)
const {
  getVisitorsDB,
  saveVisitorsDB,
  getStorageStatus,
  INITIAL_COUNT,
  DISPLAY_OFFSET,
} = require("../../lib/kv-storage");

// Generate visitor ID (IP + User-Agent)
function getVisitorId(req) {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  const ua = req.headers["user-agent"] || "unknown";
  const str = `${ip}-${ua}`;

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

// Check if visitor is new in last 24h
function isNewVisitor(visitorId, visitors) {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return !visitors.some(
    v =>
      v.visitorId === visitorId &&
      new Date(v.timestamp).getTime() > oneDayAgo
  );
}

module.exports = async (req, res) => {
  // ❗ NO CACHE (VERY IMPORTANT)
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const db = await getVisitorsDB();
    const visitorId = getVisitorId(req);

    const page = req.query?.page || req.body?.page || "/";
    const referrer = req.query?.referrer || req.body?.referrer || "";
    
    // Check if this is a dashboard request (don't add offset for dashboard)
    const isDashboard = req.query?.dashboard === "true" || req.body?.dashboard === "true" || 
                        page.includes("analytics-dashboard") || 
                        req.headers.referer?.includes("analytics-dashboard");

    const isNew = isNewVisitor(visitorId, db.visitors || []);

    if (isNew) {
      db.totalVisitors = (db.totalVisitors || INITIAL_COUNT) + 1;
    }

    // Ensure visitors array exists
    if (!db.visitors) {
      db.visitors = [];
    }

    db.visitors.push({
      visitorId,
      page,
      referrer,
      timestamp: new Date().toISOString(),
      ip:
        req.headers["x-forwarded-for"] ||
        req.headers["x-real-ip"] ||
        "unknown",
      userAgent: req.headers["user-agent"] || "unknown"
    });

    // limit size
    if (db.visitors.length > 10000) {
      db.visitors = db.visitors.slice(-10000);
    }

    // Ensure totalVisitors is at least INITIAL_COUNT
    if (!db.totalVisitors || db.totalVisitors < INITIAL_COUNT) {
      db.totalVisitors = INITIAL_COUNT;
    }

    // Save to KV (persistent storage)
    await saveVisitorsDB(db);
    
    // For dashboard: return actual count
    // For regular pages: return count + offset (4125 instead of 4000)
    const displayCount = isDashboard ? db.totalVisitors : (db.totalVisitors + DISPLAY_OFFSET);

    return res.status(200).json({
      success: true,
      totalVisitors: displayCount,
      actualVisitors: db.totalVisitors, // Always include actual for reference
      isNewVisitor: isNew,
      storage: getStorageStatus(),
      message: isNew
        ? "New visitor counted"
        : "Returning visitor (not counted)"
    });
  } catch (error) {
    console.error("Visitor tracking error:", error);

    // If KV is not configured on Vercel, do NOT pretend it's fine (it causes random resets/jumps).
    if (error && error.code === "PERSISTENT_STORAGE_NOT_CONFIGURED") {
      return res.status(503).json({
        success: false,
        error: error.message,
        storage: getStorageStatus(),
      });
    }

    // Fallback: return display count (4125) for regular pages, actual for dashboard
    const isDashboard = req.query?.dashboard === "true" || req.body?.dashboard === "true" || 
                        (req.query?.page || req.body?.page || "").includes("analytics-dashboard");
    const fallbackCount = isDashboard ? INITIAL_COUNT : (INITIAL_COUNT + DISPLAY_OFFSET);
    
    return res.status(200).json({
      success: true,
      totalVisitors: fallbackCount,
      actualVisitors: INITIAL_COUNT,
      isNewVisitor: false,
      storage: getStorageStatus(),
      error: "Fallback count returned"
    });
  }
};
