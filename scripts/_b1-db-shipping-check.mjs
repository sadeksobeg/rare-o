import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k === "DATABASE_URL") process.env[k] = v;
}

const p = new PrismaClient();
try {
  const verified = await p.shippingRate.count({ where: { verified: true } });
  const unverified = await p.shippingRate.count({ where: { verified: false } });
  const notebook = await p.shippingRate.findMany({
    where: { OR: [{ source: "NOTEBOOK" }, { verified: false }] },
    select: {
      countryCode: true,
      amount: true,
      currency: true,
      verified: true,
      source: true,
      method: { select: { code: true } },
    },
    take: 20,
  });
  let cfg = null;
  try {
    cfg = await p.shippingConfig.findFirst();
  } catch (e) {
    cfg = { error: String(e.message || e) };
  }
  console.log(
    JSON.stringify(
      {
        verified,
        unverified,
        notebook: notebook.map((r) => ({
          country: r.countryCode,
          method: r.method?.code,
          amount: r.amount,
          currency: r.currency,
          verified: r.verified,
          source: r.source,
        })),
        cfg,
      },
      null,
      2
    )
  );
} finally {
  await p.$disconnect();
}
