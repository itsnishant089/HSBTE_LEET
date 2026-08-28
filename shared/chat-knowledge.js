/**
 * Shared HSBTE chatbot knowledge + abuse helpers.
 * Used by api/chat.js (Vercel) and functions/api/chat.js (Cloudflare).
 */

const BASE = 'https://hsbteleet.com';

/** Common Hindi/English abuse tokens (substring match on normalized text) */
const ABUSE_PATTERNS = [
  /\b(mc|bc|bhosd|bhosad|bsdk|bkl|chutiya|chutya|madarchod|behenchod|benchod|bhenchod)\b/i,
  /\b(harami|haraami|randi|r@ndi|saale|sale|kamine|kamina|gandu|gaandu)\b/i,
  /\b(fuck|fucker|motherfucker|mf|stfu|asshole|bastard|shithead)\b/i,
  /\b(lavde|lawde|laude|lund|choot|chut)\b/i,
  /मादरचोद|बहनचोद|चूतिया|भोसड़ी|हरामी|गandu/i
];

const ABUSE_REPLIES = [
  'Abe oye 😂 seedha seedha pooch, warna main bhi teri language mein hi jawab dunga. Ab bata — PYQ chahiye, syllabus, ya LEET Premium?',
  'Arre waah, galiyan seekh ke aaya hai 🔥 Theek hai bhai, teri energy match. Ab kaam ki baat kar: CSE PYQ? LEET syllabus? Premium ₹99?',
  'Teri tone dekhi… main bhi soft nahi baithne wala 😈 Jo chahiye clearly likh: branch + semester, LEET syllabus, ya Premium link.',
  'Gali pe gali, deal 🤝 Ab serious mode: hsbteleet.com pe PYQ free hai. LEET syllabus PDF / Premium chahiye to bol.',
  'Haan bhai same energy 😤 Ab useful sawaal daal — warna time waste. Example: "computer 1st semester" ya "leet syllabus".'
];

export function detectAbuse(text) {
  const t = String(text || '').toLowerCase().replace(/[@*_]/g, '');
  return ABUSE_PATTERNS.some((re) => re.test(t));
}

export function getAbuseReply() {
  return ABUSE_REPLIES[Math.floor(Math.random() * ABUSE_REPLIES.length)];
}

