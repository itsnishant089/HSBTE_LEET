document.addEventListener("partialsLoaded", initChatbot);

function initChatbot() {

  const toggleBtn = document.getElementById("robot-chatbot");
  const chatBox = document.getElementById("chatbot-box");
  const closeBtn = document.getElementById("chatbot-close");
  const sendBtn = document.getElementById("chatbot-send");
  const input = document.getElementById("chatbot-text");
  const messages = document.getElementById("chatbot-messages");

  if (!chatBox || !messages || !input) return;

  /* ===== DEVICE CHECK ===== */
  const isMobile = () => window.innerWidth <= 768;

  /* ===== INITIAL STATE ===== */
  if (!isMobile()) {
    chatBox.style.display = "flex";   // Desktop auto open
  } else {
    chatBox.style.display = "none";   // Mobile closed
  }

  /* ===== ADD MESSAGE ===== */
  function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = "chatbot-msg " + type;
    div.textContent = text;
    messages.appendChild(div);
    scrollToBottom();
  }

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  /* ===== GREETING (OLD STYLE PRELOAD) ===== */
  function greetUser() {
    if (sessionStorage.getItem("hsbteGreeted")) return;

    addMessage(
`👋 Hey! I’m your HSBTE AI Assistant.
What can I help you with today?

• PYQ & syllabus
• LEET guidance
• Results & exams`,
      "bot"
    );

    sessionStorage.setItem("hsbteGreeted", "true");
  }

  // Show greeting on desktop auto open
  if (!isMobile()) {
    greetUser();
  }

  /* ===== OPEN ===== */
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      chatBox.style.display = "flex";
      greetUser();
      scrollToBottom();
    };
  }

  /* ===== CLOSE ===== */
  if (closeBtn) {
    closeBtn.onclick = () => {
      chatBox.style.display = "none";
    };
  }

  /* ===== SEND MESSAGE ===== */
  async function sendMessage() {

    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    const thinkingMessage = document.createElement("div");
    thinkingMessage.className = "chatbot-msg bot";
    thinkingMessage.textContent = "⏳ Thinking...";
    messages.appendChild(thinkingMessage);
    scrollToBottom();

    try {

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();

      messages.removeChild(thinkingMessage);

      if (!res.ok) {
        addMessage(data.reply || "Server error.", "bot");
        return;
      }

      addMessage(data.reply || "No reply received.", "bot");

    } catch (error) {
      console.error(error);
      messages.removeChild(thinkingMessage);
      addMessage("⚠ Server error. Please try again.", "bot");
    }
  }

  /* ===== EVENTS ===== */
  if (sendBtn) sendBtn.onclick = sendMessage;

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

}
