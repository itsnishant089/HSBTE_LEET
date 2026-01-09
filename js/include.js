document.addEventListener("DOMContentLoaded", () => {
  const includes = document.querySelectorAll("[data-include]");

  let loaded = 0;

  includes.forEach(el => {
    fetch(el.getAttribute("data-include"))
      .then(res => res.text())
      .then(data => {
        el.innerHTML = data;
        loaded++;

        // when all includes are loaded
        if (loaded === includes.length) {
          document.dispatchEvent(new Event("partialsLoaded"));
        }
      });
  });
});
