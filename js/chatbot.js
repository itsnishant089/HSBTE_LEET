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

  /* ===== OPEN ===== */
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      chatBox.style.display = "flex";
      scrollToBottom();
    };
  }

  /* ===== CLOSE ===== */
  if (closeBtn) {
    closeBtn.onclick = () => {
      chatBox.style.display = "none";
    };
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

  /* ===== SEND MESSAGE ===== */
  async function sendMessage() {

    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    addMessage("⏳ Thinking...", "bot");

    try {

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      if (!res.ok) {
        throw new Error("Server error " + res.status);
      }

      const data = await res.json();

      // Remove "Thinking..." message
      messages.removeChild(messages.lastChild);

      addMessage(data.reply || "No reply received.", "bot");

    } catch (error) {
      console.error(error);
      messages.removeChild(messages.lastChild);
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
