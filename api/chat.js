/**
 * Vercel Edge Function: api/chat.js
 * Optimized for speed, low latency, and cost reduction.
 */

export const config = {
  runtime: 'edge', // Uses Vercel Edge Runtime for faster starts and lower cost
};

// Simple transient rate limiter (Edge functions are ephemeral, but this helps in hot instances)
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60000;

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "unknown";
  
  // Rate limiting (basic)
  const now = Date.now();
  const limitEntry = rateLimitMap.get(ip);
  if (limitEntry && now - limitEntry.start < RATE_LIMIT_WINDOW) {
    if (limitEntry.count >= RATE_LIMIT_MAX) {
      return new Response(JSON.stringify({ reply: "⚠️ Too many requests. Wait a minute." }), { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    limitEntry.count++;
  } else {
    rateLimitMap.set(ip, { count: 1, start: now });
  }

  try {
    const { message } = await req.json();
    if (!message || message.length > 500) {
      return new Response(JSON.stringify({ reply: "Invalid message." }), { status: 400 });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return new Response(JSON.stringify({ reply: "Server error." }), { status: 500 });
    }

    const CONTEXT = "Assistant for HSBTE LEET. Answer about HSBTE, LEET, Diploma, Syllabus. Concise only.";

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${CONTEXT}\n\nUser: ${message}` }] }],
          generationConfig: { maxOutputTokens: 250, temperature: 0.3 }
        })
      }
    );

    const data = await geminiResponse.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";

    // Performance & Optimization: Cache-Control for Edge
    // We cache the AI response for 10 minutes at the Edge level.
    // This dramatically reduces API costs if users ask common questions.
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        'X-Edge-Source': 'Vercel-Edge'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ reply: "AI encountered an error." }), { status: 500 });
  }
}
