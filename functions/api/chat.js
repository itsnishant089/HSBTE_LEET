/**
 * Cloudflare Pages Function: functions/api/chat.js
 * Handles AI chatbot requests using Google Gemini Pro.
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Check API Key
  const API_KEY = env.GEMINI_API_KEY;
  if (!API_KEY) {
    return new Response(
      JSON.stringify({ 
        reply: "🤖 Assistant is currently in maintenance. Please try again later!" 
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
    const CONTEXT = "Assistant for HSBTE LEET. Answer about HSBTE (Haryana State Board of Technical Education), LEET (Lateral Entry Entrance Test), Diploma, Syllabus, and Haryana Polytechnic. Be helpful, concise, and professional.";
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: `${CONTEXT}\n\nUser: ${message}` }] }
          ],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      return new Response(
        JSON.stringify({ reply: "🤖 AI is taking a short break. Try again in a minute!" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Parse Gemini Response
    const data = await response.json();
    
    // Extract text from Gemini's nested structure
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return new Response(
        JSON.stringify({ reply: "🤖 I couldn't generate a response. Could you rephrase your question?" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Return Clean Response
    return new Response(JSON.stringify({ reply: text }), {
      headers: {
        "Content-Type": "application/json",
        "X-Assistant-Version": "1.0.0"
      }
    });

  } catch (err) {
    console.error("Chat Function Error:", err);
    return new Response(
      JSON.stringify({ reply: "🤖 Something went wrong. Please try again later!" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

