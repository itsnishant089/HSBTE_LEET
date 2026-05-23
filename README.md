# HSBTE LEET Website

Educational website for Haryana diploma students and LEET aspirants. The project combines HSBTE previous year question papers, LEET preparation resources, counselling tools, and branch-wise study material in a static-first site with lightweight serverless support.

## Snapshot

- Live domain: `https://hsbteleet.com`
- HTML pages: `267`
- Question paper PDFs: `7679`
- Core PDF resources: `17`
- Image assets: `63`
- Primary audience: Haryana diploma students, B.Tech LEET aspirants, B.Pharmacy LEET aspirants

## What Was Updated

This repo now includes stronger SEO coverage around key admissions dates:

- Added `/btech-leet-key-dates`
- Added `/b-pharmacy-leet-key-dates`
- Rebuilt `/leet-tentative-dates` as a course-selection hub instead of an outdated generic page
- Rewired the “Tentative Key Dates” cards on the B.Tech and B.Pharmacy landing pages
- Updated `sitemap.xml`, `robots.txt`, and on-site search discovery
- Cleaned canonical and Open Graph URLs for `cutoff-analytics` and `college-comparison`
- Refreshed internal links on the homepage to use clean, crawlable URLs

## SEO Analysis

### Current strengths

- Large topical coverage with many branch and semester pages
- Clean URL rewrites already enabled through `vercel.json`
- Strong internal search layer in `js/search.js`
- Existing structured data usage on important LEET pages
- Dedicated hub pages for syllabus, counselling, sample papers, and overview content

### Improvements shipped in this update

- Split one weak “tentative dates” page into two intent-specific landing pages
- Added exact 2026-27 dates directly in indexable HTML instead of sending users off-site
- Improved internal linking for date-related queries
- Added search keywords for new date pages and important tools
- Added sitemap and robots coverage for newly important routes
- Fixed canonical direction for analytics-style pages that were still pointing to `/html/...`

### Remaining SEO opportunities

- Standardize metadata quality across older branch pages
- Replace remaining legacy `/html/...` internal links on older pages with clean URLs
- Normalize structured data patterns across all top-level pages
- Reduce encoding/mojibake issues on some older files
- Consider generating `sitemap.xml` automatically from the route set to avoid drift

## Important SEO Routes

- `/`
- `/haryanaleet`
- `/haryana-leet-2026`
- `/btech-leet`
- `/btech-leet-key-dates`
- `/B-Pharmacy-leet`
- `/b-pharmacy-leet-key-dates`
- `/leet-tentative-dates`
- `/haryana-leet-syllabus`
- `/haryana-leet-counselling`
- `/leet-sample-paper`
- `/cutoff-analytics`
- `/college-comparison`

## Analytics and Monetization

### Analytics currently used

- Google Analytics 4: `G-WR1BG2HCE0`
- Microsoft Clarity: `vesdg7gqcq`

### Ads

- AdSense is injected through `js/ads.js`
- The ad injector excludes premium and sensitive routes and guards against footer-ad placement issues

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Cloudflare Pages Functions
- Vercel-style clean URL rewrites in `vercel.json`

## Project Structure

```text
HSBTE_LEET/
|-- index.html
|-- html/                 # Main site routes and content pages
|-- css/                  # Shared styling
|-- js/                   # Search, UI, chatbot, ads, utilities
|-- partials/             # Shared header, footer, chatbot, bottom nav
|-- paper/                # Question paper PDFs
|-- pdf/                  # LEET and syllabus PDFs
|-- image/                # Site assets
|-- functions/            # Serverless endpoints
|-- sitemap.xml
|-- robots.txt
|-- vercel.json
```

## Key Files for SEO Work

- `index.html`: homepage metadata and major internal links
- `partials/header.html`: crawl-critical navigation
- `partials/footer.html`: repeated internal links and trust signals
- `js/search.js`: internal search discovery and keyword routing
- `sitemap.xml`: crawl coverage
- `robots.txt`: allow/disallow and sitemap declaration
- `html/btech-leet-key-dates.html`: B.Tech dates landing page
- `html/b-pharmacy-leet-key-dates.html`: B.Pharmacy dates landing page
- `html/leet-tentative-dates.html`: schedule hub page

## Local Development

Run the site locally with a static server or through the platform workflow already used in the repo.

If Cloudflare Pages Functions are needed:

```bash
wrangler pages dev .
```

## SEO Publishing Checklist

When adding a new important page:

1. Create a clean URL under `html/`.
2. Add a unique `<title>`, description, canonical, OG, and Twitter tags.
3. Add at least one structured data block when relevant.
4. Link the page from an existing strong page.
5. Add the route to `js/search.js`.
6. Add the route to `sitemap.xml`.
7. Add the route to `robots.txt` if it should be crawled.
8. Prefer clean internal URLs like `/page-name` over `/html/page-name.html`.

## Notes

- This site is informational and not an official HSBTE or HSTES website.
- Admission dates and rules can change, so official portals must remain the final source of truth.
