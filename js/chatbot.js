document.addEventListener("partialsLoaded", () => {

  /* ================= API KEY ================= */
  const API_KEY = "AIzaSyDzQavhvQS98j375NoEPsRudxrc57H6GAA";

  /* ================= ELEMENTS ================= */
  const toggleBtn = document.getElementById("robot-chatbot");
  const chatBox = document.getElementById("chatbot-box");
  const closeBtn = document.getElementById("chatbot-close");
  const sendBtn = document.getElementById("chatbot-send");
  const input = document.getElementById("chatbot-text");
  const messages = document.getElementById("chatbot-messages");

  if (!toggleBtn || !chatBox) {
    console.error("Chatbot elements not found");
    return;
  }

  let CHAT_API_URL = null;

  /* ================= WEBSITE CONTEXT ================= */
  const WEBSITE_CONTEXT = `You are an AI assistant for HSBTE PYQ website (hsbtepyq.com). Your role is to help students with information about:

**Website Content:**
- HSBTE (Haryana State Board of Technical Education) Previous Year Question Papers (PYQ)
- Haryana LEET (Lateral Entry Engineering Test) - BTech LEET and B.Pharmacy LEET
- All branches offered by Haryana Polytechnic (HSBTE): Computer Engineering, Civil Engineering, Mechanical Engineering, Electronics & Communication (ECE), Electrical Engineering, Automobile Engineering, Chemical Engineering, Agriculture Engineering, Food Technology, D.Pharmacy, Business Management (DBM), Medical Laboratory Technology, Office Management & Computer Application, Adv. Diploma in Tool & Die, Automation & Robotics, Fashion Design, Fashion Technology, Textile Design, Textile Processing, Textile Technology, Ceramic Engineering, Architectural Assistantship, AI & Machine Learning, Finance Accounts & Auditing, Hotel Management, Instrumentation & Control, Library & Information Science, Medical Electronics, Plastic Technology

- Semesters: 1st, 2nd, 3rd, 4th, 5th, and 6th semester question papers
- Exam sessions: Jan-Feb, Jul-Aug, Dec-Jan, Jun-Jul, Nov-Dec for various years (2023, 2024, 2025)
- LEET sample papers for BTech and B.Pharmacy
- Syllabus, exam patterns, cutoffs, prospectus, key dates

**Important Guidelines:**
1. ONLY answer questions related to HSBTE, PYQ, LEET, branches, semesters, exam papers, syllabus, or related educational topics
2. For basic greetings (hi, hello, hey, good morning, etc.), respond politely and ask how you can help with HSBTE/LEET
3. If asked about topics NOT related to HSBTE, PYQ, LEET, or education (like cooking, sports, politics, general knowledge, etc.), respond: "I am not trained for this task. I can only help you with HSBTE PYQ, LEET, and related educational topics. How can I assist you with that?"
4. Be helpful, friendly, and informative about HSBTE and LEET topics
5. Guide users to find question papers, understand exam patterns, and prepare for exams

**Key Information:**
- The website provides free PDF downloads of previous year question papers
- Almost 90% of questions repeat from previous years
- Students should practice last 4-5 years' papers for best results
- LEET allows diploma students direct admission into BTech/B.Pharmacy courses`;

  /* ================= RELEVANCE CHECK ================= */
  function isRelevantQuestion(text) {
    const lowerText = text.toLowerCase();
    
    // Basic greetings - always allowed
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'namaste', 'thanks', 'thank you', 'bye', 'goodbye'];
    if (greetings.some(g => lowerText.includes(g) && lowerText.length < 30)) {
      return true;
    }
    
    // Relevant keywords
    const relevantKeywords = [
      'hsbte', 'pyq', 'previous year', 'question paper', 'leet', 'lateral entry',
      'btech', 'b.tech', 'pharmacy', 'b.pharmacy', 'diploma', 'polytechnic',
      'computer', 'civil', 'mechanical', 'ece', 'electrical', 'automobile',
      'chemical', 'agriculture', 'food tech', 'dbm', 'semester', 'exam',
      'syllabus', 'cutoff', 'prospectus', 'sample paper', 'result', 'admission',
      'haryana', 'hstes', 'tech admission', 'aicte', 'dcrust', 'ymca',
      'engineering', 'branch', 'subject', 'paper', 'download', 'pdf'
    ];
    
    return relevantKeywords.some(keyword => lowerText.includes(keyword));
  }

  /* ================= BASIC GREETING CHECK ================= */
  function isBasicGreeting(text) {
    const lowerText = text.toLowerCase().trim();
    const greetings = [
      'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
      'greetings', 'namaste', 'namaskar', 'hi there', 'hello there',
      'hey there', 'howdy', 'what\'s up', 'sup'
    ];
    
    return greetings.some(g => lowerText === g || lowerText.startsWith(g + ' ') || lowerText === g + '!');
  }

  /* ================= CHAT UI ================= */
  toggleBtn.onclick = () => {
    chatBox.style.display = "flex";
    // Scroll to bottom when opening
    setTimeout(() => {
      messages.scrollTop = messages.scrollHeight;
    }, 100);
  };
  
  closeBtn.onclick = () => {
    chatBox.style.display = "none";
  };

  sendBtn.onclick = sendMessage;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  /* ================= MESSAGE WITH TYPING ================= */
  function addMessage(text, type, typing = false) {
    const div = document.createElement("div");
    div.className = "chatbot-msg " + type;
    messages.appendChild(div);

    if (!typing) {
      div.textContent = text;
      return;
    }

    let i = 0;
    const speed = 18;

    (function typeChar() {
      if (i < text.length) {
        div.textContent += text.charAt(i++);
        messages.scrollTop = messages.scrollHeight;
        setTimeout(typeChar, speed);
      }
    })();
  }

  /* ================= AUTO SELECT MODEL ================= */
  async function autoSelectModel() {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models?key=" + API_KEY
      );
      const data = await res.json();

      const model = data.models.find(m =>
        m.supportedGenerationMethods.includes("generateContent")
      );

      CHAT_API_URL =
        `https://generativelanguage.googleapis.com/v1beta/${model.name}:generateContent?key=${API_KEY}`;

    } catch (err) {
      addMessage("⚠️ AI failed to load", "bot");
    }
  }

  /* ================= GREETING ================= */
  function greetUser() {
    if (sessionStorage.getItem("hsbteGreeted")) return;

    chatBox.style.display = "flex";

    addMessage(
`👋 Hey! I’m your HSBTE AI Assistant.
What can I help you with today?

• PYQ & syllabus  
• LEET guidance  
• Results & exams`,
"bot",
true
    );

    sessionStorage.setItem("hsbteGreeted", "true");
  }

  /* ================= SEND MESSAGE ================= */
  async function sendMessage() {
    if (!CHAT_API_URL) {
      addMessage("⏳ AI is warming up…", "bot", true);
      return;
    }

    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    // Check if question is relevant
    if (!isRelevantQuestion(text)) {
      addMessage("I am not trained for this task. I can only help you with HSBTE PYQ, LEET, and related educational topics. How can I assist you with that?", "bot", true);
      return;
    }

    // Handle basic greetings
    if (isBasicGreeting(text)) {
      addMessage("Hello! 👋 I'm here to help you with HSBTE PYQ, LEET, and related questions. What would you like to know?", "bot", true);
      return;
    }

    try {
      // Create prompt with context
      const prompt = `${WEBSITE_CONTEXT}\n\nUser Question: ${text}\n\nProvide a helpful answer based on the website content. If the question is not fully covered by the website information, say what you know and guide them to explore the website.`;

      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      const data = await res.json();
      let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Try asking differently 🙂";
      
      // Additional safety check - if reply seems off-topic, provide default response
      if (!isRelevantQuestion(reply) && reply.length > 50) {
        reply = "I can help you with HSBTE PYQ, LEET, branches, semesters, and exam-related questions. Could you please ask something specific about these topics?";
      }

      addMessage(reply, "bot", true);

    } catch (err) {
      console.error("Chatbot error:", err);
      addMessage("⚠️ Network issue. Please try again.", "bot", true);
    }
  }

  autoSelectModel();
  greetUser();
});
