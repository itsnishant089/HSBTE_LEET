/**
 * translate.js - Handles Google Translate integration with better error handling.
 */

(function() {
  // Callback for Google Translate
  window.googleTranslateElementInit = function() {
    try {
      new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,hi',
        autoDisplay: false,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');
    } catch (err) {
      console.warn("Google Translate init failed:", err);
    }
  };

  function loadTranslateScript() {
    if (document.getElementById("google-translate-script")) return;
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.defer = true;
    script.onerror = () => console.warn("Google Translate script failed to load");
    document.body.appendChild(script);
  }

  // Load when idle or after content is ready to prioritize main content
  if (window.requestIdleCallback) {
    window.requestIdleCallback(loadTranslateScript);
  } else {
    window.addEventListener('load', loadTranslateScript);
  }
})();