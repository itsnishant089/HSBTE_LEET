export default async function handler(req, res) {

  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error("GEMINI_API_KEY not found");
      return res.status(500).json({ reply: "API key missing." });
    }

    const message = req.body?.message;

    if (!message) {
      return res.status(400).json({ reply: "Message required." });
    }

    const CONTEXT = `
You are an AI assistant for HSBTE LEET & PYQ website.
Only answer about HSBTE, LEET, Diploma, PYQ, Syllabus.
If unrelated, say you are not trained for that.
`;

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

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", data);
      return res.status(500).json({
        reply: data?.error?.message || "Gemini API error."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(500).json({
        reply: "No response from AI."
      });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Server crash:", error);
    return res.status(500).json({
      reply: "Server error."
    });
  }
}
