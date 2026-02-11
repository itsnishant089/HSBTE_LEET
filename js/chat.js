export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const API_KEY = process.env.GEMINI_API_KEY;

  const WEBSITE_CONTEXT = `
You are an AI assistant for HSBTE LEET & PYQ website (hsbteleet.com).

Only answer about:
HSBTE, PYQ, LEET, diploma, semesters, syllabus, exam papers.
If unrelated, say:
"I am not trained for this task. I can only help with HSBTE PYQ and LEET."
`;

  try {

    const userMessage = req.body.message;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: WEBSITE_CONTEXT + "\nUser: " + userMessage
            }]
          }]
        })
      }
    );

    const data = await response.json();

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text
      || "Please try again.";

    res.status(200).json({ reply });

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
