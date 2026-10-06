# SEO Report – hsbteleet.com (7 Oct 2026)

## 1. CRITICAL: apex domain points to the wrong site

| URL | What it serves |
|---|---|
| `https://hsbteleet.com/` | A Digital Dukaan/DotPe store ("Nishant - Order Online"), `robots.txt` = `Disallow: /` |
| `https://hsbteleet.com/haryanaleet` (and every inner page, `/sitemap.xml`) | **404** (Next.js, Dukaan) |
| `https://www.hsbteleet.com/…` and `https://hsbteleet.pages.dev/…` | Your real site (Cloudflare Pages), all 200 |

Every page of the real site has `canonical = https://hsbteleet.com/...` (the apex), and the sitemap/robots point to the apex too. So Google is told the "official" URL is a domain that returns 404 and blocks crawling. This alone can keep you from ranking for any keyword, however good the on-page SEO is.

**Fix (only you can do this, it is DNS/dashboard):**
1. Digital Dukaan dashboard: disconnect/remove the custom domain `hsbteleet.com` from the store (store id 9505674).
2. Cloudflare → Pages → hsbte-leet → Custom domains: add `hsbteleet.com` (apex) and make sure `www` redirects 301 to the apex (or the reverse, but then canonicals must change).
3. Check: `https://hsbteleet.com/haryanaleet` = 200 and `https://hsbteleet.com/robots.txt` shows the Allow rules.
4. Search Console: resubmit `sitemap.xml`, use URL Inspection → Request indexing for the home page and the pages in section 3.

## 2. Changes made in the code

- **Titles and meta descriptions** rewritten on 8 key pages to carry the 7 target keywords (og/twitter tags updated too): home, `haryanaleet`, `hsbte-pyq`, `leet-sample-paper`, `leet-preparation-guide`, `btech-leet-sample-paper`, `leet-syllabus`, `leet-overview`.
- **Canonical conflict fixed**: 167 pages had `canonical`/`og:url` ending in `.html` while the sitemap and the live URLs are clean (`/dbm-4`). All now use clean URLs.
- **Missing canonicals added** on 19 pages (all `btech-sample-paper-*`, `Bpharma-sample-paper-*`, `college-predictor`, `rank-analysis`, `study-plan`).
- **noindex** added to `premium-login`, `email-previews`, `user-counseling` (they were `index, follow`).
- **H1**: `dbm-4` and `dbm-5` had no H1 (heading was an H2); fixed.
- **Home meta keywords** cut from ~250 stuffed terms to 15 focused ones (Google ignores this tag; the long list only looks spammy).
- **Internal links with exact-match anchors**: new "Popular Searches" block on the home page and an intro paragraph on `hsbte-pyq`, linking to the keyword pages.
- `sitemap.xml` lastmod updated to 2026-10-07 for the edited key pages.

## 3. Keyword → page map

| Keyword | Target page | Where it now appears |
|---|---|---|
| hsbte leet, hsbte leet 2027 | `/` , `/haryanaleet` | title, description, anchors |
| haryana leet, haryana leet 2027 | `/haryanaleet` | title, H1, description |
| hsbte pyq | `/hsbte-pyq` | title, H1, intro |
| haryana polytechnic pyq | `/hsbte-pyq` | title, description, intro, home anchor |
| haryana leet 2027 preparation | `/leet-preparation-guide` | title, description, home anchor |
| haryana leet sample paper 2027 | `/leet-sample-paper`, `/btech-leet-sample-paper` | title, description, home anchor |

### Round 2 (also done)
- Shortened 150 titles (the long "| Previous Year Question Papers" suffix became "| HSBTE Papers PDF") and 55 descriptions to Google's display limits; no page now has a description over 160 characters.
- Added WebPage + BreadcrumbList JSON-LD to 12 public pages that had none, and descriptions to `college-predictor`, `rank-analysis`, `study-plan`.
- H1 added to the two sample-paper-11 pages; duplicate H1 on `counseling` demoted.

## 4. Audit of the rest (302 HTML pages)

- Good: every public page has a title and description, no duplicate titles, no images without alt, JSON-LD on most pages, a sitemap of 256 URLs, `llms.txt`.
- Titles over 65 characters: 170 pages. Descriptions over 160: 58. Google truncates these in results. Shortening them by hand is the next low-effort task.
- Without structured data: `leet-syllabus`, `leet-notes`, `last-year-cutoff`, `cutoff-analytics`, `college-comparison`, `how-to-pass-hsbte` and others. Add `Article`/`FAQPage` JSON-LD.
- Admin pages (`admin`, `premium-admin`, `counseling-admin`) are already noindex and disallowed in robots.txt.
- `robots.txt` blocks `/pdf/`. Make sure the PDFs are only reached through the HTML landing pages, which are indexable.

## 5. Next steps (off-site, where most ranking comes from)

1. Fix the domain (section 1). Nothing else will help until this is done.
2. Submit the sitemap in Google Search Console and Bing Webmaster Tools and check Coverage after a week.
3. Content: write one dedicated page for each of "Haryana LEET 2027 preparation" and "Haryana LEET sample paper 2027" with 800+ words, and update it before each exam cycle.
4. Backlinks: get listed on Telegram/WhatsApp groups, YouTube descriptions, Quora/Reddit answers and polytechnic college pages.
5. Core Web Vitals: check PageSpeed Insights on `/` and `/hsbte-pyq` (mobile).

*Caveat: I had no access to Search Console or rank data, so this audit is based on the source code and live HTTP checks. No one can guarantee page-1 rankings; the above removes the blockers and aligns the pages with the 7 keywords.*
