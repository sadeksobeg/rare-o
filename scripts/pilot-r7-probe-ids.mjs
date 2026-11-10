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
const [awaiting, deal, bro, ws, trader] = await Promise.all([
  p.dealProposal.findFirst({
    where: { status: "awaiting_payment" },
    select: { id: true, status: true, reference: true, traderId: true },
    orderBy: { updatedAt: "desc" },
  }),
  p.dealProposal.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true, status: true, traderId: true },
  }),
  p.brokerageRequest.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  }),
  p.wholesaleRequest.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true, traderId: true },
  }),
  p.traderAccount.findFirst({
    select: { id: true, email: true, status: true },
  }),
]);
console.log(JSON.stringify({ awaiting, deal, bro, ws, trader }, null, 2));
await p.$disconnect();
