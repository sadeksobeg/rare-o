/** Shared helper — hide Next.js bottom-left N so it never covers chrome in shots. */
export async function hideNextDevIndicator(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-toast],
      [data-next-mark-loading],
      #__next-build-watcher {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `,
  });
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((el) => {
      el.style.setProperty("display", "none", "important");
    });
  }).catch(() => {});
}
