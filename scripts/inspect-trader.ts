import { prisma } from "@/lib/db/prisma";

async function main() {
  const t = await prisma.traderAccount.findUnique({
    where: { email: "trader@rareoud.local" },
    select: {
      id: true,
      status: true,
      mustChangePassword: true,
      email: true,
      phone: true,
    },
  });
  console.log(JSON.stringify(t));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
