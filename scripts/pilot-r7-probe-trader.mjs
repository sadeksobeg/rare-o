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
const dealTraderId = "cmuv5mxxh0000epo48jlwiod0";
const t = await p.traderAccount.findUnique({
  where: { id: dealTraderId },
  select: { id: true, email: true, status: true },
});
const all = await p.traderAccount.findMany({
  select: { id: true, email: true, status: true },
  take: 10,
});
console.log(JSON.stringify({ dealOwner: t, traders: all }, null, 2));
await p.$disconnect();
