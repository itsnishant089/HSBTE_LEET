<div align="center">

<!-- Animated Typing Header -->
<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=30&pause=1000&color=F0B429&center=true&vCenter=true&width=700&lines=HSBTE+LEET+Website+%F0%9F%93%9A;Free+Education+for+Haryana+Students;250%2B+Pages+of+Exam+Content;AI+Chatbot+%2B+Premium+Papers;Built+with+%E2%9D%A4%EF%B8%8F+for+Haryana" alt="Typing SVG" />

<br/>

<!-- Status badges -->
<a href="https://hsbteleet.com">
  <img src="https://img.shields.io/website?url=https%3A%2F%2Fhsbteleet.com&up_message=LIVE&up_color=00D4B4&down_color=EF4444&style=for-the-badge&logo=cloudflare&logoColor=white&label=hsbteleet.com"/>
</a>
&nbsp;
<img src="https://img.shields.io/badge/Pages-250%2B-F0B429?style=for-the-badge&logo=files&logoColor=white"/>
&nbsp;
<img src="https://img.shields.io/badge/Coverage-LEET%20%2B%20HSBTE-00D4B4?style=for-the-badge"/>
&nbsp;
<img src="https://img.shields.io/badge/AI%20Chatbot-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white"/>

<br/><br/>

<!-- Social row -->
<a href="https://hsbteleet.com"><img src="https://img.shields.io/badge/Website-hsbteleet.com-F0B429?style=flat-square&logo=googlechrome&logoColor=white"/></a>
&nbsp;
<a href="https://github.com/itsnishant089"><img src="https://img.shields.io/badge/GitHub-itsnishant089-181717?style=flat-square&logo=github&logoColor=white"/></a>
&nbsp;
<a href="https://itsnishant.com"><img src="https://img.shields.io/badge/Author-itsnishant.com-A855F7?style=flat-square&logo=person&logoColor=white"/></a>
&nbsp;
<img src="https://img.shields.io/badge/Hosted%20on-Cloudflare%20Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white"/>
&nbsp;
<img src="https://img.shields.io/badge/Payments-Razorpay-0055FA?style=flat-square&logo=razorpay&logoColor=white"/>

</div>

---

> 📖 **A high-performance educational platform for Haryana LEET & HSBTE diploma students. Features include 250+ content pages, PYQs, detailed syllabus, premium sample papers, and an AI-powered study assistant (Gemini).**

---

## 📊 At a Glance

<div align="center">

| 📄 Pages | 🎓 Coverage | 🤖 AI | 💳 Payments | ⚡ Hosting |
|:---:|:---:|:---:|:---:|:---:|
| 250+ HTML | LEET + HSBTE | Gemini Chatbot | Razorpay | Cloudflare Pages |

</div>

---

## ✨ Features

### 🆓 Free Resources
- **HSBTE Previous Year Papers**: Comprehensive collection of PYQs across 40+ diploma branches.
- **Haryana LEET Guide**: Complete preparation material for B.Tech & B.Pharmacy lateral entry.
- **Syllabus & Notes**: Structured syllabus PDFs, exam patterns, and formula cheat sheets.
- **AI Study Buddy**: Integrated chatbot powered by Google Gemini API for instant academic help.

### 💎 Premium Offerings
- **Handcrafted Sample Papers**: High-quality practice sets designed for exam success.
- **Instant Access**: Seamless Razorpay integration for quick content unlocking (₹19 - ₹29).

### 🛠️ Infrastructure & Tech
- **Edge Architecture**: Hosted on Cloudflare Pages for ultra-low latency globally.
- **PWA Ready**: Offline capabilities and home-screen installation via Service Workers.
- **Smart Analytics**: Deep insights via GA4 and Microsoft Clarity (session recording).

---

## 🛠️ Tech Stack

<div align="center">

**Frontend & Logic**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Backend & Serverless**

