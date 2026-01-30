// Local development server for API endpoints
// Run with: node server.js
// Site: http://localhost:3000

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
//hi
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (html, css, js, images)
app.use(express.static(__dirname));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Import API handlers (same as Vercel)
const visitorTrack = require('./api/visitor-track/index.js');
const analytics = require('./api/analytics/index.js');
const analyticsUpdate = require('./api/analytics/update.js');

// API Routes
app.get('/api/visitor-track', visitorTrack);
app.get('/api/analytics', analytics);
app.post('/api/analytics/update', analyticsUpdate);

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve html pages (with .html extension)
app.get('/html/:page', (req, res) => {
  const page = req.params.page.endsWith('.html') ? req.params.page : req.params.page + '.html';
  res.sendFile(path.join(__dirname, 'html', page));
});

// Serve clean URLs (without /html/ and .html extension)
app.get('/:page', (req, res, next) => {
  // Skip API routes, static files, and root
  if (req.params.page.startsWith('api') || 
      req.params.page.includes('.') ||
      req.params.page === '' ||
      req.params.page === 'index') {
    return next();
  }
  
  // Check if file exists in html directory
  const htmlFile = path.join(__dirname, 'html', req.params.page + '.html');
  if (fs.existsSync(htmlFile)) {
    return res.sendFile(htmlFile);
  }
  
  next();
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send('404 - Not Found');
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/html/analytics-dashboard.html\n`);
});

