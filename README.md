<div align="center">

<!-- Animated Typing Header -->
<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=30&pause=1000&color=F0B429&center=true&vCenter=true&width=700&lines=HSBTE+LEET+Website+%F0%9F%93%9A;Free+Education+for+Haryana+Students;250%2B+Pages+of+Exam+Content;AI+Chatbot+%2B+Premium+Papers;Built+with+%E2%9D%A4%EF%B8%8F+for+Haryana" alt="Typing SVG" />

<br/>

<!-- Status badges -->
<a href="https://hsbteleet.com">
  <img src="https://img.shields.io/website?url=https%3A%2F%2Fhsbteleet.com&up_message=LIVE&up_color=00D4B4&down_color=EF4444&style=for-the-badge&logo=vercel&logoColor=white&label=hsbteleet.com"/>
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
<img src="https://img.shields.io/badge/Hosted%20on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white"/>
&nbsp;
<img src="https://img.shields.io/badge/Payments-Razorpay-0055FA?style=flat-square&logo=razorpay&logoColor=white"/>

</div>

---

> 📖 **A free static educational platform for Haryana LEET & HSBTE diploma students — PYQs, syllabus, premium papers, AI chatbot, and more.**

---

## 📊 At a Glance

<div align="center">

| 📄 Pages | 🎓 Coverage | 🤖 AI | 💳 Payments | ⚡ Hosting |
|:---:|:---:|:---:|:---:|:---:|
| 250+ HTML | LEET + HSBTE | Gemini Chatbot | Razorpay | Vercel |

</div>

---

## ✨ Features

### 🆓 Free Features

| Feature | Description |
|---|---|
| 📁 **HSBTE PYQ Papers** | Previous year question papers grouped by session across 40+ diploma branches |
| 🎓 **Haryana LEET Resources** | Full prep material for B.Tech & B.Pharmacy lateral entry — syllabus, cutoffs, guidance |
| 📑 **Syllabus PDFs** | Structured syllabus with exam patterns and section-wise formula/cheat sheets |
| 🤖 **AI Chatbot** | On-site chatbot connected to `/api/chat`, powered by Google Gemini API |

### 💎 Premium Features

| Tier | Price | Details |
|---|---|---|
| 🔒 **Premium** | ₹19 | Gated sample papers via Razorpay |
| 👑 **Ultra Premium** | ₹29 | Full access — all sample papers |

### 📊 Platform & Analytics

| Feature | Stack |
|---|---|
| 🔐 Authentication | Supabase Auth |
| 📧 Lead Capture | EmailJS modal flow |
| 📊 Analytics | Google Analytics GA4 |
| 👁️ Session Recording | Microsoft Clarity |

---

## 🛠️ Tech Stack

<div align="center">

**Frontend**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Backend & Serverless**

![Vercel](https://img.shields.io/badge/Vercel%20Functions-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

**Payments & Communication**

![Razorpay](https://img.shields.io/badge/Razorpay-0055FA?style=for-the-badge&logo=razorpay&logoColor=white)
![EmailJS](https://img.shields.io/badge/EmailJS-F59E0B?style=for-the-badge)

**AI & Analytics**

![Gemini](https://img.shields.io/badge/Google%20Gemini%20API-4285F4?style=for-the-badge&logo=google&logoColor=white)
![GA4](https://img.shields.io/badge/Google%20Analytics%204-E37400?style=for-the-badge&logo=googleanalytics&logoColor=white)
![Clarity](https://img.shields.io/badge/Microsoft%20Clarity-0078D4?style=for-the-badge&logo=microsoft&logoColor=white)

</div>

---

## 📁 Project Structure

```
📂 hsbteleet.com/
├── index.html              ← Main landing page
│
├── 📂 html/                ← 250+ content pages
├── 📂 css/                 ← main.css + modal styles
├── 📂 js/                  ← search, chatbot, lead capture
├── 📂 partials/            ← header / footer / chatbot HTML
│
├── 📂 api/
│   └── chat.js             ← Vercel serverless chatbot (Gemini)
│
├── 📂 paper/               ← PYQ PDFs by session
├── 📂 pdf/                 ← Syllabus + formula sheets
├── 📂 image/               ← Site assets (.webp)
│
├── vercel.json             ← Rewrites + cache headers
├── sitemap.xml             ← SEO sitemap
└── robots.txt              ← SEO metadata
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|:---:|---|
| `GEMINI_API_KEY` | ✅ Yes | Powers `api/chat.js` chatbot. Without it, the chatbot returns `"API key missing."` |

Set locally in a `.env` file, or in **Vercel → Project → Settings → Environment Variables**.

---

## 💻 Local Development

> ⚠️ This is a **static-first** site — always serve through a local server, never open `index.html` directly via `file://`.

**Option 1 — Python (quick start)**
```bash
# Serve locally on port 5500
python -m http.server 5500
# Open: http://localhost:5500
```

**Option 2 — Vercel Dev (recommended — needed for `/api/chat`)**
```bash
# Install Vercel CLI
npm i -g vercel

# Run with environment variables loaded automatically
vercel dev
```

---

## 🚀 Deployment (Vercel)

**Step 1 — Import Repository**

Push to GitHub and import the repo in your [Vercel Dashboard](https://vercel.com/dashboard).

**Step 2 — Set Environment Variables**

In **Vercel → Project → Settings → Environment Variables**, add:
```
GEMINI_API_KEY = your_key_here
```

**Step 3 — Deploy**

Vercel auto-handles:
- URL rewrites from `vercel.json`
- Cache headers
- Serverless `/api/chat` function



---

## 🤝 Contributing Guidelines

| Rule | Details |
|---|---|
| 📂 **Page placement** | Keep new pages inside `html/` so clean URL rewrites keep working |
| 🔁 **Reuse partials** | Use `partials/` and shared scripts in `js/` to avoid duplication |
| 🖼️ **Image format** | Prefer `.webp` assets for performance consistency |
| 🔐 **Secret hygiene** | Review credentials and keys before public commits |
| 📦 **Asset size** | Large `paper/` and PDF assets can bloat the repo — handle with care |

---

## 👥 Who Is This For?

<div align="center">

| 🎓 Diploma / Polytechnic Students | 🚀 LEET Aspirants |
|---|---|
| Students from HSBTE-affiliated polytechnic colleges in Haryana preparing for semester exams. | Students targeting B.Tech or B.Pharmacy lateral entry through the Haryana LEET / OCET exam. |

</div>

---

## 📊 Analytics IDs

| Platform | Tracking ID |
|---|---|
| Google Analytics 4 | `G-WR1BG2HCE0` |
| Microsoft Clarity | `vesfse6uac` |

---

## 📬 Contact & Links

<div align="center">

| Channel | Link |
|---|---|
| 🌐 Project Site | [hsbteleet.com](https://hsbteleet.com) |
| 👤 Author Portfolio | [itsnishant.com](https://itsnishant.com) |
| 💼 LinkedIn | [nishant-4aa891346](https://www.linkedin.com/in/nishant-4aa891346/) |
| ⬡ GitHub | [itsnishant089](https://github.com/itsnishant089) |
| 📞 Phone | +91 7988316241 |

</div>

---

<div align="center">

<!-- Animated footer -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=F0B429,00D4B4&height=80&section=footer&animation=twinkling" width="100%"/>

**Built with ❤️ for Haryana students**

*Free · Open · For everyone · [hsbteleet.com](https://hsbteleet.com)*

![Visitor Count](https://komarev.com/ghpvc/?username=itsnishant089&color=F0B429&style=flat-square&label=Repo+Views)

</div>
