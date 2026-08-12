export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // 0. Prevent infinite loops by detecting internal rewrites
  if (context.request.headers.get('x-internal-rewrite') === 'true') {
    return context.next();
  }

  // 1. Bypass assets, APIs, and known root files
  const bypassPrefixes = ['/css/', '/js/', '/image/', '/partials/', '/api/', '/paper/', '/pdf/'];
  if (bypassPrefixes.some(p => path.startsWith(p))) {
    return context.next();
  }

  // 2. Normalize and redirect /index or /html/index
  if (path === '/index' || path === '/index.html' || path === '/html/index.html') {
    return Response.redirect(new URL('/', url.origin), 301);
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
    const cleanReqPath = path.endsWith('.html') ? path.replace(/\.html$/, '') : path;
    
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