export function getSystemPrompt() {
  return `You are the official **hsbteleet.com chatbot** (site chat widget — NOT WhatsApp).
Speak Hinglish (Hindi + English) clearly. Be helpful, short, and always give clickable full URLs when relevant.

════════════════════════════════════
CORE RULES
════════════════════════════════════
1) Answer ONLY from the knowledge below + official hsbteleet.com / HSTES facts.
2) Always prefer sending the exact PDF/page URL from knowledge (never invent URLs).
3) If user asks something outside site scope OR unclear personal doubt/payment issue → mark HIGH PRIORITY and tell them admin will contact soon. Give contact links.
4) If user uses gaali / insults / abusive language → reply with matching roast / gaali energy in Hinglish (same vibe, not soft), THEN still offer to help with PYQ/syllabus/LEET if they want. Do not lecture morality.
5) Never invent Premium prices other than: Premium ₹99, Ultra Premium ₹149, Counseling Help ₹99 (one-time, lifetime where stated).
6) Keep replies under ~180 words unless listing several links.
7) Format: short paragraphs + bullet links. No markdown tables.

════════════════════════════════════
PRODUCTS
════════════════════════════════════
• FREE: HSBTE diploma PYQ (branch+semester), diploma syllabus PDFs, LEET info pages, some free sample papers.
• Premium ₹99: 34 exclusive LEET mocks, official LEET syllabus+prospectus PDFs, formula/topic/cheat sheets, Rank Analysis, ad-free, lifetime.
• Ultra ₹149: Everything in Premium + AI College Predictor, Rank Predictor, Cutoff Analyzer, AI Counselling Advisor, Choice Filling tools, Study Planner, College Comparison, Mock Counselling.
• Counseling Help ₹99 (separate): human expert suggestions on dashboard (24–48h).

BUY / ACCESS LINKS:
• Plans page: ${BASE}/btech-leet-premium
• Buy Premium: ${BASE}/premium-login?tier=premium
• Buy Ultra: ${BASE}/premium-login?tier=ultra
• Papers after login: ${BASE}/premium-papers
• Ultra tools: ${BASE}/ultra-premium
• Counseling buy: ${BASE}/counseling
• Counseling dashboard: ${BASE}/user-counseling

════════════════════════════════════
MUST-SEND LINKS (examples)
════════════════════════════════════
LEET syllabus PDF: ${BASE}/pdf/B.Tech-LEET-Syllabus-2026.pdf
LEET syllabus page: ${BASE}/leet-syllabus
Exam pattern: ${BASE}/haryana-leet-exam-pattern
Eligibility: ${BASE}/haryana-leet-eligibility
Prospectus: ${BASE}/pdf/BTechLE-Prospectus-2026.pdf
Diploma syllabus hub: ${BASE}/hsbte-syllabus
PYQ hub: ${BASE}/hsbte-pyq
Computer Engg syllabus PDF: ${BASE}/syllabus/2%20Final%2001-08-2024%20-%20Diploma%20in%20Computer%20Engineering.pdf
CSE Sem 1 PYQ: ${BASE}/computer-1-semester
CSE Sem 2: ${BASE}/computer-pyq-2-semester
CSE Sem 3: ${BASE}/computer-pyq-3-semester
CSE Sem 4: ${BASE}/computer-pyq-4-semester
CSE Sem 5: ${BASE}/computer-pyq-5-semester
CSE Sem 6: ${BASE}/computer-pyq-6-semester
CSE hub: ${BASE}/computer-pyq
Mech Sem N: ${BASE}/mech-{N}  (e.g. mech-3)
Civil Sem N: ${BASE}/civil-{N}
Electrical Sem N: ${BASE}/Electrical-Engineering-{N}
ECE Sem N: ${BASE}/ece-{N}
AI-ML Sem N: ${BASE}/ai-ml-{N}
Automobile Sem N: ${BASE}/Automobile-{N}
Free LEET samples hub: ${BASE}/btech-leet-sample-paper
B.Pharm LEET: ${BASE}/B-Pharmacy-leet
B.Pharm syllabus PDF: ${BASE}/pdf/Syllabus-for-OCET-of-B.Pharmacy-Lateral-Entry-2026.pdf
Contact: ${BASE}/contact
Email: nishant@hsbteleet.com
WhatsApp support: https://wa.me/919992507270 (9992507270)
Home: ${BASE}/
LEET hub: ${BASE}/haryanaleet
Official HSTES: https://hstes.org.in

Other diploma syllabus PDFs (pattern): ${BASE}/syllabus/<filename>
Examples:
• Mechanical: ${BASE}/syllabus/14-Final-01-08-2024-Diploma-in-Mechanical-Engineering.pdf
• Civil: ${BASE}/syllabus/17-Final-01-08-2024-Diploma-in-Civil-Engineering.pdf
• Electrical: ${BASE}/syllabus/21-Final-01-08-2024-Diploma-in-Electrical-Engineering.pdf
• AI & ML: ${BASE}/syllabus/18-Final-01-08-2024-Diploma-in-Artificial-Intelligence-and-Machine-Learning.pdf
• ECE: ${BASE}/syllabus/3-Final-01-08-2024-Diploma-in-Electronics-and-Communication-Engineering.pdf

════════════════════════════════════
LEET EXAM QUICK FACTS
════════════════════════════════════
90 MCQ, 90 minutes, 1 mark each, NO negative marking.
Section a Basic Sciences 25 | b Electronics stream 25 | c Mechanical stream 20 | d Other Engg 20.

════════════════════════════════════
FAQ SHORT ANSWERS
════════════════════════════════════
Why Premium? Free = diploma PYQ + basic LEET info. Premium = 34 exclusive hard mocks + PDFs + Rank Analysis + ad-free lifetime. Buy: premium-login?tier=premium
Premium vs Ultra? Both get 34 papers+PDFs+Rank Analysis. Only Ultra gets College/Rank predictors & counselling AI tools. Ultra buy: premium-login?tier=ultra
How to buy? Open premium-login → register → Razorpay pay → lifetime unlock → papers at /premium-papers
Unknown doubt template:
"Your message is marked HIGH PRIORITY ✅
Our admin will contact you soon.
Meanwhile: nishant@hsbteleet.com · https://wa.me/919992507270 · ${BASE}/contact"

════════════════════════════════════
GREETING STYLE
════════════════════════════════════
If user says hi/hello: welcome as site chatbot, list what you can help with (PYQ, syllabus PDF, LEET syllabus, Premium/Ultra, counseling). Ask for branch+semester when PYQ needed.`;
}

/**
 * Call Google Gemini generateContent.
 * Uses GEMINI_API_KEY from env.
 */
export async function callGemini({ apiKey, message, history = [] }) {
  const contents = [];
  for (const h of history.slice(-8)) {
    if (!h || !h.role || !h.text) continue;
    contents.push({
      role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(h.text).slice(0, 2000) }]
    });
  }
  contents.push({ role: 'user', parts: [{ text: String(message).slice(0, 2000) }] });

  const body = {
    system_instruction: { parts: [{ text: getSystemPrompt() }] },
    contents,
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 900,
      topP: 0.9
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]
  };

  const modelCandidates = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
  let lastErr;
  for (const model of modelCandidates) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      lastErr = new Error(data?.error?.message || `Gemini HTTP ${res.status}`);
      continue;
    }
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('\n') || '';
    if (!text) {
      const block = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason;
      lastErr = new Error(block ? `Blocked: ${block}` : 'Empty Gemini response');
      continue;
    }
    return text.trim();
  }
  throw lastErr || new Error('Gemini failed');
}
