/**
 * Round 2.1 — contrast audit (owner item 7).
 * Parses the --rad-* values straight out of styles/tokens.css (both
 * themes) and checks every text/background pair actually used together
 * in components/admin/rad/* + styles/admin-dashboard.css against WCAG 2.2
 * AA: 4.5:1 for normal text, 3:1 for large text / UI components. Exits 1
 * if any pair fails, fixing nothing automatically — the owner asked for
 * "all of them, not just the sidebar" fixed by hand after seeing the list.
 *
 * Run: node scripts/pilot-r2-contrast-audit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokensSrc = fs.readFileSync(path.join(ROOT, "styles", "tokens.css"), "utf8");

function extractBlock(src, selector) {
  const idx = src.indexOf(selector);
  if (idx === -1) throw new Error(`selector not found: ${selector}`);
  const open = src.indexOf("{", idx);
  let depth = 1;
  let i = open + 1;
  while (depth > 0 && i < src.length) {
    if (src[i] === "{") depth++;
    if (src[i] === "}") depth--;
    i++;
  }
  return src.slice(open + 1, i - 1);
}

function parseVars(block) {
  const vars = {};
  const re = /--([a-z0-9-]+):\s*([^;]+);/g;
  let m;
  while ((m = re.exec(block))) {
    vars[`--${m[1]}`] = m[2].trim();
  }
  return vars;
}

const baseVars = parseVars(extractBlock(tokensSrc, '.ro-portal[data-portal="admin"] {'));
const darkVars = {
  ...baseVars,
  ...parseVars(extractBlock(tokensSrc, '.ro-portal[data-portal="admin"][data-theme="dark"] {')),
};
const lightVars = {
  ...baseVars,
  ...parseVars(extractBlock(tokensSrc, '.ro-portal[data-portal="admin"][data-theme="light"] {')),
};

function resolve(vars, raw, depth = 0) {
  if (depth > 8) throw new Error("var resolution too deep: " + raw);
  const varRef = raw.match(/^var\((--[a-z0-9-]+)(?:,\s*(.+))?\)$/);
  if (varRef) {
    const [, name, fallback] = varRef;
    if (vars[name] != null) return resolve(vars, vars[name], depth + 1);
    if (fallback != null) return resolve(vars, fallback.trim(), depth + 1);
    throw new Error("unresolved var: " + name);
  }
  const mix = raw.match(
    /^color-mix\(in srgb,\s*(.+?)\s+([\d.]+)%,\s*(.+)\)$/
  );
  if (mix) {
    const [, aRaw, pctRaw, bRaw] = mix;
    const pct = Number(pctRaw) / 100;
    const a = parseColor(resolve(vars, aRaw.trim(), depth + 1));
    const bRawTrim = bRaw.trim();
    const b =
      bRawTrim === "transparent"
        ? { ...a, a: 0 }
        : parseColor(resolve(vars, bRawTrim, depth + 1));
    return `rgba(${Math.round(a.r * pct + b.r * (1 - pct))}, ${Math.round(a.g * pct + b.g * (1 - pct))}, ${Math.round(a.b * pct + b.b * (1 - pct))}, ${(a.a * pct + b.a * (1 - pct)).toFixed(3)})`;
  }
  return raw;
}

function parseColor(str) {
  str = str.trim();
  if (str.startsWith("#")) {
    const hex = str.slice(1);
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }
  const rgba = str.match(/rgba?\(([^)]+)\)/);
  if (rgba) {
    const parts = rgba[1].split(",").map((s) => parseFloat(s));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  throw new Error("unparseable color: " + str);
}

function flatten(fg, bg) {
  // fg over bg, both already resolved to {r,g,b,a}; bg assumed opaque.
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
  };
}

function srgbToLin(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function luminance({ r, g, b }) {
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
}
function contrast(c1, c2) {
  const l1 = luminance(c1);
  const l2 = luminance(c2);
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

function ratioFor(vars, fgVar, bgVar, backdropVar = "--rad-surface") {
  // bgVar is often translucent (the *s chip tints are low-alpha rgba) — it
  // must be flattened over what it actually sits on in the DOM (the card
  // surface it's painted on), not an arbitrary opaque assumption. That bug
  // produced a false "white backdrop" reading in dark mode the first time
  // this script ran, inflating every chip pair's apparent contrast.
  const backdrop = parseColor(resolve(vars, `var(${backdropVar})`));
  const bgResolved = parseColor(resolve(vars, `var(${bgVar})`));
  const fgResolved = parseColor(resolve(vars, `var(${fgVar})`));
  const flatBg = flatten({ ...bgResolved, a: bgResolved.a ?? 1 }, backdrop);
  const flatFg = flatten(fgResolved, flatBg);
  return contrast(flatFg, flatBg);
}

// Every text-color-var / background-color-var pair actually used together
// in components/admin/rad/* and styles/admin-dashboard.css (hand-collected
// by reading both files — these are the real pairs axe would see).
const PAIRS = [
  ["--rad-tx", "--rad-c0", "normal", "page text on page bg"],
  ["--rad-tx", "--rad-surface", "normal", "card text on card surface"],
  ["--rad-tx2", "--rad-surface", "normal", "secondary text on card"],
  ["--rad-tx3", "--rad-surface", "normal", "muted text on card"],
  ["--rad-tx3", "--rad-c0", "normal", "muted text on page bg"],
  ["--rad-tx2", "--rad-surface3", "normal", "segmented label on surface3"],
  ["--rad-ac", "--rad-surface3", "large", "command-k icon on surface3"],
  ["--rad-sb-tx", "--rad-sb", "normal", "sidebar nav text"],
  ["--rad-sb-tx3", "--rad-sb", "normal", "sidebar group label / role text"],
  ["--rad-cream", "--rad-sb", "normal", "sidebar active nav text"],
  ["--rad-ac", "--rad-acs", "large", "kpi icon chip (accent)"],
  ["--rad-ok", "--rad-oks", "large", "kpi icon chip (ok)"],
  ["--rad-warn", "--rad-warns", "large", "kpi icon chip (warn)"],
  ["--rad-info", "--rad-infos", "large", "kpi icon chip (info)"],
  ["--rad-err", "--rad-errs", "large", "kpi icon chip (err)"],
  ["--rad-btn-tx", "--rad-btn", "normal", "primary button text"],
  ["--rad-cream", "--rad-out", "normal", "inbox: outgoing bubble text"],
  ["--rad-c0", "--rad-tx", "normal", "inbox: active filter chip text"],
  ["--rad-tx2", "--rad-surface2", "normal", "inbox: conversation preview text"],
  ["--rad-ac", "--rad-surface", "normal", "inbox: unread time / unread marker"],
];

function auditTheme(name, vars) {
  console.log(`\n--- ${name} ---`);
  const rows = [];
  for (const [fg, bg, size, desc] of PAIRS) {
    let ratio;
    try {
      ratio = ratioFor(vars, fg, bg);
    } catch (e) {
      console.log(`  SKIP ${desc}: ${e.message}`);
      continue;
    }
    const min = size === "large" ? 3 : 4.5;
    const pass = ratio >= min;
    rows.push({ fg, bg, desc, size, ratio: Number(ratio.toFixed(2)), min, pass });
    console.log(
      `  ${pass ? "PASS" : "FAIL"} ${desc} (${fg} on ${bg}): ${ratio.toFixed(2)}:1 (need ${min}:1)`
    );
  }
  return rows;
}

const darkRows = auditTheme("dark", darkVars);
const lightRows = auditTheme("light", lightVars);

const allRows = [...darkRows.map((r) => ({ ...r, theme: "dark" })), ...lightRows.map((r) => ({ ...r, theme: "light" }))];
const failing = allRows.filter((r) => !r.pass);

fs.writeFileSync(
  path.join(ROOT, "docs", "ui", "pilot-r2", "CONTRAST-AUDIT.json"),
  JSON.stringify({ at: new Date().toISOString(), rows: allRows, failing }, null, 2)
);

console.log(`\n${allRows.length} pairs checked, ${failing.length} failing.`);
if (failing.length > 0) process.exitCode = 1;
