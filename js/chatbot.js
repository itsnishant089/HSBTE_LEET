document.addEventListener("partialsLoaded", initChatbot);
function initChatbot() {
const toggleBtn = document.getElementById("robot-chatbot");
const chatBox = document.getElementById("chatbot-box");
const closeBtn = document.getElementById("chatbot-close");
const sendBtn = document.getElementById("chatbot-send");
const input = document.getElementById("chatbot-text");
const messages = document.getElementById("chatbot-messages");
if (!chatBox || !messages || !input) return;
const isMobile = () => window.innerWidth <= 768;
function scrollToBottom() {
messages.scrollTop = messages.scrollHeight;
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
`👋 Hey! I’m your HSBTE AI Assistant.
What can I help you with today?
• PYQ & syllabus
• LEET guidance
• Results & exams`;
addMessage(greetingText, "bot", true);
sessionStorage.setItem("chatGreetingShown", "true");
}
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
closeBtn.onclick = () => {
chatBox.style.display = "none";
};
}
async function sendMessage() {
const text = input.value.trim();
if (!text) return;
addMessage(text, "user");
input.value = "";
const thinkingDiv = document.createElement("div");
thinkingDiv.className = "chatbot-msg bot";
thinkingDiv.textContent = "⏳ Thinking...";
messages.appendChild(thinkingDiv);
scrollToBottom();
try {
const res = await fetch("/api/chat", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ message: text })
});
const data = await res.json();
messages.removeChild(thinkingDiv);
if (!res.ok) {
addMessage(data.reply || "Server error.", "bot");
return;
}
addMessage(data.reply || "No reply received.", "bot", true);
} catch (error) {
console.error(error);
messages.removeChild(thinkingDiv);
addMessage("⚠ Server error. Please try again.", "bot");
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