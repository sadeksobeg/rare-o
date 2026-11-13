/**
 * Prove catalog re-import + CSV export→import round-trip are idempotent
 * for the SA FAST notebook rewrite (LAND_PASSENGER_CAR+FAST → LAND_FAST_PASSENGER_CAR).
 *
 * Usage: node scripts/shipping-s2a-idempotency.mjs
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k === "DATABASE_URL") process.env[k] = v;
}

const { importShippingCatalog } = await import(
  pathToFileURL(path.join(ROOT, "lib/shipping/importer.ts")).href
);
const { exportRatesCsv, importRatesCsv } = await import(
  pathToFileURL(path.join(ROOT, "lib/shipping/admin-service.ts")).href
);

const notebook = JSON.parse(
  fs.readFileSync(path.join(ROOT, "docs/shipping/shipping-rates-seed.json"), "utf8")
);

const db = new PrismaClient();
const fail = (msg) => {
  console.error("FAIL:", msg);
  process.exitCode = 1;
};

try {
  const beforeMethods = await db.shippingMethod.count();
  const beforeRates = await db.shippingRate.count();
  const beforeNotebook = await db.shippingRate.findMany({
    where: { source: "NOTEBOOK" },
    include: { method: { select: { code: true } } },
    orderBy: [{ countryCode: "asc" }, { amount: "asc" }],
  });

  const saFast = beforeNotebook.find(
    (r) => r.countryCode === "SA" && Number(r.amount) === 100
  );
  console.log(
    "SA FAST before:",
    saFast
      ? `${saFast.method.code} amount=${saFast.amount} verified=${saFast.verified}`
      : "(missing)"
  );
  if (!saFast || saFast.method.code !== "LAND_FAST_PASSENGER_CAR") {
    fail("expected SA $100 notebook row under LAND_FAST_PASSENGER_CAR");
  }
  if (beforeNotebook.some((r) => r.verified)) {
    fail("notebook rates must stay verified=false");
  }

  const pass1 = await importShippingCatalog(db, notebook, { dryRun: false });
  const pass2 = await importShippingCatalog(db, notebook, { dryRun: false });
  console.log("import pass1", JSON.stringify(pass1));
  console.log("import pass2", JSON.stringify(pass2));

  if (
    pass2.methods.created !== 0 ||
    pass2.rates.legacyCreated !== 0 ||
    pass2.rates.notebookCreated !== 0
  ) {
    fail("second import created rows — not idempotent");
  }

  const afterMethods = await db.shippingMethod.count();
  const afterRates = await db.shippingRate.count();
  if (afterMethods !== beforeMethods || afterRates !== beforeRates) {
    fail(
      `counts changed after re-import methods ${beforeMethods}->${afterMethods} rates ${beforeRates}->${afterRates}`
    );
  }

  const landPassenger = await db.shippingMethod.count({
    where: { code: "LAND_PASSENGER_CAR" },
  });
  const landFastPassenger = await db.shippingMethod.count({
    where: { code: "LAND_FAST_PASSENGER_CAR" },
  });
  console.log("method rows LAND_PASSENGER_CAR=", landPassenger, "LAND_FAST_PASSENGER_CAR=", landFastPassenger);
  if (landPassenger !== 1 || landFastPassenger !== 1) {
    fail("expected exactly one row each for LB plain + SA fast method codes");
  }

  const csv = await exportRatesCsv(db);
  const dry = await importRatesCsv(csv, { apply: false }, "s2a-idempotency", db);
  if (!dry.ok) {
    fail(`CSV dry-run failed: ${dry.error}`);
  }
  const dryCounts = dry.data.counts;
  console.log("CSV dry-run counts", dryCounts);
  if ((dryCounts.create ?? 0) > 0 || (dryCounts.update ?? 0) > 0 || (dryCounts.error ?? 0) > 0) {
    fail("CSV dry-run expected only unchanged rows");
  }

  const applied = await importRatesCsv(csv, { apply: true }, "s2a-idempotency", db);
  if (!applied.ok) fail(`CSV apply failed: ${applied.error}`);
  console.log("CSV apply counts", applied.data.counts);
  if ((applied.data.counts.create ?? 0) > 0 || (applied.data.counts.update ?? 0) > 0) {
    fail("CSV apply mutated catalog");
  }

  const notebookAfter = await db.shippingRate.findMany({
    where: { source: "NOTEBOOK" },
    include: { method: { select: { code: true } } },
  });
  if (notebookAfter.length !== 7) fail(`expected 7 notebook rates, got ${notebookAfter.length}`);
  if (notebookAfter.some((r) => r.verified)) fail("notebook verified flipped to true");
  const saAfter = notebookAfter.find((r) => r.countryCode === "SA" && Number(r.amount) === 100);
  if (!saAfter || saAfter.method.code !== "LAND_FAST_PASSENGER_CAR") {
    fail("SA FAST method code changed after CSV round-trip");
  }

  console.log("PASS: importer + CSV round-trip idempotent; 7 notebook rates remain verified=false");
} finally {
  await db.$disconnect();
}
