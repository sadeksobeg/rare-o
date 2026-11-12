/**
 * Shipping catalog import (idempotent).
 *   npm run shipping:import -- --dry-run   # counts only, writes nothing
 *   npm run shipping:import                # create-if-missing
 * Legacy options -> verified. The 7 notebook rates -> unverified (hidden).
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { importShippingCatalog } from "../lib/shipping/importer";
import type { NotebookSeedFile } from "../lib/shipping/catalog-seed";

const dryRun = process.argv.includes("--dry-run");
const seedPath = path.join(__dirname, "..", "docs", "shipping", "shipping-rates-seed.json");
const notebook = JSON.parse(fs.readFileSync(seedPath, "utf8")) as NotebookSeedFile;

const prisma = new PrismaClient();
importShippingCatalog(prisma, notebook, { dryRun })
  .then(async (counts) => {
    console.log(dryRun ? "DRY RUN — nothing written" : "IMPORT APPLIED");
    console.log(JSON.stringify(counts, null, 2));
    if (!dryRun) {
      const [publicRates, hidden] = await Promise.all([
        prisma.shippingRate.count({ where: { verified: true } }),
        prisma.shippingRate.count({ where: { verified: false } }),
      ]);
      console.log(`rates now: ${publicRates} verified (public), ${hidden} unverified (hidden)`);
    }
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
