#!/usr/bin/env node
/**
 * Treat handover docs as executable specs: resolve markdown links and npm scripts.
 *
 * Usage:
 *   node scripts/docs-as-tests.mjs
 *   node scripts/docs-as-tests.mjs --out docs/pro-readiness/F6-DOCS-AS-TESTS.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const handoverDir = path.join(root, "docs", "handover");

const { values } = parseArgs({
  options: {
    out: { type: "string" },
  },
});

const outPath =
  values.out || path.join(root, "docs", "pro-readiness", "F6-DOCS-AS-TESTS.json");

/** @param {string} dir */
function listMarkdownFiles(dir) {
  /** @type {string[]} */
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listMarkdownFiles(full));
    else if (ent.name.endsWith(".md")) out.push(full);
  }
  return out;
}

/** @param {string} md */
function extractMarkdownLinks(md) {
  /** @type {{ raw: string; target: string }[]} */
  const links = [];
  const re = /(?<!!)\[([^\]]*)\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    const target = m[2].trim();
    if (/^(https?:|mailto:|#)/i.test(target)) continue;
    links.push({ raw: m[0], target });
  }
  return links;
}

/** @param {string} md */
function extractNpmRunCommands(md) {
  /** @type {string[]} */
  const scripts = new Set();
  const re = /npm run ([a-z0-9:@_-]+)/gi;
  let m;
  while ((m = re.exec(md)) !== null) {
    scripts.add(m[1]);
  }
  return [...scripts];
}

/** @param {string} target @param {string} fromFile */
function resolveLinkTarget(target, fromFile) {
  const noAnchor = target.split("#")[0];
  if (!noAnchor) return null;
  if (path.isAbsolute(noAnchor)) {
    return path.join(root, noAnchor.replace(/^\//, ""));
  }
  return path.normalize(path.join(path.dirname(fromFile), noAnchor));
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const pkgScripts = pkg.scripts ?? {};

  /** @type {import('node:fs').PathLike[]} */
  const files = listMarkdownFiles(handoverDir);
  /** @type {object[]} */
  const fileReports = [];
  let linkOk = 0;
  let linkFail = 0;
  let scriptOk = 0;
  let scriptFail = 0;

  for (const file of files.sort()) {
    const rel = path.relative(root, file).replace(/\\/g, "/");
    const md = fs.readFileSync(file, "utf8");
    const links = extractMarkdownLinks(md);
    const npmScripts = extractNpmRunCommands(md);

    /** @type {object[]} */
    const linkResults = [];
    for (const { raw, target } of links) {
      const resolved = resolveLinkTarget(target, file);
      if (!resolved) {
        linkResults.push({ raw, target, ok: true, note: "anchor-only" });
        linkOk += 1;
        continue;
      }
      const exists = fs.existsSync(resolved);
      if (exists) linkOk += 1;
      else linkFail += 1;
      linkResults.push({
        raw,
        target,
        resolved: path.relative(root, resolved).replace(/\\/g, "/"),
        ok: exists,
      });
    }

    /** @type {object[]} */
    const scriptResults = [];
    for (const name of npmScripts) {
      const ok = Object.prototype.hasOwnProperty.call(pkgScripts, name);
      if (ok) scriptOk += 1;
      else scriptFail += 1;
      scriptResults.push({ script: name, ok });
    }

    fileReports.push({
      file: rel,
      links: linkResults,
      npmScripts: scriptResults,
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    scannedDir: "docs/handover",
    filesScanned: fileReports.length,
    summary: {
      links: { ok: linkOk, fail: linkFail },
      npmScripts: { ok: scriptOk, fail: scriptFail },
      pass: linkFail === 0 && scriptFail === 0,
    },
    files: fileReports,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(payload.summary, null, 2));
  console.log("Wrote", path.relative(root, outPath).replace(/\\/g, "/"));

  if (!payload.summary.pass) process.exit(1);
}

main();
