import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rates = await import(pathToFileURL(path.join(ROOT, "lib/shipping/rates.ts")).href);
const resolve = await import(
  pathToFileURL(path.join(ROOT, "lib/shipping/resolve-available-methods.ts")).href
);

for (const g of rates.SYRIA_GOVERNORATES) {
  const r = resolve.resolveAvailableMethods(g.code, 20);
  console.log(
    g.code,
    r.map((m) => `${m.code}:${m.amount}`).join(" | ") || "(none)"
  );
}
console.log(
  "DE20",
  resolve
    .resolveAvailableMethods("DE", 20)
    .map((m) => `${m.code}:${m.amount}${m.currency}`)
    .join(" | ")
);
