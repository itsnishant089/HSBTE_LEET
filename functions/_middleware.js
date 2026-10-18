import { verifyToken, rest, eq } from './_lib/book-core.js';
import { readCookie, trialKind, trialConsume } from './_lib/pay-core.js';

/**
 * Premium papers (questions + answers are inside the HTML) are only served to a logged-in student whose access
 * is active. The login cookie is issued by /api/premium/session and /api/pay/*. Not configured yet → unchanged.
 */
const GATED = /^\/(?:html\/)?(premium-sample-paper-\d+|section-[a-d]-[12]|premium-notes|rank-analysis|study-plan|college-predictor)(?:\.html)?\/?$/i;
// Ultra-only tools (Premium members are sent to the Ultra page instead of the login page)
const ULTRA_ONLY = new Set(['study-plan', 'college-predictor']);
// The single paper every free-trial account can open (override with the TRIAL_FREE_PAPER env var)
const freePaperSlug = env => String(env.TRIAL_FREE_PAPER || 'premium-sample-paper-1').toLowerCase();

function upgradeRedirect(url, slug, ended) {
  const dest = new URL('/premium-login', url.origin);
  dest.searchParams.set('upgrade', '1');
  if (ended) dest.searchParams.set('trial', 'ended');
  dest.searchParams.set('next', '/' + slug.toLowerCase());
  return new Response(null, { status: 302, headers: { location: dest.toString(), 'cache-control': 'private, no-store' } });
}

async function premiumGate(context, url) {
  let pn = url.pathname;
  try { pn = decodeURIComponent(pn); } catch (e) { return new Response('Bad request', { status: 400 }); }
  const m = GATED.exec(pn.replace(/\/{2,}/g, '/'));  // %33 / double slashes must not slip past the gate
  if (!m) return null;
  const env = context.env;
  if (!env.SESSION_SECRET || !env.MAIN_SUPABASE_URL || !env.MAIN_SUPABASE_SERVICE_KEY) return null;
  const p = await verifyToken(env.SESSION_SECRET, readCookie(context.request));
  let ok = !!(p && p.k === 'prem');
  let trialEnded = false;
  if (ok) {
    let row;        // undefined = unknown, null = no access row (free-trial account)
    try { // access can be revoked by the admin at any time
      const r = await rest(env, 'premium_access', 'user_id=' + eq(p.uid) + '&select=is_active&limit=1');
      if (r.ok && Array.isArray(r.data)) row = r.data[0] || null;
    } catch (e) { /* database hiccup: keep the signed cookie's verdict */ }
    if (row === null) {
      // registered through the free trial and has not bought anything: ONE fixed free paper + 2 non-Ultra tools, then the upgrade page
      const slug = m[1].toLowerCase();
      // Ultra tools are never free (new throw-away accounts must not be able to use them)
      if (ULTRA_ONLY.has(slug)) return new Response(null, { status: 302, headers: { location: new URL('/ultra-premium', url.origin).toString(), 'cache-control': 'private, no-store' } });
      // Only the one designated free paper is open; every other paper needs Premium
      if (trialKind(slug) === 'paper' && slug !== freePaperSlug(env)) return upgradeRedirect(url, m[1], false);
      try {
        const t = await trialConsume(env, p.uid, trialKind(slug), slug);
        ok = !!t.allowed; trialEnded = !t.allowed && !t.error;
      } catch (e) { ok = false; }
      return ok ? 'allow' : upgradeRedirect(url, m[1], trialEnded);
    }
    if (row !== undefined) ok = row.is_active === true;
    if (ok && ULTRA_ONLY.has(m[1].toLowerCase())) {
      try {
        let u = await rest(env, 'ultra_premium_users', 'user_id=' + eq(p.uid) + '&select=id&limit=1');
        let has = u.ok && Array.isArray(u.data) && u.data.length > 0;
        if (!has && p.m) { u = await rest(env, 'ultra_premium_users', 'mobile=' + eq(p.m) + '&select=id&limit=1'); has = u.ok && Array.isArray(u.data) && u.data.length > 0; }
        if (u.ok && !has) return new Response(null, { status: 302, headers: { location: new URL('/ultra-premium', url.origin).toString(), 'cache-control': 'private, no-store' } });
      } catch (e) { /* keep verdict */ }
    }
  }
  if (ok) return 'allow';
  const dest = new URL('/premium-login', url.origin);
  dest.searchParams.set('next', '/' + m[1].toLowerCase());
  return new Response(null, { status: 302, headers: { location: dest.toString(), 'cache-control': 'private, no-store' } });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const gate = await premiumGate(context, url);
  if (gate instanceof Response) return gate;
  const res = await route(context);
  if (gate === 'allow') {
    const out = new Response(res.body, res);
    out.headers.set('cache-control', 'private, no-store');
    out.headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
    return out;
  }
  return res;
}

