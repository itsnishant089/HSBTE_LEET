// Persistent storage using Vercel KV (Redis) or file system fallback.
// IMPORTANT: On Vercel, filesystem (/tmp) is EPHEMERAL. If KV is not configured,
// counters/analytics WILL appear to reset or jump between instances.
const fs = require("fs");
const path = require("path");

const INITIAL_COUNT = 4000;
const DISPLAY_OFFSET = 125;

const IS_VERCEL = !!process.env.VERCEL;

// Try to use Vercel KV, fallback to file system (local dev only)
let kv = null;
let kvStatus = {
  provider: "filesystem",
  persistent: false,
  reason: IS_VERCEL
    ? "Vercel KV not configured (set KV_REST_API_URL and KV_REST_API_TOKEN)"
    : "Local filesystem storage",
};

try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { createClient } = require("@vercel/kv");
    kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    kvStatus = { provider: "vercel-kv", persistent: true };
  }
} catch (error) {
  kvStatus = {
    provider: "filesystem",
    persistent: false,
    reason: `Failed to initialize Vercel KV: ${error?.message || String(error)}`,
  };
}

function assertPersistentStorageOrThrow() {
  // On Vercel, we require KV for correctness.
  if (IS_VERCEL && !kv) {
    const reason =
      kvStatus.reason ||
      "Vercel KV not configured (set KV_REST_API_URL and KV_REST_API_TOKEN)";
    const err = new Error(
      `Persistent storage not configured. ${reason}. Create Vercel KV and set env vars, then redeploy.`
    );
    err.code = "PERSISTENT_STORAGE_NOT_CONFIGURED";
    throw err;
  }
}

// File system paths (local dev only)
const VISITOR_DB_PATH = path.join(__dirname, "../data/visitors.json");
const ANALYTICS_DB_PATH = path.join(__dirname, "../data/analytics.json");

// Ensure data directory exists
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Get visitors database
async function getVisitorsDB() {
  // Fail fast on Vercel if KV isn't configured (prevents random resets/jumps)
  assertPersistentStorageOrThrow();

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
  assertPersistentStorageOrThrow();

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
  assertPersistentStorageOrThrow();

  if (kv) {
    try {
      const data = await kv.get("analytics");
      if (data) {
        // Normalize shape (older values may not include fields)
        if (!data.pageViews) data.pageViews = {};
        if (!data.sessions) data.sessions = [];
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
    sessions: [],
    lastUpdated: new Date().toISOString()
  };
}

// Save analytics database
async function saveAnalyticsDB(data) {
  assertPersistentStorageOrThrow();

  if (!data.pageViews) data.pageViews = {};
  if (!data.sessions) data.sessions = [];
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
  getStorageStatus: () => ({ ...kvStatus }),
  INITIAL_COUNT,
  DISPLAY_OFFSET
};
