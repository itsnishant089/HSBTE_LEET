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

  if (!requestCounts[ip]) {
    requestCounts[ip] = { count: 1, time: now };
  } else {
    const timeDiff = now - requestCounts[ip].time;

    // Reset after 1 minute
    if (timeDiff > 60000) {
      requestCounts[ip] = { count: 1, time: now };
    } else {
      requestCounts[ip].count++;
    }
  }

  // Limit: 10 requests per minute
  if (requestCounts[ip].count > 10) {
    return res.status(429).json({
      reply: "⚠ Too many requests. Please wait 1 minute."
    });
  }

  const API_KEY = process.env.GEMINI_API_KEY;

  try {

    const { message } = req.body;

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

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Please try again.";

    res.status(200).json({ reply });

  } catch (error) {
    res.status(500).json({ reply: "Server error." });
  }
}
