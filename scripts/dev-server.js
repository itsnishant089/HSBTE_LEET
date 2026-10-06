#!/usr/bin/env node
/**
 * Local static server that mirrors production clean-URL routing.
 * Usage:
 *   npm run dev
 *   node scripts/dev-server.js 5500
 *
 * Production routing sources (preserved, not replaced):
 *   - functions/_middleware.js  → Cloudflare Pages
 *   - vercel.json rewrites      → Vercel
 *
 * This file is LOCAL-DEV ONLY. It does not change production.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Root of workspace (parent of scripts/)
const ROOT = path.resolve(__dirname, '..');
const rawPort = process.argv[2];
const parsedPort = parseInt(rawPort, 10);
const PORT = (!isNaN(parsedPort) && parsedPort > 0) ? parsedPort : (parseInt(process.env.PORT || '5500', 10) || 5500);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json'
};

const BYPASS_PREFIXES = [
  '/css/', '/js/', '/image/', '/partials/', '/api/',
  '/paper/', '/pdf/', '/syllabus/', '/html/', '/functions/'
];

function sendFile(res, filePath, status) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send404(res);
      return;
    }
    res.writeHead(status || 200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(data);
  });
}

function send404(res) {
  const p = path.join(ROOT, '404.html');
  if (fs.existsSync(p)) {
    sendFile(res, p, 404);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
}

function safeJoin(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const joined = path.normalize(path.join(ROOT, decoded.replace(/^\/+/, '')));
  if (!joined.startsWith(ROOT)) return null;
  return joined;
}

function resolveLocalPath(pathname) {
  // Normalize index redirects conceptually (serve root)
  if (pathname === '/index' || pathname === '/index.html') {
    return path.join(ROOT, 'index.html');
  }
  if (pathname === '/' || pathname === '') {
    return path.join(ROOT, 'index.html');
  }

  // Author profile clean URL mapping
  if (pathname === '/author/nishant') {
    return path.join(ROOT, 'html', 'author-nishant.html');
  }

  // Canonical migration: /haryana-leet-2026 -> /haryanaleet
  if (pathname === '/haryana-leet-2026') {
    return path.join(ROOT, 'html', 'haryanaleet.html');
  }

  // Alias /notes -> /leet-notes
  if (pathname === '/notes') {
    return path.join(ROOT, 'html', 'leet-notes.html');
  }

  // Legacy /html/... path — serve file directly
  if (pathname.startsWith('/html/')) {
    let p = pathname;
    if (!p.endsWith('.html') && !path.extname(p)) p += '.html';
    return safeJoin(p);
  }

  // Real assets / known prefixes
  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return safeJoin(pathname);
  }

  // Files with non-.html extensions (robots.txt, sw.js, ads.txt, etc.)
  if (pathname.includes('.') && !pathname.endsWith('.html')) {
    return safeJoin(pathname);
  }

  // Clean URL → /html/<path>.html  (same as Cloudflare middleware / Vercel rewrite)
  const clean = pathname.replace(/\.html$/, '').replace(/\/$/, '');
  return safeJoin(`/html${clean}.html`);
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);
    let pathname = url.pathname;

    const filePath = resolveLocalPath(pathname);
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      send404(res);
      return;
    }
    sendFile(res, filePath, 200);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
});

server.listen(PORT, () => {
  const origin = `http://localhost:${PORT}`;
  console.log(`HSBTE local server running on ${origin}`);
  console.log(`  Homepage: ${origin}/`);
  console.log(`  Clean URL: ${origin}/haryanaleet`);
  console.log(`  Book: ${origin}/haryana-leet-book`);
});
