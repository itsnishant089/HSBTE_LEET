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

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({ reply: "🤖 Assistant is in beta version." }), { status: 200 });
  }

  try {
    const { message } = await req.json();
    const CONTEXT = "Assistant for HSBTE LEET. Answer about HSBTE, LEET, Diploma, Syllabus. Concise only.";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
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
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ reply: "🤖 AI Assistant is currently in Beta." }), { status: 500 });
  }
}

