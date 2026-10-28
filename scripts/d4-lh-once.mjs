/** Single Lighthouse run → JSON on stdout. Exit 0 on success even if Chrome teardown races. */
import { createRequire } from "node:module";
import lighthouse from "lighthouse";

const require = createRequire(import.meta.url);
const chromeLauncher = require("chrome-launcher");
const url = process.argv[2];
if (!url) {
  console.error("usage: node d4-lh-once.mjs <url>");
  process.exit(2);
}

let wrote = false;
process.on("uncaughtException", (err) => {
  if (wrote) process.exit(0);
  console.error(err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  if (wrote) process.exit(0);
  console.error(err);
  process.exit(1);
});

const isProductUrl = /\/product\//.test(url);
if (isProductUrl) {
  for (let i = 0; i < 2; i += 1) {
    try {
      await fetch(url, { redirect: "follow" });
    } catch {
      /* server may be cold */
    }
  }
}

const chrome = await chromeLauncher.launch({
  chromeFlags: [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    // Without an explicit window size, Chrome launches at its own default
    // window size and Lighthouse's `screenEmulation` CDP call races against
    // that during startup. The resulting mid-measurement window resize was
    // showing up as a spurious, large CLS "shift" of the entire page (the
    // <html> root element itself growing to its final size) - a test-harness
    // artifact, not a real layout shift. Pinning the window size at launch
    // removes the race. See docs/excellence-plan/08-SECURITY-AND-OPERATIONS.md
    // and PROJECT_AUDIT.md for the investigation.
    "--window-size=390,844",
  ],
});
try {
  const result = await lighthouse(url, {
    port: chrome.port,
    output: "json",
    logLevel: "silent",
    onlyCategories: ["performance", "accessibility"],
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      disabled: false,
    },
  });
  process.stdout.write(
    JSON.stringify({
      performance: result.lhr.categories.performance?.score ?? 0,
      accessibility: result.lhr.categories.accessibility?.score ?? 0,
    })
  );
  wrote = true;
} finally {
  try {
    await chrome.kill();
  } catch {
    /* ignore */
  }
}
process.exit(wrote ? 0 : 1);