![Cloudflare](https://img.shields.io/badge/Cloudflare%20Functions-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

**Tools & Integrations**

![Razorpay](https://img.shields.io/badge/Razorpay-0055FA?style=for-the-badge&logo=razorpay&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini%20API-4285F4?style=for-the-badge&logo=google&logoColor=white)
![GA4](https://img.shields.io/badge/Google%20Analytics%204-E37400?style=for-the-badge&logo=googleanalytics&logoColor=white)

</div>

---

## 📁 Project Structure

```bash
📂 HSBTE_LEET/
├── index.html              # Main landing page
├── _headers                # Security & Cache headers (Cloudflare)
├── _redirects              # URL rewrites & redirects
├── wrangler.toml           # Cloudflare Pages configuration
│
├── 📂 functions/           # Cloudflare Pages Functions (Edge Backend)
│   └── 📂 api/
│       └── chat.js         # Gemini-powered AI Chatbot Logic
│
├── 📂 html/                # 250+ Educational content pages
├── 📂 css/                 # Global styles & layout modules
├── 📂 js/                  # Client-side logic (UI, Chatbot, PWA)
├── 📂 partials/            # Injectable components (Header, Chatbot UI)
│
├── 📂 paper/               # PYQ PDF database
├── 📂 pdf/                 # Syllabus & Formula sheets
├── 📂 image/               # Optimized assets (.webp)
│
├── sw.js                   # Service Worker (Offline Support)
├── sitemap.xml             # SEO Sitemap
└── robots.txt              # Search Engine Metadata
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|:---:|---|
| `GEMINI_API_KEY` | ✅ Yes | Required for the AI Chatbot backend functionality. |

**Setup:**
- **Local**: Add to `.dev.vars` for Wrangler dev mode.
- **Production**: Set in **Cloudflare Dashboard → Pages → Settings → Environment Variables**.

---

## 💻 Local Development

> 💡 The project uses **Cloudflare Pages Functions**. For full functionality (including AI Chatbot), use Wrangler.

**Step 1: Install Wrangler**
```bash
npm install -g wrangler
```

**Step 2: Run Development Server**
```bash
# Serves static assets + Edge functions
wrangler pages dev .
```

---

## 🚀 Deployment (Cloudflare Pages)

1. **Connect Repository**: Link your GitHub repo to Cloudflare Pages.
2. **Configure Build Settings**:
   - **Framework Preset**: None (Static site)
   - **Build Command**: (Leave empty)
   - **Build Output Directory**: `.`
3. **Set Secrets**: Add your `GEMINI_API_KEY` in the Environment Variables tab.
4. **Deploy**: Cloudflare will automatically deploy your site and functions on every push.

---

## 🤝 Contributing & Standards

- **Clean URLs**: New pages in `html/` are automatically mapped (e.g., `/html/syllabus.html` → `/syllabus`).
- **Modularity**: Use `partials/` for any repeating HTML elements.
- **Performance**: Compress all images to `.webp` before adding to `image/`.
- **Atomic Commits**: Keep changes focused and descriptive.

---

## 👥 Audience

| 🎓 Diploma Students | 🚀 LEET Aspirants |
|---|---|
| Haryana polytechnic students looking for semester resources and exam guidance. | Aspirants preparing for Lateral Entry into B.Tech/B.Pharmacy courses. |

---

## 📬 Contact & Links

<div align="center">

| Channel | Link |
|---|---|
| 🌐 Live Site | [hsbteleet.com](https://hsbteleet.com) |
| 👤 Developer | [itsnishant.com](https://itsnishant.com) |
| 💼 LinkedIn | [nishant-4aa891346](https://www.linkedin.com/in/nishant-4aa891346/) |
| 📞 Support | +91 7988316241 |

</div>

---

<div align="center">

<!-- Animated footer -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=F0B429,00D4B4&height=80&section=footer&animation=twinkling" width="100%"/>

**Empowering Students across Haryana 🚀**

*Free · Open · AI-Enhanced · [hsbteleet.com](https://hsbteleet.com)*

![Visitor Count](https://komarev.com/ghpvc/?username=itsnishant089&color=F0B429&style=flat-square&label=Repo+Views)

</div>
