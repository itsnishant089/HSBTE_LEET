document.addEventListener("partialsLoaded", initChatbot);

function initChatbot() {

  const toggleBtn = document.getElementById("robot-chatbot");
  const chatBox = document.getElementById("chatbot-box");
  const closeBtn = document.getElementById("chatbot-close");
  const sendBtn = document.getElementById("chatbot-send");
  const input = document.getElementById("chatbot-text");
  const messages = document.getElementById("chatbot-messages");

  // Stop if chatbot not loaded
  if (!chatBox || !messages) return;

  /* ===== DEVICE CHECK ===== */
  const isMobile = () => window.innerWidth <= 768;

  /* ===== INITIAL STATE ===== */
  if (!isMobile()) {
    chatBox.style.display = "flex";   // Desktop auto open
  } else {
    chatBox.style.display = "none";   // Mobile closed
  }

  /* ===== OPEN BUTTON ===== */
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      chatBox.style.display = "flex";
      scrollToBottom();
    };
  }

  /* ===== CLOSE BUTTON ===== */
  if (closeBtn) {
    closeBtn.onclick = () => {
      chatBox.style.display = "none";
    };
  }

  /* ===== ADD MESSAGE ===== */
  function addMessage(text, type, typing = false) {

    const div = document.createElement("div");
    div.className = "chatbot-msg " + type;
    messages.appendChild(div);

    if (!typing) {
      div.textContent = text;
      scrollToBottom();
      return;
    }

    let i = 0;
    const speed = 15;

    (function typeEffect() {
      if (i < text.length) {
        div.textContent += text.charAt(i++);
        scrollToBottom();
        setTimeout(typeEffect, speed);
      }
    })();
  }

  /* ===== SCROLL HELPER ===== */
  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  /* ===== SEND MESSAGE ===== */
  async function sendMessage() {

    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    try {

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      if (!res.ok) throw new Error("Network error");

      const data = await res.json();

      addMessage(data.reply || "Try again 🙂", "bot", true);

    } catch (error) {
      console.error("Chat error:", error);
      addMessage("⚠ Server error. Please try again.", "bot", true);
    }
  }

  /* ===== EVENTS ===== */
  if (sendBtn) sendBtn.onclick = sendMessage;

  if (input) {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") sendMessage();
    });
  }

}
