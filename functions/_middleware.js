/**
 * Cloudflare Pages Middleware: functions/_middleware.js
 * 
 * Handles clean URL rewrites that were previously in vercel.json:
 *   /:path → /html/:path.html
 * 
 * This runs before every request and transparently rewrites
 * clean URLs to their .html file in the /html directory,
 * while leaving static assets, API calls, etc. untouched.
 */

const STATIC_EXTENSIONS = /\.(html|css|js|json|xml|txt|ico|webp|png|jpg|jpeg|gif|svg|woff2?|ttf|eot|pdf|mp4|webm|map)$/i;
const EXCLUDED_PREFIXES = ["/api/", "/image/", "/css/", "/js/", "/pdf/", "/data/", "/partials/", "/node_modules/", "/functions/", "/syllabus/", "/paper/"];

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Let root through as-is (index.html auto-served by Cloudflare)
  if (path === "/" || path === "/index.html") {
    return next();
  }

  // Don't rewrite static assets or excluded directories
  if (STATIC_EXTENSIONS.test(path)) {
    return next();
  }

  for (const prefix of EXCLUDED_PREFIXES) {
    if (path.startsWith(prefix)) {
      return next();
    }
  }

  // Clean URL rewrite: /diploma-cse → /html/diploma-cse.html
  const cleanPath = path.endsWith("/") ? path.slice(0, -1) : path;
  const rewrittenUrl = new URL(request.url);
  rewrittenUrl.pathname = `/html${cleanPath}.html`;

  // Fetch the rewritten page internally
  const response = await context.env.ASSETS.fetch(rewrittenUrl);

  // If the HTML file exists, return it; otherwise fallback to normal handling
  if (response.ok) {
    return response;
  }

  return next();
}
