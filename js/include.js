document.addEventListener("DOMContentLoaded", () => {
const includes = document.querySelectorAll("[data-include]");
if (includes.length === 0) {
document.dispatchEvent(new Event("partialsLoaded"));
return;
}
let loaded = 0;
let failed = 0;
includes.forEach(el => {
fetch(el.getAttribute("data-include"))
.then(res => {
if (!res.ok) throw new Error(`Failed to load: ${el.getAttribute("data-include")}`);
return res.text();
})
.then(data => {
el.innerHTML = data;
const scripts = el.querySelectorAll("script");
scripts.forEach(oldScript => {
const newScript = document.createElement("script");
if (oldScript.src) {
newScript.src = oldScript.src;
} else {
newScript.textContent = oldScript.textContent;
}
oldScript.parentNode.replaceChild(newScript, oldScript);
});
loaded++;
if (loaded + failed === includes.length) {
document.dispatchEvent(new Event("partialsLoaded"));
}
})
.catch(err => {
console.error("Error loading partial:", err);
failed++;
if (loaded + failed === includes.length) {
document.dispatchEvent(new Event("partialsLoaded"));
}
});
});
});