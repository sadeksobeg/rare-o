/**
 * One-shot recovery: clear admin TOTP so password-only login works.
 * Usage: npx tsx scripts/clear-admin-totp.ts [email]
 */
import { PrismaClient } from "@prisma/client";

const emailArg = process.argv[2]?.trim().toLowerCase();
const prisma = new PrismaClient();

async function main() {
  const where = emailArg ? { email: emailArg } : {};
  const before = await prisma.adminUser.findMany({
    where,
    select: {
      email: true,
      totpEnabledAt: true,
      totpSecretEnc: true,
    },
  });
  if (!before.length) {
    console.error(emailArg ? `No admin: ${emailArg}` : "No admin users found");
    process.exit(1);
  }
  for (const a of before) {
    console.log(
      `before: ${a.email} enabled=${Boolean(a.totpEnabledAt)} secret=${Boolean(a.totpSecretEnc)}`
    );
  }
  const result = await prisma.adminUser.updateMany({
    where,
    data: {
      totpSecretEnc: null,
      totpRecoveryHashes: "[]",
      totpEnabledAt: null,
    },
  });
  console.log(`cleared 2FA on ${result.count} admin(s)`);
  console.log("Sign in with email + password only, then re-enroll 2FA in Security settings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
