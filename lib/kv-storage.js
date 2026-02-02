// Persistent storage using Vercel KV (Redis) or file system fallback
const fs = require("fs");
const path = require("path");

const INITIAL_COUNT = 4000;
const DISPLAY_OFFSET = 125;

// Try to use Vercel KV, fallback to file system
let kv = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { createClient } = require("@vercel/kv");
    kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    console.log("✅ Using Vercel KV for persistent storage");
  }
} catch (error) {
  console.warn("⚠️ Vercel KV not available, using file system fallback");
}

// File system paths (for local dev or fallback)
const VISITOR_DB_PATH = process.env.VERCEL
  ? path.join("/tmp", "visitors.json")
  : path.join(__dirname, "../data/visitors.json");

const ANALYTICS_DB_PATH = process.env.VERCEL
  ? path.join("/tmp", "analytics.json")
  : path.join(__dirname, "../data/analytics.json");

// Ensure data directory exists
const dataDir = process.env.VERCEL ? "/tmp" : path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Get visitors database
async function getVisitorsDB() {
  if (kv) {
    try {
      const data = await kv.get("visitors");
      if (data) {
        return data;
      }
    } catch (error) {
      console.error("KV read error:", error);
    }
  }
  
  // Fallback to file system
  if (fs.existsSync(VISITOR_DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(VISITOR_DB_PATH, "utf8"));
      if (data.totalVisitors && data.totalVisitors >= INITIAL_COUNT) {
        return data;
      }
    } catch (error) {
      console.error("File read error:", error);
    }
  }
  
  // Return initial data
  return {
    totalVisitors: INITIAL_COUNT,
    visitors: [],
    lastUpdated: new Date().toISOString()
  };
}

// Save visitors database
async function saveVisitorsDB(data) {
  // Ensure totalVisitors is at least INITIAL_COUNT
  if (!data.totalVisitors || data.totalVisitors < INITIAL_COUNT) {
    data.totalVisitors = INITIAL_COUNT;
  }
  
  data.lastUpdated = new Date().toISOString();
  
  if (kv) {
    try {
      await kv.set("visitors", data);
      return;
    } catch (error) {
      console.error("KV write error:", error);
    }
  }
  
  // Fallback to file system
  try {
    fs.writeFileSync(VISITOR_DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("File write error:", error);
  }
}

// Get analytics database
async function getAnalyticsDB() {
  if (kv) {
    try {
      const data = await kv.get("analytics");
      if (data) {
        return data;
      }
    } catch (error) {
      console.error("KV read error:", error);
    }
  }
  
  // Fallback to file system
  if (fs.existsSync(ANALYTICS_DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(ANALYTICS_DB_PATH, "utf8"));
    } catch (error) {
      console.error("File read error:", error);
    }
  }
  
  // Return initial data
  return {
    pageViews: {},
    lastUpdated: new Date().toISOString()
  };
}

// Save analytics database
async function saveAnalyticsDB(data) {
  data.lastUpdated = new Date().toISOString();
  
  if (kv) {
    try {
      await kv.set("analytics", data);
      return;
    } catch (error) {
      console.error("KV write error:", error);
    }
  }
  
  // Fallback to file system
  try {
    fs.writeFileSync(ANALYTICS_DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("File write error:", error);
  }
}

module.exports = {
  getVisitorsDB,
  saveVisitorsDB,
  getAnalyticsDB,
  saveAnalyticsDB,
  INITIAL_COUNT,
  DISPLAY_OFFSET
};
