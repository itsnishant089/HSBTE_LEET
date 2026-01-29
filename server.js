// Local development server for API endpoints
// Run with: node server.js
// Then access the site at http://localhost:3000

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Import API handlers
const visitorTrack = require('./api/visitor-track/index.js');
const analytics = require('./api/analytics/index.js');
const analyticsUpdate = require('./api/analytics/update.js');

// Helper to convert Express req/res to Vercel format
function createVercelReq(req) {
  return {
    query: req.query,
    body: req.body,
    headers: req.headers,
    method: req.method,
    connection: {
      remoteAddress: req.ip || req.connection?.remoteAddress
    }
  };
}

function createVercelRes(res) {
  const vercelRes = {
    statusCode: 200,
    headers: {}
  };
  
  vercelRes.setHeader = (name, value) => {
    vercelRes.headers[name] = value;
    res.setHeader(name, value);
  };
  
  vercelRes.status = (code) => {
    vercelRes.statusCode = code;
    return {
      json: (data) => {
        res.status(code).json(data);
      },
      end: () => {
        res.status(code).end();
      }
    };
  };
  
  return vercelRes;
}

// API Routes
app.get('/api/visitor-track', async (req, res) => {
  const vercelReq = createVercelReq(req);
  const vercelRes = createVercelRes(res);
  await visitorTrack(vercelReq, vercelRes);
});

app.get('/api/analytics', async (req, res) => {
  const vercelReq = createVercelReq(req);
  const vercelRes = createVercelRes(res);
  await analytics(vercelReq, vercelRes);
});

app.post('/api/analytics/update', async (req, res) => {
  const vercelReq = createVercelReq(req);
  const vercelRes = createVercelRes(res);
  await analyticsUpdate(vercelReq, vercelRes);
});

// Serve HTML files
app.get('*', (req, res) => {
  // Handle root
  if (req.path === '/' || req.path === '/index.html') {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }
  
  // Handle HTML files in html/ directory
  if (req.path.endsWith('.html') || !req.path.includes('.')) {
    const filePath = req.path.endsWith('.html') 
      ? path.join(__dirname, req.path)
      : path.join(__dirname, 'html', req.path + '.html');
    
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  
  // Default 404
  res.status(404).send('Not Found');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Local development server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/html/analytics-dashboard.html`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});
