/**
 * Five Server local config — mirrors production clean-URL routing from:
 *   - functions/_middleware.js (Cloudflare Pages)
 *   - vercel.json rewrites
 *
 * Root cause of localhost 404:
 * Production serves /page-name via rewrite to /html/page-name.html.
 * Five Server (port 5500) serves static files only, so /page-name 404s.
 *
 * Note: There is no /s/{code} URL shortener in this repo. Production
 * https://hsbteleet.com/s/... also returns the site 404 page.
 * This config fixes clean paths like /btech-leet on localhost.
 */
const path = require('path');
const fs = require('fs');

const BYPASS_PREFIXES = [
  '/css/', '/js/', '/image/', '/partials/', '/api/',
  '/paper/', '/pdf/', '/syllabus/', '/html/', '/functions/', '/.well-known/'
];

function shouldBypass(urlPath) {
  if (urlPath === '/' || urlPath === '/index.html' || urlPath === '/404.html') return true;
  if (BYPASS_PREFIXES.some((p) => urlPath.startsWith(p))) return true;
  // Real files with non-.html extensions (robots.txt, sw.js, ads.txt, etc.)
  if (urlPath.includes('.') && !urlPath.endsWith('.html')) return true;
  return false;
}

/** Connect middleware: /btech-leet → /html/btech-leet.html */
function cleanUrlRewrite(req, res, next) {
  try {
    const raw = (req.url || '/').split('?')[0];
    const qs = (req.url || '').includes('?') ? '?' + (req.url || '').split('?')[1] : '';
    if (shouldBypass(raw)) return next();

    const clean = raw.replace(/\.html$/, '').replace(/\/$/, '') || '';
    if (!clean || clean === '/index') return next();

    const target = `/html${clean}.html`;
    const abs = path.join(__dirname, target.replace(/^\//, ''));
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      req.url = target + qs;
    }
  } catch (_) {
    /* fall through */
  }
  return next();
}

module.exports = {
  port: 5500,
  root: '.',
  open: false,
  middleware: [cleanUrlRewrite]
};
