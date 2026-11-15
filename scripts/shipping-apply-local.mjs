import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

execSync(
  'npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20261112120000_shipping_s1_additive/migration.sql',
  { stdio: "inherit" }
);

const p = new PrismaClient();
try {
  const n = await p.shippingCountry.count();
  console.log("OK ShippingCountry count =", n);
} catch (e) {
  console.error("VERIFY_FAIL", e.message.slice(0, 300));
  process.exit(1);
} finally {
  await p.$disconnect();
}
