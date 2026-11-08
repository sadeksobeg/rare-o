// RARE OUD mockups — minimal AR/EN toggle, no framework.
// Markup pattern: <span data-lang="ar">نص</span><span data-lang="en" hidden>text</span>
(function () {
  function setLang(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-lang]").forEach(function (el) {
      el.hidden = el.getAttribute("data-lang") !== lang;
    });
    var btn = document.querySelector(".lang-toggle");
    if (btn) btn.textContent = lang === "ar" ? "EN" : "عربي";
    try {
      localStorage.setItem("ro-mockup-lang", lang);
    } catch (e) {}
  }
  window.roToggleLang = function () {
    var next = document.documentElement.lang === "ar" ? "en" : "ar";
    setLang(next);
  };
  var saved = "ar";
  try {
    saved = localStorage.getItem("ro-mockup-lang") || "ar";
  } catch (e) {}
  document.addEventListener("DOMContentLoaded", function () {
    setLang(saved);
  });
})();
