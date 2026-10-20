/**
 * F2 — homepage discovery freshness after publish (same loader as tagged cache).
 * `getHomepageDiscoveryData` / `revalidateTag` require a Next server runtime;
 * this script uses the uncached loader + optional live HTML fetch.
 * Run: npm run test:f2-home-cache
 */
import { revalidateTag } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { loadHomepageDiscoveryData } from "../lib/catalog/homepage";

const prisma = new PrismaClient();
const slug = `f2-cache-${Date.now()}`;
const BASE = process.env.PLAYWRIGHT_BASE_URL || process.env.F2_SERVER_URL || "";

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

  const before = await loadHomepageDiscoveryData();
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

  try {
    revalidateTag("homepage");
    revalidateTag("catalog");
    assert(true, "revalidateTag(homepage|catalog) callable in this runtime");
  } catch {
    console.log(
      "NOTE: revalidateTag needs Next server — admin actions call it after mutations"
    );
  }

  const after = await loadHomepageDiscoveryData();
  assert(
    after.products.some((p) => p.slug === slug),
    "homepage discovery loader includes new published product"
  );

  if (BASE) {
    const res = await fetch(`${BASE.replace(/\/$/, "")}/?lang=en`, {
      headers: { Accept: "text/html" },
    });
    assert(res.ok, `homepage HTML fetch ${BASE} → ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      assert(
        html.includes(slug) || html.includes(`F2 cache ${slug}`),
        "homepage HTML contains new product (set PLAYWRIGHT_BASE_URL when server is up)"
      );
    }
  } else {
    console.log(
      "SKIP: set PLAYWRIGHT_BASE_URL for live HTML assertion (discovery API path verified above)"
    );
  }

  await prisma.productImage.deleteMany({ where: { productId: product.id } });
  await prisma.product.delete({ where: { id: product.id } });

  const cleaned = await loadHomepageDiscoveryData();
  assert(
    !cleaned.products.some((p) => p.slug === slug),
    "product removed after cleanup"
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
