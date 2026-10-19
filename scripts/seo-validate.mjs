/**
 * Fetch sitemap.xml and robots.txt from BASE and print basic SEO checks.
 *
 * Usage:
 *   npm run seo:validate
 *   BASE=http://127.0.0.1:3000 npm run seo:validate
 */
import { parseArgs } from "node:util";

const { positionals } = parseArgs({ allowPositionals: true });
const base = (positionals[0] || process.env.BASE || process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);

let failed = 0;

function pass(name, detail = "") {
  console.log(`PASS: ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail) {
  failed += 1;
  console.error(`FAIL: ${name} — ${detail}`);
}

async function fetchText(path) {
  const res = await fetch(`${base}${path}`, {
    headers: { "user-agent": "rare-oud-seo-validate/1.0" },
    redirect: "follow",
  });
  const text = await res.text();
  return { res, text };
}

console.log(`seo-validate base=${base}`);

try {
  const robots = await fetchText("/robots.txt");
  if (robots.res.status !== 200) {
    fail("robots.txt status", String(robots.res.status));
  } else {
    pass("robots.txt 200");
    if (!/Sitemap:/i.test(robots.text)) {
      fail("robots Sitemap directive", "missing Sitemap:");
    } else {
      pass("robots lists sitemap");
    }
    if (!/Disallow:\s*\/admin/i.test(robots.text)) {
      fail("robots admin disallow", "expected Disallow: /admin");
    } else {
      pass("robots blocks /admin");
    }
  }

  const sitemap = await fetchText("/sitemap.xml");
  if (sitemap.res.status !== 200) {
    fail("sitemap.xml status", String(sitemap.res.status));
  } else {
    pass("sitemap.xml 200");
    const urls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    if (!urls.length) {
      fail("sitemap urls", "no <loc> entries");
    } else {
      pass("sitemap url count", String(urls.length));
    }
    const need = ["/catalog", "/privacy", "/contact"];
    for (const fragment of need) {
      if (!urls.some((u) => u.includes(fragment))) {
        fail(`sitemap contains ${fragment}`, "missing");
      } else {
        pass(`sitemap includes ${fragment}`);
      }
    }
    const withAlt = sitemap.text.includes("xhtml:link") || sitemap.text.includes("alternate");
    if (withAlt) pass("sitemap hreflang/alternate signals present");
    else fail("sitemap alternates", "no alternate/hreflang entries detected");
  }
} catch (e) {
  fail("fetch", e.message);
}

if (failed) {
  console.error(`\nseo-validate FAILED (${failed} check(s))`);
  process.exit(1);
}

console.log("\nseo-validate OK");
