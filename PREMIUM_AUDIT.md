# Premium Papers: Security & Performance Audit (7 Oct 2026)

Checked from the repo and with live HTTP requests. No data was read from the database (only row counts), and nothing was written.

## 1. Security findings (fix these first)

| # | Severity | Finding | Evidence |
|---|---|---|---|
| 1 | **Critical** | **Paid papers are readable by anyone without login.** Questions and correct answers are inside the public HTML/JS; the login check only hides the page in the browser. | `curl https://www.hsbteleet.com/premium-sample-paper-1` returned all 90 questions with answers. `/section-a-1` returned all 100. |
| 2 | **Critical** | **Database tables readable with the public anon key.** `premium_access`, `premium_payments`, `ultra_premium_users`, `premium_users` and `reviews` each returned rows to an anonymous request (row-level security missing or too open). These tables hold phone numbers, emails and payment ids. | HEAD request with the key from the page source: `Content-Range: 0-0/1` on each. Writes were not tested. |
| 3 | **High** | **A 100%-off coupon is public in the page source.** `NISHANT2007` (free) and `LEET123` (50%) are in `premium-login.html`; price, coupon and "paid" status are all decided in the browser. | `html/premium-login.html` ~line 1230 |
| 4 | **High** | **No server-side payment check.** The page creates a Razorpay payment with a client-chosen amount and then writes the payment and access rows itself. A user can edit the amount or insert their own `premium_access` row if RLS allows. | `premium-login.html` ~lines 1600-1670 |
| 5 | Medium | Copy/devtools/screenshot blocking (`premium-security.js`) only deters casual users. It cannot stop View Source, `curl`, or a screenshot from a phone. | `js/premium-security.js` |
| 6 | Medium | `_headers` sets `X-Frame-Options: ALLOWALL` (not a valid protective value), so pages can be framed (clickjacking). `vercel.json` says DENY. | `_headers` line 3 |
| 7 | Low | Emailjs/Supabase keys are in client code. The Supabase anon key is meant to be public, but only if RLS is correct (see #2). | |
| 8 | Info | Existing papers score +4 / -1 (max 360), but the site tells students LEET has no negative marking and 90 marks. The 20 new papers copy the existing scoring so all papers behave the same. | Decide which is right and change `cor*4 - wro` in all 46 papers. |

### Recommended fix (needs backend work, not done automatically)
1. Turn on RLS for every table. Users may read only their own row (`auth.uid() = user_id`); payments and users tables must not be readable by `anon`.
2. Use real Supabase Auth, and put the question data behind a Cloudflare Pages Function (for example `/api/paper/46`) that checks the JWT and `premium_access` before returning JSON. The HTML page then ships without questions or answers.
3. Create Razorpay orders on the server, verify the payment signature on the server, and grant access from a webhook. Keep coupons in a server table.
4. Remove `NISHANT2007` from the page source and rotate it.
5. Set `X-Frame-Options: SAMEORIGIN` (or `frame-ancestors 'self'` in CSP) in `_headers`.

## 2. Performance findings

| Finding | Impact | Status |
|---|---|---|
| `js/search.js` downloaded **about 160 full PYQ pages on every page load** (its cache needed 500+ items but only ever held 279, so it never counted as cached). Home page made 195 requests. | Several MB of mobile data per visit, slow pages, wasted hosting bandwidth. | **Fixed.** Cache threshold lowered to 200 and the subject crawl is now opt-in (`localStorage.hsbte_subject_crawl = '1'`). Home page now makes 44 requests, 5 fetches. Subject-level search was already empty (0 subjects saved); it stays off. |
| `image/converted-images.zip` (4.6 MB) is deployed publicly. | Free download of an internal archive, counts against the bundle. | Not deleted. Move it out of the deployed folder. |
| `js/leet-notes-data.js` is 946 KB, loaded as one file. | Slow notes page on mobile. | Split by chapter or lazy-load. |
| `image/Mechinical.webp` 276 KB, `favicon.png` 205 KB. | Larger than needed. | Re-compress. |
| Header, footer and chatbot are fetched by JavaScript after page load. | Layout shift and a slower first paint. | Inline them at build time when possible. |
| Supabase library (jsdelivr) is loaded synchronously on premium pages. | Blocks rendering for a second or two on slow networks. | Add `defer`. |

## 3. What was added in this round
- 20 new premium papers: `premium-sample-paper-27` to `-46` (1,800 new questions). Total premium papers: 54 (46 full-length + 8 section-wise).
- Questions follow the same section split as the existing papers (A 25, B 25, C 20, D 20), use the same page template, access check, watermark and `premium-security.js`.
- Numerical questions are generated from formulas (answers are computed, not typed). Concept questions were written by hand. Every question was compared with 4,766 existing questions from 52 pages: 0 exact matches, 0 near-duplicates, 0 repeats among the new papers.
- Correct answers are spread evenly over A/B/C/D (about 25% each). The old papers have a skew: B is correct about 36% of the time.
- Prices set to Premium ₹69 and Ultra ₹99 in headers, pages, FAQs, schema, chatbot knowledge, llms files and admin text. The checkout code in `premium-login.html` was already 69/99.
- Paper counts updated to 54 everywhere (listing page, premium pages, chatbot, llms files, terms).

**Review the new questions before selling them.** They were machine-checked for format and duplicates, and the numbers are computed, but nobody has proof-read each concept question. Solve 2-3 papers yourself, or have a teacher skim them.
