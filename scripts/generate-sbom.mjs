/** Minimal CycloneDX-ish SBOM from package-lock.json */
import fs from "node:fs";
import path from "node:path";

const lock = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package-lock.json"), "utf8")
);
const components = [];
const pkgs = lock.packages || {};
for (const [pkgPath, meta] of Object.entries(pkgs)) {
  if (!pkgPath || pkgPath === "") continue;
  const name = meta.name || pkgPath.replace(/^node_modules\//, "");
  components.push({
    type: "library",
    name,
    version: meta.version || "",
    "bom-ref": `${name}@${meta.version || "0"}`,
  });
}
const bom = {
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    component: { type: "application", name: "rare-oud-platform" },
  },
  components,
};
const out = path.join(process.cwd(), "docs/pro-readiness/SBOM.cdx.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(bom, null, 2));
console.log(`SBOM wrote ${components.length} components → ${out}`);
