import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  process.env[line.slice(0, i).trim()] = line
    .slice(i + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

const prisma = new PrismaClient();
const email = process.env.TRADER_EMAIL || "trader@rareoud.local";
const password = process.env.ADMIN_PASSWORD;
if (!password) {
  console.log("NO_ADMIN_PASS");
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
const row = await prisma.traderAccount.upsert({
  where: { email },
  update: { passwordHash: hash, status: "active" },
  create: {
    email,
    passwordHash: hash,
    displayName: "Demo Trader",
    companyName: "Demo Trading Co",
    phone: "",
    status: "active",
    adminNotes: "SH0 local fixture",
  },
});
console.log("traderReady", row.email, row.status);
await prisma.$disconnect();
