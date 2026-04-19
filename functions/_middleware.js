export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

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
  if (path.startsWith('/html/')) {
    const cleanPath = path.replace(/^\/html/, '').replace(/\.html$/, '');
    if (!cleanPath || cleanPath === '/') {
        return Response.redirect(new URL('/', url.origin), 301);
    }
    return Response.redirect(new URL(cleanPath, url.origin), 301);
  }

  // 4. Root index and 404 bypass
  if (path === '/' || path === '/404' || path === '/404.html') {
    return context.next();
  }

  // 5. If the path has an extension other than .html (e.g. .js, .css), bypass
  if (path.includes('.') && !path.endsWith('.html')) {
    return context.next();
  }

  // 6. Internal Rewrite: /btech-leet -> /html/btech-leet.html
  // This is the core logic that supports the /html/ folder structure
  try {
    const rewritePath = `/html${path}${path.endsWith('.html') ? '' : '.html'}`;
    const newRequest = new Request(new URL(rewritePath, url.origin), context.request);
    
    const response = await context.env.ASSETS.fetch(newRequest);
    
    if (response.status === 404) {
      // If the rewritten path is not found, try the original path or show 404
      return context.next(); 
    }
    
    return response;
  } catch (e) {
    return context.next();
  }
}
