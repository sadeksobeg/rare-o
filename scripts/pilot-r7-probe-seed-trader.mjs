import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k]) process.env[k] = v;
}

const p = new PrismaClient();
const trader = await p.traderAccount.findUnique({
  where: { email: "trader@rareoud.local" },
  select: { id: true, email: true },
});
const deals = await p.dealProposal.findMany({
  where: { traderId: trader.id },
  orderBy: { updatedAt: "desc" },
  take: 5,
  select: { id: true, status: true, reference: true },
});
const ws = await p.wholesaleRequest.findMany({
  where: { traderId: trader.id },
  orderBy: { updatedAt: "desc" },
  take: 5,
  select: { id: true, status: true, reference: true },
});
console.log(JSON.stringify({ trader, deals, ws }, null, 2));
await p.$disconnect();
