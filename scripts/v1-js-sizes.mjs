/**
 * Record gzip sizes of first-load JS per App Router route from a production .next.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = process.cwd();
const NEXT = path.join(ROOT, ".next");
const OUT = path.join(ROOT, "docs/visual/baseline/js-sizes.json");

function gzipBytes(buf) {
  return zlib.gzipSync(buf, { level: 9 }).length;
}

function fileSize(abs) {
  if (!fs.existsSync(abs)) return null;
  const buf = fs.readFileSync(abs);
  return { bytes: buf.length, gzip: gzipBytes(buf) };
}

const manifestPath = path.join(NEXT, "app-build-manifest.json");
if (!fs.existsSync(manifestPath)) {
  const out = {
    at: new Date().toISOString(),
    error: "no production .next/app-build-manifest.json — run next build",
    routes: {},
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log("v1-js-sizes: skipped (no production build)");
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const pages = manifest.pages || {};
const wanted = {
  home: ["/app/(storefront)/page", "/"],
  catalog: ["/app/(storefront)/catalog/page", "/catalog"],
  product: ["/app/(storefront)/product/[slug]/page", "/product/[slug]"],
  request: ["/app/(storefront)/request/page", "/request"],
  admin: ["/app/admin/(protected)/page", "/admin"],
  trader: ["/app/trader/(protected)/page", "/trader"],
};

function findFiles(keys) {
  for (const key of keys) {
    if (pages[key]) return pages[key];
  }
  const names = Object.keys(pages);
  for (const key of keys) {
    const hit = names.find((n) => n === key || n.endsWith(key) || n.includes(key));
    if (hit) return pages[hit];
  }
  return [];
}

const routes = {};
for (const [name, keys] of Object.entries(wanted)) {
  const files = findFiles(keys);
  const filesMeta = [];
  let gzip = 0;
  let bytes = 0;
  for (const rel of files) {
    const abs = path.join(NEXT, rel.replace(/^\.\.\//, "").replace(/^\//, ""));
    const alt = path.join(NEXT, rel);
    const meta = fileSize(fs.existsSync(alt) ? alt : abs);
    if (!meta) continue;
    filesMeta.push({ file: rel, ...meta });
    gzip += meta.gzip;
    bytes += meta.bytes;
  }
  routes[name] = { files: filesMeta, bytes, gzip };
}

const out = {
  at: new Date().toISOString(),
  note: "First-load files from app-build-manifest.json; gzip level 9.",
  routes,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log("v1-js-sizes: wrote", OUT);
for (const [name, row] of Object.entries(routes)) {
  console.log(`  ${name}: ${row.gzip} gz / ${row.bytes} raw (${row.files.length} files)`);
}
