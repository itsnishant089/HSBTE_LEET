const fs = require("fs");
const path = require("path");

// Use /tmp on Vercel (ephemeral storage)
const DB_PATH = process.env.VERCEL
  ? path.join("/tmp", "visitors.json")
  : path.join(__dirname, "../../data/visitors.json");

const INITIAL_COUNT = 4000;

// Ensure directory exists
const dataDir = process.env.VERCEL ? "/tmp" : path.join(__dirname, "../../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize DB
function initDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      totalVisitors: INITIAL_COUNT,
      visitors: [],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

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
    const db = initDatabase();
    const visitorId = getVisitorId(req);

    const page = req.query?.page || req.body?.page || "/";
    const referrer = req.query?.referrer || req.body?.referrer || "";

    const isNew = isNewVisitor(visitorId, db.visitors);

    if (isNew) {
      db.totalVisitors += 1;
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

    db.lastUpdated = new Date().toISOString();

    // limit size
    if (db.visitors.length > 10000) {
      db.visitors = db.visitors.slice(-10000);
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

    return res.status(200).json({
      success: true,
      totalVisitors: db.totalVisitors,
      isNewVisitor: isNew,
      message: isNew
        ? "New visitor counted"
        : "Returning visitor (not counted)"
    });
  } catch (error) {
    console.error("Visitor tracking error:", error);

    return res.status(200).json({
      success: true,
      totalVisitors: INITIAL_COUNT,
      isNewVisitor: false,
      error: "Fallback count returned"
    });
  }
};
