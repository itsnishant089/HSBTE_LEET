(function () {
'use strict';
var STORAGE_KEY = 'leetPreferredStream';
var DEFAULT_STREAM = 'btech';
function getPreferredStream() {
try {
var v = localStorage.getItem(STORAGE_KEY);
if (v === 'btech' || v === 'bpharmacy') return v;
} catch (e) {
}
return DEFAULT_STREAM;
}
function setPreferredStream(stream) {
try {
localStorage.setItem(STORAGE_KEY, stream);
} catch (e) {
}
}
function applyStream(stream) {
var buttons = document.querySelectorAll('[data-leet-toggle] [data-stream-select]');
buttons.forEach(function (btn) {
var s = btn.getAttribute('data-stream-select');
if (s === stream) {
btn.classList.add('leet-stream-active');
btn.setAttribute('aria-pressed', 'true');
} else {
btn.classList.remove('leet-stream-active');
btn.setAttribute('aria-pressed', 'false');
}
});
var blocks = document.querySelectorAll('[data-leet-stream]');
blocks.forEach(function (el) {
var s = el.getAttribute('data-leet-stream');
if (s === stream) {
el.style.display = '';
} else {
el.style.display = 'none';
}
});
}
function initToggle() {
var containers = document.querySelectorAll('[data-leet-toggle]');
if (!containers.length) return;
var currentStream = getPreferredStream();
containers.forEach(function (container) {
var buttons = container.querySelectorAll('[data-stream-select]');
buttons.forEach(function (btn) {
if (btn.__leetBound) return;
btn.__leetBound = true;
btn.addEventListener('click', function (e) {
e.preventDefault();
var stream = btn.getAttribute('data-stream-select');
if (stream !== 'btech' && stream !== 'bpharmacy') return;
setPreferredStream(stream);
applyStream(stream);
});
});
});
applyStream(currentStream);
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', initToggle);
} else {
initToggle();
}
})();