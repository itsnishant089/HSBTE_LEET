document.addEventListener("partialsLoaded", () => {
window.googleTranslateElementInit = function () {
new google.translate.TranslateElement(
{
pageLanguage: "en",
includedLanguages: "en,hi",
autoDisplay: false
},
"google_translate_element"
);
};
if (document.getElementById("google-translate-script")) return;
const script = document.createElement("script");
script.id = "google-translate-script";
script.src =
"https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
script.async = true;
document.body.appendChild(script);
});