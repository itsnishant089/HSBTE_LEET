document.addEventListener("partialsLoaded", () => {

  const toggleBtn = document.getElementById("robot-chatbot");
  const chatBox = document.getElementById("chatbot-box");
  const closeBtn = document.getElementById("chatbot-close");
  const sendBtn = document.getElementById("chatbot-send");
  const input = document.getElementById("chatbot-text");
  const messages = document.getElementById("chatbot-messages");

  if (!chatBox) return;

  /* ================= DEVICE CHECK ================= */
  function isMobile() {
    return window.innerWidth <= 768;
  }

  /* ================= AUTO OPEN ONLY DESKTOP ================= */
  if (!isMobile()) {
    chatBox.style.display = "flex";   // Desktop auto open
  } else {
    chatBox.style.display = "none";   // Mobile closed by default
  }

  /* ================= TOGGLE BUTTON ================= */
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      chatBox.style.display = "flex";
      messages.scrollTop = messages.scrollHeight;
    });
  }

  /* ================= CLOSE ================= */
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      chatBox.style.display = "none";
    });
  }

  /* ================= ADD MESSAGE ================= */
  function addMessage(text, type, typing = false) {
    const div = document.createElement("div");
    div.className = "chatbot-msg " + type;
    messages.appendChild(div);

    if (!typing) {
      div.textContent = text;
      messages.scrollTop = messages.scrollHeight;
      return;
    }

    let i = 0;
    const speed = 15;

    (function type() {
      if (i < text.length) {
        div.textContent += text.charAt(i++);
        messages.scrollTop = messages.scrollHeight;
        setTimeout(type, speed);
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

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();

      addMessage(data.reply || "Try again 🙂", "bot", true);

    } catch (err) {
      addMessage("⚠ Server error. Try again.", "bot", true);
    }
  }

  if (sendBtn) sendBtn.addEventListener("click", sendMessage);

  if (input) {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") sendMessage();
    });
  }

});
