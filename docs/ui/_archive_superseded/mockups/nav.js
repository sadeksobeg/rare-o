// RARE OUD mockups — minimal dialog/drawer wiring. No animation system here;
// transitions live in shared.css (admin: opacity only, <=160ms, per PLAN.md 8.2).
(function () {
  function initDialogs() {
    document.querySelectorAll("[data-open-dialog]").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var dlg = document.getElementById(trigger.getAttribute("data-open-dialog"));
        if (!dlg) return;
        dlg.showModal();
        dlg.addEventListener("close", function restoreFocus() {
          trigger.focus();
          dlg.removeEventListener("close", restoreFocus);
        });
      });
    });
    document.querySelectorAll("dialog").forEach(function (dlg) {
      dlg.addEventListener("click", function (e) {
        if (e.target === dlg) dlg.close();
      });
      dlg.querySelectorAll("[data-close-dialog]").forEach(function (btn) {
        btn.addEventListener("click", function () { dlg.close(); });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initDialogs);
})();
