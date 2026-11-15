/**
 * Local/dev cleanup: unpublish + delete week3 regression gate offers
 * (title «فحص البوابة» / summary «يجب نشره» / slug reg-gate-*).
 * Safe for local DATABASE_URL only — refuse if NODE_ENV=production.
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("REFUSING: NODE_ENV=production");
    process.exit(2);
  }
  const p = new PrismaClient();
  const where = {
    OR: [
      { titleAr: { contains: "فحص البوابة" } },
      { summaryAr: { contains: "يجب نشره" } },
      { summaryEn: { contains: "must publish" } },
      { slug: { startsWith: "reg-gate-" } },
    ],
  };
  const before = await p.publicCuratedOffer.findMany({
    where,
    select: { id: true, slug: true, status: true },
  });
  const del = await p.publicCuratedOffer.deleteMany({ where });
  console.log(
    JSON.stringify({ deleted: del.count, before }, null, 2)
  );
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
