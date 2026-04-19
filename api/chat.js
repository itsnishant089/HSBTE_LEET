/**
 * Vercel Edge Function: api/chat.js
 * (Legacy) Keeping for backward compatibility.
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const API_KEY = process.env.GEMINI_API_KEY || "YOUR_HARDCODED_API_KEY_HERE";

  if (!API_KEY || API_KEY === "YOUR_HARDCODED_API_KEY_HERE") {
    return new Response(JSON.stringify({ reply: "🤖 API Key is missing. Please set GEMINI_API_KEY." }), { status: 200 });
  }

  try {
    const { message } = await req.json();
    const CONTEXT = "Assistant for HSBTE LEET. Answer about HSBTE, LEET, Diploma, Syllabus. Concise only.";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${CONTEXT}\n\nUser: ${message}` }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();
    let reply = "";

    if (data.candidates && data.candidates.length > 0) {
        reply = data.candidates[0].content?.parts?.[0]?.text || "No response text found.";
    } else {
        reply = "🤖 No response received. Safety block or API limit reached.";
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });


  } catch (err) {
    return new Response(JSON.stringify({ reply: "🤖 AI Assistant is currently in Beta." }), { status: 500 });
  }
}

