import { prisma } from "@/lib/db/prisma";

async function main() {
  const t = await prisma.traderAccount.findMany({
    take: 8,
    select: { email: true, displayName: true, phone: true, status: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(JSON.stringify(t, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
