import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();
  const rows = await p.publicCuratedOffer.findMany({
    where: {
      OR: [
        { titleAr: { contains: "فحص البوابة" } },
        { summaryAr: { contains: "يجب نشره" } },
        { slug: { startsWith: "reg-gate-" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      status: true,
      titleAr: true,
      summaryAr: true,
      publishedAt: true,
    },
  });
  console.log(JSON.stringify({ count: rows.length, rows }, null, 2));
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
