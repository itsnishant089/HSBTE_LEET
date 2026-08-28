# Site Chatbot + Knowledge Kit (hsbteleet.com)

## What changed
Site chatbot now uses **Google Gemini** (`GEMINI_API_KEY` from environment) with the same knowledge as your FAQ + Resources sheets:

- `api/chat.js` (Vercel)
- `functions/api/chat.js` (Cloudflare Pages)
- Shared prompt: `shared/chat-knowledge.js` (+ `functions/_lib/chat-knowledge.js`)
- Frontend memory: `js/chatbot.js` sends last turns as `history`

## Env variable
Set in Cloudflare / Vercel:

```
GEMINI_API_KEY=your_google_ai_studio_key
```

Models tried in order: `gemini-2.0-flash` → `gemini-1.5-flash` → `gemini-1.5-flash-latest`

## Behaviour
1. Normal questions → Gemini + full HSBTE/LEET knowledge (PYQ URLs, syllabus PDFs, Premium ₹99 / Ultra ₹149)
2. User gaali/abuse → bot replies with matching roast energy (local, reliable)
3. Unknown / payment doubt → HIGH PRIORITY admin contact template

## Google Sheets (optional for n8n)
Still useful if you wire n8n:
- `Sheet1_FAQ_WhatsApp_Bot.csv`
- `Sheet2_All_Pages_Resources_URLs.csv`

Site chatbot does **not** need Sheets at runtime — knowledge is baked into the system prompt.

## Test locally
Ask the site chat:
- `LEET syllabus` → should return PDF link
- `CSE 1st semester` → computer-1-semester link
- `Buy Premium` → premium-login?tier=premium
- A gaali message → roast reply
