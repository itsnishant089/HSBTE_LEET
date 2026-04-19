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

  const API_KEY = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return new Response(JSON.stringify({ reply: "🤖 API Key is missing. Please set GROQ_API_KEY." }), { status: 200 });
  }

  try {
    const { message } = await req.json();
    const CONTEXT = "Assistant for HSBTE LEET. Answer about HSBTE, LEET, Diploma, Syllabus. Concise only.";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Assistant for HSBTE LEET. Answer about HSBTE, LEET, Diploma, Syllabus. Concise only." },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log("Groq Raw Response:", JSON.stringify(data));

    if (!response.ok) {
        return new Response(
            JSON.stringify({ reply: "🤖 Groq Error: " + (data.error?.message || "Unknown error") }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    }

    const reply = data.choices?.[0]?.message?.content || "🤖 Groq returned no answer.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });


  } catch (err) {
    return new Response(JSON.stringify({ reply: "🤖 AI Assistant is currently in Beta." }), { status: 500 });
  }
}
