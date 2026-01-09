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

    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }]
        })
      });

      const data = await res.json();
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Try asking differently 🙂";

      addMessage(reply, "bot", true);

    } catch {
      addMessage("⚠️ Network issue", "bot", true);
    }
  }

  autoSelectModel();
  greetUser();
});