async function route(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // 0. Prevent infinite loops by detecting internal rewrites
  if (context.request.headers.get('x-internal-rewrite') === 'true') {
    return context.next();
  }

  // 1. Bypass assets, APIs, and known root files
  const bypassPrefixes = ['/css/', '/js/', '/image/', '/partials/', '/api/', '/paper/', '/pdf/', '/syllabus/'];
  if (bypassPrefixes.some(p => path.startsWith(p))) {
    return context.next();
  }

  // 2. Normalize and redirect /index or /html/index
  if (path === '/index' || path === '/index.html' || path === '/html/index.html') {
    return Response.redirect(new URL('/', url.origin), 301);
  }

  // 2b. Canonical 301 Migration: /haryana-leet-2026 -> /haryanaleet
  if (path === '/haryana-leet-2026' || path === '/haryana-leet-2026.html' || path === '/html/haryana-leet-2026.html') {
    return Response.redirect(new URL('/haryanaleet', url.origin), 301);
  }

  // 2c. Short Notes now live inside the Book page (one page, one URL for SEO)
  if (path === '/haryana-leet-short-notes' || path === '/haryana-leet-short-notes.html' || path === '/html/haryana-leet-short-notes.html') {
    return Response.redirect(new URL('/haryana-leet-book#short-notes', url.origin), 301);
  }

  // 3. Handle legacy /html/ path access by redirecting to clean URLs
  // IMPORTANT: preserve ?query and #hash (e.g. /html/download.html?file=/paper/x.pdf)
  if (path.startsWith('/html/')) {
    const cleanPath = path.replace(/^\/html/, '').replace(/\.html$/, '');
    if (!cleanPath || cleanPath === '/') {
      const home = new URL('/', url.origin);
      home.search = url.search;
      home.hash = url.hash;
      return Response.redirect(home, 301);
    }
    const dest = new URL(cleanPath, url.origin);
    dest.search = url.search;
    dest.hash = url.hash;
    return Response.redirect(dest, 301);
  }

  // 4. Root index and 404 bypass
  if (path === '/' || path === '/404' || path === '/404.html') {
    return context.next();
  }

  // 5. If the path has an extension other than .html (e.g. .js, .css), bypass
  if (path.includes('.') && !path.endsWith('.html')) {
    return context.next();
  }

  // 6. Internal Rewrite: /btech-leet -> /html/btech-leet
  // This is the core logic that supports the /html/ folder structure
  try {
    let cleanReqPath = path.endsWith('.html') ? path.replace(/\.html$/, '') : path;
    if (cleanReqPath === '/author/nishant') {
      cleanReqPath = '/author-nishant';
    }
    if (cleanReqPath === '/notes') {
      cleanReqPath = '/leet-notes';
    }
    
    // Create a new URL object based on the original URL
    const rewriteUrl = new URL(url);
    
    // Cloudflare Pages with "Clean URLs" enabled serves files without the .html extension.
    // By setting the pathname to include /html, Pages will automatically look for
    // /html/YOUR_PATH.html and serve it under this URL without returning a 308 redirect.
    rewriteUrl.pathname = `/html${cleanReqPath}`;
    
    // We create a new Request object to fetch the asset, adding a marker header to prevent routing recursion
    const headers = new Headers(context.request.headers);
    headers.set('x-internal-rewrite', 'true');
    const rewrittenReqWithHeaders = new Request(context.request, { headers });
    const rewriteRequest = new Request(rewriteUrl, rewrittenReqWithHeaders);
    
    return await context.env.ASSETS.fetch(rewriteRequest);
  } catch (e) {
    return context.next();
  }
}