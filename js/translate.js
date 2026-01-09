document.addEventListener("partialsLoaded", () => {

  // Google requires this function name
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

  // Prevent loading twice
  if (document.getElementById("google-translate-script")) return;

  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src =
    "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;

  document.body.appendChild(script);
});
