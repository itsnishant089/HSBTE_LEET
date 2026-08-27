/**
 * Cloudflare Pages Function: functions/api/chat.js
 * Handles AI chatbot requests using OpenRouter API.
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. API Key Selection — supports OpenRouter key stored in GEMINI_API_KEY or GROQ_API_KEY
  const API_KEY = env.GEMINI_API_KEY || env.GROQ_API_KEY || "YOUR_HARDCODED_API_KEY_HERE"; 

  if (!API_KEY || API_KEY === "YOUR_HARDCODED_API_KEY_HERE") {
    return new Response(
      JSON.stringify({ 
        reply: "🤖 API Key is missing. Please set GEMINI_API_KEY in Cloudflare settings." 
      }), 
      {
        status: 200, 
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 2. Parse Request
    const { message } = await request.json();
    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ reply: "⚠️ Please enter a message." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Call OpenRouter API (OpenAI-compatible endpoint)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hsbteleet.com",
        "X-Title": "HSBTE LEET AI Assistant"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          { role: "system", content: "Assistant for HSBTE LEET. Answer about HSBTE, LEET, Diploma, Syllabus. Be concise." },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log("OpenRouter Raw Response:", JSON.stringify(data));

    if (!response.ok) {
        return new Response(
            JSON.stringify({ reply: "🤖 AI Error: " + (data.error?.message || "Unknown error") }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    }

    const text = data.choices?.[0]?.message?.content || "🤖 AI returned no answer.";

    // 5. Return Clean Response
    return new Response(JSON.stringify({ reply: text }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Chat Function Error:", err);
    return new Response(
      JSON.stringify({ reply: "🤖 Critical Error: " + err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


