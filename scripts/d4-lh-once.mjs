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

const chrome = await chromeLauncher.launch({
  chromeFlags: [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
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
