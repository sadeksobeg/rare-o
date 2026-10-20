#!/usr/bin/env node
/**
 * Regenerate machine-readable counts from ROUND-F-VERIFICATION.md and FINAL-REPORT.md.
 * Never hand-edit the COUNTS section in FINAL-REPORT.md.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const verificationPath = path.join(root, "docs/pro-readiness/ROUND-F-VERIFICATION.md");
const finalReportPath = path.join(root, "docs/pro-readiness/FINAL-REPORT.md");
const countsJsonPath = path.join(root, "docs/pro-readiness/COUNTS.json");

const BEGIN = "<!-- COUNTS:BEGIN -->";
const END = "<!-- COUNTS:END -->";

/** @param {string} line */
function splitTableRow(line) {
  const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return inner.split("|").map((c) => c.trim());
}

/** @param {string} md */
function parseVerificationCounts(md) {
  /** @type {{ PROVEN: number; UNPROVEN: number; BLOCKED: number }} */
  const counts = { PROVEN: 0, UNPROVEN: 0, BLOCKED: 0 };
  let inTable = false;

  for (const line of md.split("\n")) {
    if (line.includes("| ID |") && line.includes("| STATUS |")) {
      inTable = true;
      continue;
    }
    if (!inTable || !line.startsWith("|")) continue;
    if (/^\|\s*[-:]+/.test(line)) continue;

    const cells = splitTableRow(line);
    if (cells.length < 6) continue;
    const status = cells[5].replace(/\*+/g, "").trim();
    if (status in counts) counts[status]++;
  }

  return counts;
}

/** @param {string} md */
function parseContractCounts(md) {
  /** @type {{ PASS: number; PARTIAL: number; "OWNER-ACTION": number }} */
  const counts = { PASS: 0, PARTIAL: 0, "OWNER-ACTION": 0 };

  const start = md.indexOf("## Contract matrix");
  if (start === -1) return counts;
  const slice = md.slice(start);
  const endMatch = slice.search(/\n## [^\n]+/);
  const section = endMatch === -1 ? slice : slice.slice(0, endMatch);

  let inTable = false;
  for (const line of section.split("\n")) {
    if (line.includes("| # |") && line.includes("| Verdict |")) {
      inTable = true;
      continue;
    }
    if (!inTable || !line.startsWith("|")) continue;
    if (/^\|\s*[-:]+/.test(line)) continue;

    const cells = splitTableRow(line);
    if (cells.length < 3) continue;
    const verdict = cells[2].trim();
    if (verdict === "PASS") counts.PASS++;
    else if (verdict === "PARTIAL") counts.PARTIAL++;
    else if (verdict === "OWNER-ACTION") counts["OWNER-ACTION"]++;
  }

  return counts;
}

/** @param {{ verification: object; contract: object; generatedAt: string }} payload */
function formatCountsMarkdown(payload) {
  const v = payload.verification;
  const c = payload.contract;
  const vTotal = v.PROVEN + v.UNPROVEN + v.BLOCKED;
  const cTotal = c.PASS + c.PARTIAL + c["OWNER-ACTION"];

  return [
    BEGIN,
    "",
    "### Generated counts (do not edit by hand)",
    "",
    `_Updated: ${payload.generatedAt}_ · Source: \`npm run report:counts\``,
    "",
    "**ROUND-F-VERIFICATION.md** (STATUS column)",
    "",
    "| STATUS | Count |",
    "|--------|------:|",
    `| PROVEN | ${v.PROVEN} |`,
    `| UNPROVEN | ${v.UNPROVEN} |`,
    `| BLOCKED | ${v.BLOCKED} |`,
    `| **Total rows** | **${vTotal}** |`,
    "",
    "**FINAL-REPORT.md** contract matrix (Verdict column)",
    "",
    "| Verdict | Count |",
    "|---------|------:|",
    `| PASS | ${c.PASS} |`,
    `| PARTIAL | ${c.PARTIAL} |`,
    `| OWNER-ACTION | ${c["OWNER-ACTION"]} |`,
    `| **Total rows** | **${cTotal}** |`,
    "",
    END,
  ].join("\n");
}

function main() {
  const verificationMd = fs.readFileSync(verificationPath, "utf8");
  const finalReportMd = fs.readFileSync(finalReportPath, "utf8");

  const verification = parseVerificationCounts(verificationMd);
  const contract = parseContractCounts(finalReportMd);
  const generatedAt = new Date().toISOString();

  const payload = {
    generatedAt,
    verification,
    contract,
    sources: {
      verification: "docs/pro-readiness/ROUND-F-VERIFICATION.md",
      contract: "docs/pro-readiness/FINAL-REPORT.md",
    },
  };

  fs.writeFileSync(countsJsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const block = formatCountsMarkdown(payload);

  if (!finalReportMd.includes(BEGIN) || !finalReportMd.includes(END)) {
    console.error(
      `FINAL-REPORT.md must contain ${BEGIN} and ${END} markers before running this script.`,
    );
    process.exit(1);
  }

  const replaced = finalReportMd.replace(
    new RegExp(`${escapeRegExp(BEGIN)}[\\s\\S]*?${escapeRegExp(END)}`, "m"),
    block,
  );

  if (replaced === finalReportMd) {
    console.error("COUNTS block was not replaced — check markers.");
    process.exit(1);
  }

  fs.writeFileSync(finalReportPath, replaced, "utf8");

  console.log("Verification STATUS:", verification);
  console.log("Contract verdicts:", contract);
  console.log("Wrote", countsJsonPath);
}

/** @param {string} s */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main();
