/**
 * Cloudflare Pages Function: functions/api/chat.js
 * Handles AI chatbot requests using Google Gemini Pro.
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. API Key Selection
  // You can set this in Cloudflare Dashboard -> Settings -> Environment Variables
  // OR hardcode it here (NOT recommended for public repos)
  const API_KEY = env.GEMINI_API_KEY || "YOUR_HARDCODED_API_KEY_HERE"; 

  if (!API_KEY || API_KEY === "YOUR_HARDCODED_API_KEY_HERE") {
    return new Response(
      JSON.stringify({ 
        reply: "🤖 API Key is missing. Please set GEMINI_API_KEY in Cloudflare settings or the code." 
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

    // 3. Call Gemini API
    const CONTEXT = "Assistant for HSBTE LEET. Answer about HSBTE, LEET, Diploma, Syllabus. Be concise.";
    
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
    console.log("Gemini Raw Response:", JSON.stringify(data));

    if (!response.ok) {
        return new Response(
            JSON.stringify({ reply: "🤖 API Error: " + (data.error?.message || "Unknown error") }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    }

    // 4. Parse Response (Robust)
    let text = "";
    
    if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            text = candidate.content.parts[0].text;
        } else if (candidate.finishReason === "SAFETY") {
            text = "🛡️ Response blocked by AI safety filters. Try rephrasing.";
        } else {
            text = "⚠️ AI stopped responding (Reason: " + (candidate.finishReason || "unknown") + ")";
        }
    } else {
        text = "🤖 Gemini returned no answer. Check your message or try again.";
    }

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


