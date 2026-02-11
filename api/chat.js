let requestCounts = {};

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();

  // ===== RATE LIMIT =====
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

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ reply: "API key missing." });
  }

  try {

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Message required." });
    }

    const CONTEXT = `
You are an AI assistant for HSBTE LEET & PYQ website.
Only answer about HSBTE, LEET, Diploma, PYQ, Syllabus.
If unrelated, say you are not trained for that.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: CONTEXT + "\nUser: " + message
            }]
          }]
        })
      }
    );

    const data = await response.json();

    // ===== HANDLE GEMINI ERRORS =====
    if (!response.ok) {
      return res.status(response.status).json({
        reply: data?.error?.message || "Gemini API error."
      });
    }

    // ===== SAFE REPLY EXTRACTION =====
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(500).json({
        reply: "No response from AI."
      });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ reply: "Server error." });
  }
}
