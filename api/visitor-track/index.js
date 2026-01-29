const fs = require('fs');
const path = require('path');

// Database file path - Using /tmp for Vercel compatibility
// Note: /tmp is ephemeral. For production, consider using a database (MongoDB, PostgreSQL, etc.)
const DB_PATH = process.env.VERCEL ? 
  path.join('/tmp', 'visitors.json') : 
  path.join(__dirname, '../../data/visitors.json');
const INITIAL_COUNT = 4000; // Start from 4000

// Ensure data directory exists
const dataDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database if it doesn't exist
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
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

// Get visitor identifier (IP + User Agent hash)
function getVisitorId(req) {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  // Simple hash function
  const str = `${ip}-${userAgent}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Check if visitor is new (not visited in last 24 hours)
function isNewVisitor(visitorId, visitors) {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentVisits = visitors.filter(v => 
    v.visitorId === visitorId && 
    new Date(v.timestamp) > oneDayAgo
  );
  
  return recentVisits.length === 0;
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
    const db = initDatabase();
    const visitorId = getVisitorId(req);
    const page = req.query.page || req.body?.page || '/';
    const referrer = req.headers.referer || req.body?.referrer || '';
    
    // Check if this is a new visitor (not visited in last 24 hours)
    const isNew = isNewVisitor(visitorId, db.visitors);
    
    if (isNew) {
      db.totalVisitors += 1;
    }

    // Add visit record
    const visit = {
      visitorId,
      page,
      referrer,
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    };

    db.visitors.push(visit);
    db.lastUpdated = new Date().toISOString();

    // Keep only last 10000 visits to prevent file from growing too large
    if (db.visitors.length > 10000) {
      db.visitors = db.visitors.slice(-10000);
    }

    // Save to file
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

    return res.status(200).json({
      success: true,
      totalVisitors: db.totalVisitors,
      isNewVisitor: isNew
    });

  } catch (error) {
    console.error('Error tracking visitor:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
