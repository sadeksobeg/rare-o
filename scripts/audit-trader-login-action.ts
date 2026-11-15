import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/trader-session";
import { traderLoginSchema } from "@/lib/validation/schemas";

async function main() {
  const email = "trader@rareoud.local";
  const password = "ChangeMeNow!";
  const parsed = traderLoginSchema.safeParse({ email, password });
  console.log("parsed", parsed.success, parsed.success ? null : parsed.error.flatten());
  const trader = await prisma.traderAccount.findUnique({ where: { email } });
  console.log("trader", {
    id: trader?.id,
    status: trader?.status,
    mustChange: trader?.mustChangePassword,
  });
  if (trader) {
    console.log("verify", await verifyPassword(password, trader.passwordHash));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
