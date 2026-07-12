# HSBTE PYQ & Haryana LEET 2027 Hub

![HSBTE PYQ Banner](image/hsbte-pyq.webp)

**HSBTE PYQ** is the ultimate, free digital resource platform designed specifically for Haryana Polytechnic students and lateral entry aspirants. The platform provides comprehensive access to Previous Year Question Papers (PYQs), LEET sample papers, interactive college comparison tools, and detailed admission analytics for the 2027 academic session.

🔗 **Live Website**: [hsbteleet.com](https://hsbteleet.com/)

---

## 🎯 Project Overview

This project solves the massive accessibility problem of finding organized, high-quality past exam papers for the Haryana State Board of Technical Education (HSBTE) and preparation material for the Haryana Lateral Entry Entrance Test (LEET). 

It is built as a highly optimized, SEO-focused, statically generated web application that serves thousands of PDFs instantly across various devices.

### Key Offerings
- **Branch-Wise & Semester-Wise PYQs**: Curated question papers for 10+ diploma branches (Computer, Civil, Mechanical, Electrical, Electronics, AI-ML, Food Tech, Architecture, etc.) covering Semesters 1 through 6.
- **Haryana LEET 2027 Preparation**: Dedicated hubs for B.Tech and B.Pharmacy LEET, featuring official sample papers, syllabus PDFs, exam blueprints, and registration timelines.
- **Data-Driven Tools**: Interactive `College Comparison` and `Cutoff Analytics` tools to help students make informed admission decisions for top universities (YMCA, DCRUST, GJU, etc.).
- **Premium Services**: Affordable tiered access (Premium ₹49, Ultra Premium ₹79, Counseling Help ₹49) for exclusive study plans, advanced mock tests, and personalized guidance.

---

## 🏗️ Technical Architecture & Stack

The platform is engineered for lightning-fast performance, maximum SEO crawlability, and edge-level caching.

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (No heavy frameworks, ensuring 100/100 Core Web Vitals).
- **Component System**: Custom vanilla JS-based template inclusion (`include.js`) for modular `partials/` (Header, Footer, Navigation).
- **Search & Interactivity**: Client-side instant search (`search.js`), AI-driven Chatbot assistant (`chatbot.js`), and native Google Translate integration (`translate.js`).
- **Monetization Engine**: Custom AdSense logic (`ads.js`) with a built-in 5-second countdown interstitial download page (`download.html`) for all PDF access, maximizing ad impressions while maintaining user experience.
- **Deployment & Routing**: Hosted on **Vercel** with a robust `vercel.json` configuration for:
  - Clean URLs (rewriting `/html/page.html` to `/page`).
  - Strict security headers (X-Frame-Options, X-XSS-Protection, Referrer-Policy).
  - Aggressive cache-control for static assets (CSS/JS/Images) and `stale-while-revalidate` for HTML pages.
- **Alternative Edge**: Configured for Cloudflare Workers (`wrangler.toml`, `_headers`, `_redirects`).

---

## 📁 Project Structure

```text
HSBTE_LEET/
├── api/ & functions/  # Serverless endpoints for premium logic and dynamic routing
├── css/               # Global and component-specific stylesheets (main.css)
├── html/              # 230+ static HTML pages (Branch pages, LEET, Tools, Interstitial)
├── image/             # Highly optimized WebP assets and UI icons
├── js/                # Core application logic
│   ├── ads.js         # Auto-injects AdSense, intercepts PDF clicks for the download timer
│   ├── chatbot.js     # Floating AI assistant logic
│   ├── include.js     # Dynamically fetches and renders HTML partials
│   ├── main.js        # Global UI state (modals, mobile menu, dark mode)
│   ├── search.js      # Fuzzy search across branches and topics
│   └── translate.js   # Google Translate configuration
├── paper/ & pdf/      # Vast repository of organized PDF question papers
├── partials/          # Reusable HTML snippets (header.html, footer.html, chatbot.html)
├── syllabus/          # Downloadable syllabus PDFs
├── vercel.json        # Vercel deployment, routing, and header configuration
├── sitemap.xml        # Auto-generated sitemap covering all rewritten clean URLs
├── robots.txt         # Crawler instructions allowing indexation of core content
└── index.html         # High-converting SEO-optimized landing page
```

---

## 🚀 SEO & Discoverability Strategy

The platform relies entirely on organic search traffic, making SEO the most critical component of the codebase:
- **Yearly Optimization**: All Meta Titles, Descriptions, Open Graph tags, Twitter Cards, and Keywords are dynamically shifted to target the current academic year (e.g., **2027**).
- **Semantic HTML & JSON-LD**: Extensive use of structured data including `WebSite`, `Organization`, `BreadcrumbList`, `Article`, and `FAQPage` schemas to win Google Rich Snippets.
- **Targeted Landing Pages**: Specific SEO clusters like `/btech-leet-key-dates` and `/b-pharmacy-leet-key-dates` built to capture high-intent search queries.
- **LCP & Font Optimization**: Preloading critical assets (Hero images, Web Fonts) to guarantee instant first-contentful paint.

---

## 💸 Monetization Model

1. **Google AdSense**: Auto-ads strategically placed across high-traffic zones (Hero, In-article, Sticky footer).
2. **Interstitial Download Flow**: When a user clicks any PYQ PDF link, `ads.js` intercepts the click and routes them to `download.html`. The user waits through a secure 5-second countdown surrounded by AdSense slots before the final file download triggers.
3. **Direct Sales**: Upselling study materials and counseling directly via the Premium hub.

---

## 👨‍💻 Development & Maintenance

**To run locally:**
Since the site uses fetch API for `partials/` and ES modules, it must be run on a local web server (opening `index.html` directly via `file://` will cause CORS errors for partials).

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

Navigate to `http://localhost:8000` to view the site.

**Adding New Papers:**
1. Drop the new PDFs into the respective `paper/QP-[SESSION]/` directory.
2. Add the `<a class="semester-subject-card" href="...">` link in the corresponding branch's HTML file in the `html/` directory. The global `ads.js` script will automatically wrap it in the monetization flow.

---
*Maintained and developed by Nishant.*
