let requestCounts = {};

export default async function handler(req, res) {

  // ===== METHOD CHECK =====
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    // ===== RATE LIMIT =====
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "unknown";

    const now = Date.now();

    if (!requestCounts[ip]) {
      requestCounts[ip] = { count: 1, time: now };
    } else {
      const diff = now - requestCounts[ip].time;

      if (diff > 60000) {
        requestCounts[ip] = { count: 1, time: now };
      } else {
        requestCounts[ip].count++;
      }
    }

    if (requestCounts[ip].count > 10) {
      return res.status(429).json({
        reply: "⚠ Too many requests. Please wait 1 minute."
      });
    }

    // ===== API KEY CHECK =====
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error("❌ GEMINI_API_KEY missing in environment variables");
      return res.status(500).json({ reply: "API key missing." });
    }

    // ===== BODY CHECK =====
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Message required." });
    }

    // ===== CONTEXT =====
    const CONTEXT = `
You are an AI assistant for HSBTE LEET & PYQ website.
Only answer about HSBTE, LEET, Diploma, PYQ, Syllabus.
If unrelated, say you are not trained for that.
`;

    // ===== GEMINI REQUEST =====
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: CONTEXT + "\nUser: " + message
                }
              ]
            }
          ]
        })
      }
    );

    const data = await geminiResponse.json();

    // ===== GEMINI ERROR HANDLING =====
    if (!geminiResponse.ok) {
      console.error("❌ Gemini API Error:", data);
      return res.status(500).json({
        reply: data?.error?.message || "Gemini API error."
      });
    }

    // ===== SAFE RESPONSE EXTRACTION =====
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error("❌ No AI response:", data);
      return res.status(500).json({
        reply: "No response from AI."
      });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("❌ Server crash:", error);
    return res.status(500).json({
      reply: "Server error. Please try again."
    });
  }
}
