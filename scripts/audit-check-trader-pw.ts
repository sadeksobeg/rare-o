import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

async function main() {
  const t = await prisma.traderAccount.findUnique({
    where: { email: "trader@rareoud.local" },
  });
  console.log({
    found: !!t,
    mustChange: t?.mustChangePassword,
    status: t?.status,
    pwOk: t ? await bcrypt.compare("ChangeMeNow!", t.passwordHash) : false,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
