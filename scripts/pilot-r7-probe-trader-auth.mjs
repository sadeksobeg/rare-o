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
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k]) process.env[k] = v;
}

const email = process.env.TRADER_EMAIL || "trader@rareoud.local";
const password = process.env.TRADER_PASSWORD || "ChangeMeNow!";
const p = new PrismaClient();
const t = await p.traderAccount.findUnique({
  where: { email },
  select: {
    id: true,
    email: true,
    status: true,
    passwordHash: true,
    mustChangePassword: true,
  },
});
const match = t ? await bcrypt.compare(password, t.passwordHash) : false;
console.log(
  JSON.stringify(
    {
      email,
      found: !!t,
      status: t?.status,
      mustChangePassword: t?.mustChangePassword,
      passwordMatches: match,
    },
    null,
    2
  )
);
await p.$disconnect();
