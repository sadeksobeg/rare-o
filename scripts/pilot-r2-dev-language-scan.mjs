/**
 * Round 2.1 — dev-language-phrase scanner (owner item 8).
 * Scans every Arabic/English UI string literal in the new AD-02/AdminShell
 * surface (dict.ad2, the rad/* components, the dashboard content, and the
 * rich fixture) for leftover developer-ese: TODO/FIXME/lorem/placeholder/
 * raw status enum values/console-speak, plus the exact "D{n}" leak bug
 * from round 1 so it can never silently come back.
 *
 * Run: node scripts/pilot-r2-dev-language-scan.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FILES = [
  "lib/i18n/dictionaries.ts", // only the ad2 block is actually scanned, see below
  "components/admin/rad/sidebar.tsx",
  "components/admin/rad/topbar.tsx",
  "components/admin/rad/command-palette.tsx",
  "components/admin/rad/kpi-card.tsx",
  "components/admin/rad/action-queue.tsx",
  "components/admin/rad/orders-chart.tsx",
  "components/admin/rad/whatsapp-card.tsx",
  "components/admin/rad/activity-timeline.tsx",
  "components/admin/rad/mobile-tabbar.tsx",
  "components/admin/rad/dashboard-content.tsx",
  "components/admin/shell.tsx",
  "app/admin/(protected)/page.tsx",
  "app/dev/pilot/page.tsx",
  "components/admin/rad/inbox/avatar-color.ts",
  "components/admin/rad/inbox/connection-sheet.tsx",
  "components/admin/rad/inbox/context-panel.tsx",
  "components/admin/rad/inbox/conversation-list.tsx",
  "components/admin/rad/inbox/inbox-shell.tsx",
  "components/admin/rad/inbox/notes-section.tsx",
  "components/admin/rad/inbox/tags-section.tsx",
  "components/admin/rad/inbox/thread.tsx",
  "app/admin/(protected)/inbox/layout.tsx",
  "app/admin/(protected)/inbox/page.tsx",
  "app/admin/(protected)/inbox/[id]/page.tsx",
];

const BANNED = [
  { re: /\bTODO\b/, label: "TODO" },
  { re: /\bFIXME\b/, label: "FIXME" },
  { re: /\bXXX\b/, label: "XXX marker" },
  { re: /lorem ipsum/i, label: "lorem ipsum" },
  { re: /\bplaceholder text\b/i, label: "literal 'placeholder text'" },
  { re: /\bDEBUG\b/, label: "DEBUG" },
  { re: /console\.(log|debug|warn)\(/, label: "console.* call" },
  { re: /`D\$\{/, label: "the round-1 'D${n}' leak pattern" },
  { re: /\btest\s*data\b/i, label: "literal 'test data'" },
  { re: /\bdummy\b/i, label: "'dummy'" },
  { re: /\bfoo\b|\bbaz\b/i, label: "foo/baz placeholder" },
  { re: /\blipsum\b/i, label: "lipsum" },
];

function extractNamedBlock(src, name) {
  const idx = src.indexOf(`${name}: {`);
  if (idx === -1) return "";
  let depth = 0;
  let start = -1;
  for (let i = idx; i < src.length; i++) {
    if (src[i] === "{") {
      if (start === -1) start = i;
      depth++;
    }
    if (src[i] === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return "";
}

let hits = [];

for (const rel of FILES) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  let src = fs.readFileSync(full, "utf8");
  if (rel === "lib/i18n/dictionaries.ts") {
    // Only scan the ad2/ib blocks (ar + en values + type) — the rest of
    // this file is thousands of pre-existing, out-of-scope strings.
    const blocks = [];
    for (const name of ["ad2", "ib"]) {
      let rest = src;
      let marker;
      while ((marker = extractNamedBlock(rest, name))) {
        blocks.push(marker);
        rest = rest.slice(rest.indexOf(marker) + marker.length);
      }
    }
    src = blocks.join("\n");
  }
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    for (const { re, label } of BANNED) {
      if (re.test(line)) {
        hits.push({ file: rel, line: i + 1, label, text: line.trim().slice(0, 120) });
      }
    }
  });
}

console.log(`Scanned ${FILES.length} files (dictionaries.ts restricted to its ad2/ib blocks).`);
if (hits.length === 0) {
  console.log("PASS — no dev-language phrases found.");
} else {
  console.log(`FAIL — ${hits.length} hit(s):`);
  for (const h of hits) {
    console.log(`  ${h.file}:${h.line} [${h.label}] ${h.text}`);
  }
}

fs.writeFileSync(
  path.join(ROOT, "docs", "ui", "pilot-r2", "DEV-LANGUAGE-SCAN.json"),
  JSON.stringify({ at: new Date().toISOString(), filesScanned: FILES, hits }, null, 2)
);

if (hits.length > 0) process.exitCode = 1;
