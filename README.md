# HSBTE PYQ & Haryana LEET 2027 Hub

![HSBTE PYQ Banner](image/hsbte-pyq.webp)

**HSBTE PYQ & Haryana LEET** is the premier digital resource platform designed specifically for Haryana Polytechnic diploma students and HSTES Lateral Entry entrance exam aspirants. The platform provides comprehensive access to Previous Year Question Papers (PYQs), LEET sample papers, interactive cutoff analytics, and verified admission guidance for the academic session.

🔗 **Live Website**: [hsbteleet.com](https://hsbteleet.com/)  
👤 **Author & Maintainer**: [Nishant](https://hsbteleet.com/author/nishant)

---

## 🎯 Key Offerings

- **Branch-Wise & Semester-Wise HSBTE PYQs**: Curated question papers for 10+ polytechnic branches (Computer Science, Civil, Mechanical, Electrical, Electronics, AI-ML, Automobile, etc.) covering Semesters 1 through 6.
- **Haryana LEET Preparation Track**: Dedicated hubs for B.Tech and B.Pharmacy lateral entry, featuring syllabus breakdowns, exam patterns, cutoff trends, and tentative key dates.
- **📚 Haryana LEET Book (New)**: Comprehensive preparation textbook with 1,500+ solved practice MCQs, 10 full-length mock exams, and formula revision sheets.
- **Tiered Preparation Services**:
  - **Normal Premium (₹69)**: 54 exclusive Haryana LEET mock tests, Rank Analysis tools, and 100% ad-free experience.
  - **Ultra Premium (₹99)**: AI College Predictor, Cutoff Analyzer, Rank Predictor, and Smart Counseling Advisor.
  - **Personalized Counseling (₹99)**: 1-on-1 human expert choice-filling and college allotment guidance.

---

## 🏗️ Technical Architecture & Stack

The platform is engineered for lightning-fast performance, zero client bundle overhead, and 100/100 Core Web Vitals.

- **Core Technologies**: HTML5, Vanilla CSS3, Vanilla ES6+ JavaScript.
- **Component System**: Modular HTML partials loaded dynamically via `js/include.js` (`partials/header.html`, `partials/footer.html`, `partials/bottom-nav.html`, `partials/chatbot.html`).
- **Clean URL Architecture**: All `.html` files in `/html/` are mapped to clean routes (`/btech-leet`, `/haryanaleet`, `/haryana-leet-book`, `/hsbte-pyq`) across:
  - **Vercel**: Configured in `vercel.json` with regex rewrites and HTTP cache headers.
  - **Cloudflare Pages**: Configured via `functions/_middleware.js` and `_redirects`.
  - **Local Development**: Supported seamlessly in `dev-server.js` and `fiveserver.config.js`.
- **Structured Data (Schema.org)**: 37+ validated JSON-LD schema blocks covering `Organization`, `WebSite`, `EducationalResource`, `BreadcrumbList`, `FAQPage`, `Book`, and `Person`.

---

## 📁 Repository Structure

```text
HSBTE_LEET/
├── .editorconfig         # Code formatting consistency (UTF-8, 2 spaces)
├── .gitignore            # Clean git ignore definitions
├── package.json          # Project metadata and npm scripts
├── dev-server.js         # Production-mirroring local dev server
├── fiveserver.config.js  # Live reload config for Five Server extension
├── wrangler.toml         # Cloudflare Pages configuration
├── vercel.json           # Vercel rewrites, redirects, and headers
├── _headers              # Cloudflare / Netlify HTTP security and cache headers
├── _redirects            # Edge redirect and rewrite fallback definitions
├── robots.txt            # Search crawler directives and sitemap declaration
├── sitemap.xml           # Canonical XML sitemap for 250+ URLs
├── site.webmanifest      # PWA progressive web app manifest
├── ads.txt               # Authorized Digital Sellers configuration
├── 404.html              # Custom branded 404 page with navigation fallbacks
├── index.html            # Main platform homepage
├── api/ & functions/     # Serverless middleware and endpoints
├── css/                  # Global and component stylesheets
├── html/                 # 230+ clean HTML templates and subpages
│   ├── author-nishant.html    # Author biography & E-E-A-T credentials
│   ├── haryanaleet.html       # Primary Haryana LEET pillar guide
│   ├── haryana-leet-book.html # Haryana LEET Book landing & waitlist page
│   ├── btech-leet.html        # B.Tech Lateral Entry resource hub
│   └── hsbte-pyq.html         # Polytechnic diploma PYQ index
├── image/                # Optimized WebP assets and brand icons
├── js/                   # Frontend scripts (search, chatbot, include, analytics)
├── paper/ & pdf/         # Organized repository of examination PDF files
├── partials/             # Reusable UI fragments (header, footer, nav, bot)
├── shared/               # Shared knowledge bases and utility modules
├── syllabus/             # Official syllabus documents
└── whatsapp-bot-kit/     # WhatsApp bot assets and documentation
```

---

## 💻 Local Development

Run the clean-URL local development server (no build step required):

```bash
# Using npm
npm run dev

# Or directly with Node.js
node dev-server.js 5500
```

Open `http://localhost:5500` in your browser. All clean routes (such as `http://localhost:5500/haryanaleet` and `http://localhost:5500/haryana-leet-book`) resolve automatically.

---

## 📄 License & Attribution

Developed and maintained by **Nishant** (Creator, HSBTELEET).  
All official syllabus rules and exam guidelines referenced belong to the Haryana State Board of Technical Education (HSBTE) and Haryana State Technical Education Society (HSTES).
