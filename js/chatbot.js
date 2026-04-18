document.addEventListener("partialsLoaded", initChatbot);

function initChatbot() {
  const toggleBtn = document.getElementById("robot-chatbot");
  const chatBox   = document.getElementById("chatbot-box");
  const closeBtn  = document.getElementById("chatbot-close");
  const sendBtn   = document.getElementById("chatbot-send");
  const input     = document.getElementById("chatbot-text");
  const messages  = document.getElementById("chatbot-messages");

  if (!chatBox || !messages || !input) return;

  // ── Client-side cache (sessionStorage) ──────────────────────────────────
  const CHAT_CACHE_KEY = "chatbot_cache_v1";
  const CHAT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  function getCachedReply(text) {
    try {
      const store = JSON.parse(sessionStorage.getItem(CHAT_CACHE_KEY) || "{}");
      const entry = store[text.toLowerCase()];
      if (entry && Date.now() - entry.ts < CHAT_CACHE_TTL) return entry.reply;
    } catch (_) {}
    return null;
  }

  function setCachedReply(text, reply) {
    try {
      const store = JSON.parse(sessionStorage.getItem(CHAT_CACHE_KEY) || "{}");
      store[text.toLowerCase()] = { reply, ts: Date.now() };
      // Prune if too many entries (>40)
      const keys = Object.keys(store);
      if (keys.length > 40) {
        keys.sort((a, b) => store[a].ts - store[b].ts)
            .slice(0, 10)
            .forEach(k => delete store[k]);
      }
      sessionStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(store));
    } catch (_) {}
  }

  // ── Client-side rate limiter ─────────────────────────────────────────────
  const RATE_WINDOW_MS  = 60 * 1000; // 1 minute window
  const RATE_LIMIT      = 8;         // max 8 real API calls per minute
  let recentRequests    = [];        // timestamps of non-cached requests

  function isClientRateLimited() {
    const now = Date.now();
    recentRequests = recentRequests.filter(t => now - t < RATE_WINDOW_MS);
    return recentRequests.length >= RATE_LIMIT;
  }

  function recordRequest() {
    recentRequests.push(Date.now());
  }

  // ── UI helpers ───────────────────────────────────────────────────────────
  const mobileQuery = window.matchMedia("(max-width: 768px)");
  const isMobile = () => mobileQuery.matches;

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messages.scrollTop = messages.scrollHeight;
    });
  }

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
    function typeEffect() {
      if (i < text.length) {
        div.textContent += text.charAt(i);
        i++;
        scrollToBottom();
        setTimeout(typeEffect, speed);
      }
    }
    typeEffect();
  }

  function greetUser() {
    if (sessionStorage.getItem("chatGreetingShown")) return;
    const greetingText =
      `👋 Hey! I'm your HSBTE AI Assistant.\nWhat can I help you with today?\n• PYQ & syllabus\n• LEET guidance\n• Results & exams`;
    addMessage(greetingText, "bot", true);
    sessionStorage.setItem("chatGreetingShown", "true");
  }

  // ── Initial state ────────────────────────────────────────────────────────
  if (!isMobile() && !sessionStorage.getItem("chatAutoOpened")) {
    chatBox.style.display = "flex";
    greetUser();
    sessionStorage.setItem("chatAutoOpened", "true");
  } else {
    chatBox.style.display = "none";
  }

  if (toggleBtn) {
    toggleBtn.onclick = () => {
      const isOpen = chatBox.style.display === "flex";
      if (isOpen) {
        chatBox.style.display = "none";
      } else {
        chatBox.style.display = "flex";
        greetUser();
        scrollToBottom();
      }
    };
  }

  if (closeBtn) {
    closeBtn.onclick = () => { chatBox.style.display = "none"; };
  }

  // ── Send message ─────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    // Length guard
    if (text.length > 500) {
      addMessage("⚠️ Message too long. Please keep it under 500 characters.", "bot");
      return;
    }

    addMessage(text, "user");
    input.value = "";

    // 1. Try client-side cache first (free, instant)
    const cached = getCachedReply(text);
    if (cached) {
      addMessage(cached, "bot", true);
      return;
    }

    // 2. Client-side rate limit check
    if (isClientRateLimited()) {
      addMessage("⏳ You're sending messages too fast. Please wait a moment.", "bot");
      return;
    }

    // 3. Show thinking indicator
    const thinkingDiv = document.createElement("div");
    thinkingDiv.className = "chatbot-msg bot";
    thinkingDiv.textContent = "⏳ Thinking...";
    messages.appendChild(thinkingDiv);
    scrollToBottom();

    recordRequest();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      if (messages.contains(thinkingDiv)) messages.removeChild(thinkingDiv);

      if (res.status === 429) {
        addMessage("⏳ Too many requests. Please wait a moment before asking again.", "bot");
        return;
      }

      const data = await res.json();
      console.log("Chatbot Response:", data); // Helpful for debugging

      if (!res.ok) {
        addMessage(data.reply || "🤖 Assistant is in beta version. Please try again later!", "bot");
        return;
      }

      // Final check for the reply property
      const reply = data.reply || (data.candidates && data.candidates[0]?.content?.parts[0]?.text) || "No reply received.";
      
      setCachedReply(text, reply);      // store in client cache
      addMessage(reply, "bot", true);

    } catch (error) {
      console.error("Chatbot fetch error:", error);
      if (messages.contains(thinkingDiv)) messages.removeChild(thinkingDiv);
      addMessage("🤖 Assistant is in beta version. Please try again later!", "bot");
    }
  }


  if (sendBtn) sendBtn.onclick = sendMessage;

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
}