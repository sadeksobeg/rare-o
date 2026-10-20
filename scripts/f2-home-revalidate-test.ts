/**
 * F2 — homepage tagged cache: after publish + revalidateTag, discovery includes product.
 * Run: npm run test:f2-home-cache
 */
import { revalidateTag } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { getHomepageDiscoveryData } from "../lib/catalog/homepage";

const prisma = new PrismaClient();
const slug = `f2-cache-${Date.now()}`;

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL: ${msg}`);
    return;
  }
  passed += 1;
  console.log(`PASS: ${msg}`);
}

async function main() {
  const category = await prisma.category.findFirst({
    orderBy: { sortOrder: "asc" },
  });
  assert(!!category, "seed category exists");
  if (!category) {
    await prisma.$disconnect();
    process.exit(1);
  }

  const before = await getHomepageDiscoveryData();
  assert(
    !before.products.some((p) => p.slug === slug),
    "product absent before create"
  );

  const product = await prisma.product.create({
    data: {
      slug,
      nameAr: "اختبار F2",
      nameEn: `F2 cache ${slug}`,
      descriptionAr: "",
      descriptionEn: "",
      specsTextAr: "",
      specsTextEn: "",
      categoryId: category.id,
      retailPrice: 999,
      currency: "USD",
      status: "published",
      availability: "available",
      wholesaleEligible: false,
      badgeNew: false,
      badgeFeatured: false,
      badgeSale: false,
    },
  });

  await prisma.productImage.create({
    data: {
      productId: product.id,
      path: "/brand/hero-oud-atelier-f-e1.webp",
      altAr: "",
      altEn: "",
      sortOrder: 0,
      kind: "image",
    },
  });

  revalidateTag("homepage");
  revalidateTag("catalog");

  const after = await getHomepageDiscoveryData();
  assert(
    after.products.some((p) => p.slug === slug),
    "homepage discovery includes new product after revalidateTag"
  );

  await prisma.productImage.deleteMany({ where: { productId: product.id } });
  await prisma.product.delete({ where: { id: product.id } });
  revalidateTag("homepage");
  revalidateTag("catalog");

  const cleaned = await getHomepageDiscoveryData();
  assert(
    !cleaned.products.some((p) => p.slug === slug),
    "product removed after cleanup + revalidate"
  );

  console.log(`\nf2-home-cache: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  try {
    await prisma.product.deleteMany({ where: { slug } });
  } catch {
    /* ignore */
  }
  await prisma.$disconnect();
  process.exit(1);
});
