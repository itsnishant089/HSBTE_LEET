/**
 * Cloudflare Pages Function: functions/api/chat.js
 * Replaces the Vercel Edge Function.
 * Runs on Cloudflare Workers runtime at the edge globally.
 *
 * Environment variable GEMINI_API_KEY must be set in:
 *   Cloudflare Dashboard → Pages → Settings → Environment Variables
 */

// Simple transient rate limiter (Workers are ephemeral, but this helps in hot instances)
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60000;

export async function onRequestPost(context) {
  const { request, env } = context;

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown";

  // Rate limiting (basic)
  const now = Date.now();
  const limitEntry = rateLimitMap.get(ip);
  if (limitEntry && now - limitEntry.start < RATE_LIMIT_WINDOW) {
    if (limitEntry.count >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({ reply: "⚠️ Too many requests. Wait a minute." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    limitEntry.count++;
  } else {
    rateLimitMap.set(ip, { count: 1, start: now });
  }

  try {
    const { message } = await request.json();
    if (!message || message.length > 500) {
      return new Response(JSON.stringify({ reply: "⚠️ Invalid message." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const API_KEY = env.GEMINI_API_KEY;
    if (!API_KEY) {
      return new Response(JSON.stringify({ 
        reply: "🤖 Assistant is in beta version. Please try again later!" 
      }), {
        status: 200, // Return 200 so its not a console error, but shows the message
        headers: { "Content-Type": "application/json" },
      });
    }

    const CONTEXT =
      "Assistant for HSBTE LEET. Answer about HSBTE, LEET, Diploma, Syllabus. Concise only.";

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: `${CONTEXT}\n\nUser: ${message}` }] },
          ],
          generationConfig: { maxOutputTokens: 250, temperature: 0.3 },
        }),
      }
    );

    if (!geminiResponse.ok) {
        return new Response(JSON.stringify({ 
            reply: "🤖 Assistant is currently in beta. Please try again later!" 
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }

    const data = await geminiResponse.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ AI received no clear answer. Try rephrasing.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store", // Disable cache while debugging
        "X-Edge-Source": "Cloudflare-Pages-v2",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ 
        reply: "🤖 AI Assistant is currently in Beta. Please try again later or use the predictor tools above!" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
