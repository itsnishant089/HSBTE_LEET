# HSBTE LEET Project Info

This file explains why each folder and file is created and how the project works.

## 📁 Folders Explained

| Folder | Purpose |
| :--- | :--- |
| `functions/` | **Backend:** Contains Cloudflare Pages Functions (like the Chat API). |
| `js/` | **Logic:** Javascript files that make the site interactive. |
| `css/` | **Styles:** CSS files that make the site look beautiful. |
| `partials/` | **Components:** Shared HTML like Header and Footer. |
| `html/` | **Content:** Page-specific HTML content. |
| `pdf/`, `paper/`, `syllabus/` | **Resources:** Study materials for students. |
| `image/` | **Assets:** Images used in the project. |

## 📄 Key Files Explained

| File | Purpose |
| :--- | :--- |
| `index.html` | The main page of your website. |
| `_headers` | Commands for Cloudflare to secure your site. |
| `_redirects` | Rules for handling URL links. |
| `wrangler.toml` | Settings for Cloudflare deployment. |
| `sw.js` | Service Worker (Offline support). |

## 🤖 Chatbot Flow
1. User types in the Chatbot UI.
2. The UI sends the text to `/api/chat`.
3. The server (Cloudflare) uses your `GEMINI_API_KEY` to talk to Google AI.
4. Google AI sends a reply back.
5. The server sends that reply back to the user's screen.

*Note: For the chatbot to work, you must add the key to Cloudflare and trigger a new deployment.*
