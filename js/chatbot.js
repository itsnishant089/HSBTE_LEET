document.addEventListener("partialsLoaded", () => {

  const toggleBtn = document.getElementById("robot-chatbot");
  const chatBox = document.getElementById("chatbot-box");
  const closeBtn = document.getElementById("chatbot-close");
  const sendBtn = document.getElementById("chatbot-send");
  const input = document.getElementById("chatbot-text");
  const messages = document.getElementById("chatbot-messages");

  if (!toggleBtn || !chatBox) return;

  /* ================= MOBILE AUTO OPEN ================= */
  function isMobile() {
    return window.innerWidth <= 768;
  }

  if (isMobile()) {
    chatBox.style.display = "flex";
    toggleBtn.style.display = "none";
  }

  /* ================= OPEN / CLOSE ================= */
  toggleBtn.onclick = () => {
    chatBox.style.display = "flex";
    setTimeout(() => {
      messages.scrollTop = messages.scrollHeight;
    }, 100);
  };

  closeBtn.onclick = () => {
    if (!isMobile()) {
      chatBox.style.display = "none";
    }
  };

  /* ================= MESSAGE TYPING ================= */
  function addMessage(text, type, typing = false) {
    const div = document.createElement("div");
    div.className = "chatbot-msg " + type;
    messages.appendChild(div);

    if (!typing) {
      div.textContent = text;
      return;
    }

    let i = 0;
    const speed = 15;

    (function typeChar() {
      if (i < text.length) {
        div.textContent += text.charAt(i++);
        messages.scrollTop = messages.scrollHeight;
        setTimeout(typeChar, speed);
      }
    })();
  }

  /* ================= SEND MESSAGE ================= */
  async function sendMessage() {

    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    try {

      const res = await fetch("/js/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();
      const reply = data.reply || "Try again 🙂";

      addMessage(reply, "bot", true);

    } catch (err) {
      addMessage("⚠ Server error. Try again.", "bot", true);
    }
  }

  sendBtn.onclick = sendMessage;

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

});
