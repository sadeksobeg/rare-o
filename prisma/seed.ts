import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TEST_CURRENCY_CODE } from "../lib/catalog/currency";

const prisma = new PrismaClient();

async function main() {
  const stringCat = await prisma.category.upsert({
    where: { slug: "string-instruments" },
    update: {
      nameAr: "آلات موسيقية وترية",
      nameEn: "String Musical Instruments",
      sortOrder: 1,
    },
    create: {
      slug: "string-instruments",
      nameAr: "آلات موسيقية وترية",
      nameEn: "String Musical Instruments",
      sortOrder: 1,
    },
  });

  await prisma.category.upsert({
    where: { slug: "accessories" },
    update: {
      nameAr: "إكسسوارات",
      nameEn: "Accessories",
      sortOrder: 2,
    },
    create: {
      slug: "accessories",
      nameAr: "إكسسوارات",
      nameEn: "Accessories",
      sortOrder: 2,
    },
  });

  const email = process.env.ADMIN_EMAIL ?? "admin@rareoud.local";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMeNow!";
  const name = process.env.ADMIN_NAME ?? "RARE OUD Admin";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  // Optional demo trader (admin-provisioned fixture — not public registration)
  const traderEmail = process.env.TRADER_EMAIL ?? "trader@rareoud.local";
  const traderPassword = process.env.TRADER_PASSWORD ?? "ChangeMeNow!";
  const traderHash = await bcrypt.hash(traderPassword, 12);
  await prisma.traderAccount.upsert({
    where: { email: traderEmail },
    update: {
      passwordHash: traderHash,
      displayName: "Demo Trader",
      status: "active",
    },
    create: {
      email: traderEmail,
      passwordHash: traderHash,
      displayName: "Demo Trader",
      companyName: "Demo Trading Co",
      phone: "",
      status: "active",
      adminNotes: "Seed fixture for Week 3 Phase 2 verification",
    },
  });

  // Optional demo product uses explicitly labelled TEST currency (not a commercial default)
  const demo = await prisma.product.upsert({
    where: { slug: "demo-string-instrument" },
    update: { wholesaleEligible: true },
    create: {
      slug: "demo-string-instrument",
      nameAr: "آلة وترية تجريبية",
      nameEn: "Demo string instrument",
      descriptionAr: "منتج تجريبي للتحقق من المنصة.",
      descriptionEn: "Fixture product for platform verification.",
      categoryId: stringCat.id,
      retailPrice: 100,
      currency: TEST_CURRENCY_CODE,
      status: "published",
      availability: "available",
      wholesaleEligible: true,
    },
  });

  const existingImages = await prisma.productImage.count({
    where: { productId: demo.id },
  });
  if (existingImages === 0) {
    await prisma.productImage.createMany({
      data: [
        {
          productId: demo.id,
          path: "/brand/editorial/instrument-dark.jpg",
          altAr: "آلة وترية — منظر أمامي",
          altEn: "String instrument — front view",
          sortOrder: 0,
          kind: "image",
        },
        {
          productId: demo.id,
          path: "/brand/editorial/hero-closeup.jpg",
          altAr: "تفاصيل الحرفة",
          altEn: "Craft detail",
          sortOrder: 1,
          kind: "image",
        },
      ],
    });
  }

  console.log("Seed complete:");
  console.log("- categories: string-instruments, accessories");
  console.log(`- admin: ${email}`);
  console.log(`- trader: ${traderEmail}`);
  console.log(`- demo product currency: ${TEST_CURRENCY_CODE} (test fixture only)`);
  console.log("");
  console.log(
    "WARNING: Seed admin/trader credentials are DEVELOPMENT-ONLY fixtures."
  );
  console.log(
    "Do not use seed passwords in production. Rotate AUTH_SECRET and all credentials for live deploy."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
