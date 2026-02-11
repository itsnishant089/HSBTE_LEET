export default async function handler(req, res) {

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get API key from Vercel environment variable
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "API key not configured." });
  }

  try {

    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required." });
    }

    // Website context (controls AI behaviour)
    const CONTEXT = `
You are an AI assistant for HSBTE LEET & PYQ website (hsbteleet.com).

Only answer questions related to:
- HSBTE
- Haryana LEET
- Diploma
- Polytechnic
- Previous Year Question Papers (PYQ)
- Syllabus
- Semesters
- Exam patterns

If the question is unrelated, reply exactly:
"I am not trained for this task. I can only help you with HSBTE PYQ, LEET, and related educational topics."
`;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
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
                  text: CONTEXT + "\n\nUser Question: " + message
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Please try again.";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Chat API Error:", error);
    return res.status(500).json({ error: "Server error." });
  }
}

