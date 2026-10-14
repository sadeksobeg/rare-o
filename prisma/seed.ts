import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TEST_CURRENCY_CODE } from "../lib/catalog/currency";

const prisma = new PrismaClient();

const IMAGES = {
  instrument: "/brand/editorial/instrument-dark.jpg",
  closeup: "/brand/editorial/hero-closeup.jpg",
  heritage: "/brand/editorial/oud-heritage.jpg",
  signature: "/brand/editorial/hero-signature.jpg",
} as const;

type SeedProduct = {
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: "string-instruments" | "accessories";
  retailPrice: number;
  compareAtPrice?: number | null;
  availability?: "available" | "unavailable";
  wholesaleEligible?: boolean;
  images: Array<{ path: string; altAr: string; altEn: string }>;
};

const DEMO_PRODUCTS: SeedProduct[] = [
  {
    slug: "demo-string-instrument",
    nameAr: "عود ورشة",
    nameEn: "Workshop oud",
    descriptionAr: "عود ورشة بنبرة دافئة مناسب للممارسة والعرض.",
    descriptionEn: "A workshop oud with a warm tone for practice and display.",
    category: "string-instruments",
    retailPrice: 2098,
    compareAtPrice: 2490,
    wholesaleEligible: true,
    images: [
      { path: IMAGES.instrument, altAr: "عود — منظر أمامي", altEn: "Oud — front view" },
      { path: IMAGES.closeup, altAr: "تفاصيل الحرفة", altEn: "Craft detail" },
    ],
  },
  {
    slug: "oud-classic-21",
    nameAr: "عود كلاسيك 21",
    nameEn: "Classic oud 21",
    descriptionAr: "عود بتركيبة متوازنة للعزف اليومي والاستوديو.",
    descriptionEn: "A balanced oud for daily practice and studio sessions.",
    category: "string-instruments",
    retailPrice: 3180,
    compareAtPrice: 3550,
    images: [
      { path: IMAGES.heritage, altAr: "عود كلاسيك", altEn: "Classic oud" },
      { path: IMAGES.closeup, altAr: "تفصيل الوجه", altEn: "Face detail" },
    ],
  },
  {
    slug: "oud-concert-premium",
    nameAr: "عود حفلات بريميوم",
    nameEn: "Concert premium oud",
    descriptionAr: "اختيار للحفلات بنبرة أوضح واستجابة سريعة.",
    descriptionEn: "A concert choice with clearer tone and quick response.",
    category: "string-instruments",
    retailPrice: 4920,
    images: [
      { path: IMAGES.signature, altAr: "عود حفلات", altEn: "Concert oud" },
      { path: IMAGES.instrument, altAr: "منظر جانبي", altEn: "Side view" },
    ],
  },
  {
    slug: "violin-atelier",
    nameAr: "كمان أتيليه",
    nameEn: "Atelier violin",
    descriptionAr: "كمان ورشة بلمسة دافئة مناسب للعزف الفردي.",
    descriptionEn: "An atelier violin with a warm character for solo play.",
    category: "string-instruments",
    retailPrice: 2750,
    compareAtPrice: 2990,
    images: [
      { path: IMAGES.closeup, altAr: "كمان أتيليه", altEn: "Atelier violin" },
      { path: IMAGES.heritage, altAr: "تفصيل الخشب", altEn: "Wood detail" },
    ],
  },
  {
    slug: "cello-studio",
    nameAr: "تشيلو ستوديو",
    nameEn: "Studio cello",
    descriptionAr: "تشيلو للتسجيل والممارسة بثقل متزن.",
    descriptionEn: "A studio cello with balanced weight for recording and practice.",
    category: "string-instruments",
    retailPrice: 6100,
    availability: "unavailable",
    images: [
      { path: IMAGES.instrument, altAr: "تشيلو", altEn: "Cello" },
    ],
  },
  {
    slug: "qanun-select",
    nameAr: "قانون مختار",
    nameEn: "Selected qanun",
    descriptionAr: "قانون منشور ضمن مختارات الموسم.",
    descriptionEn: "A qanun published within this season’s selection.",
    category: "string-instruments",
    retailPrice: 3850,
    wholesaleEligible: true,
    images: [
      { path: IMAGES.heritage, altAr: "قانون", altEn: "Qanun" },
      { path: IMAGES.signature, altAr: "تفصيل الأوتار", altEn: "String detail" },
    ],
  },
  {
    slug: "case-hard-shell",
    nameAr: "حقيبة صلبة",
    nameEn: "Hard-shell case",
    descriptionAr: "حماية للسفر والتخزين اليومي.",
    descriptionEn: "Protection for travel and everyday storage.",
    category: "accessories",
    retailPrice: 420,
    compareAtPrice: 490,
    images: [
      { path: IMAGES.closeup, altAr: "حقيبة صلبة", altEn: "Hard case" },
    ],
  },
  {
    slug: "strap-leather",
    nameAr: "حمّالة جلد",
    nameEn: "Leather strap",
    descriptionAr: "حمّالة جلدية بتشطيب هادئ.",
    descriptionEn: "A leather strap with a quiet finish.",
    category: "accessories",
    retailPrice: 180,
    images: [
      { path: IMAGES.signature, altAr: "حمّالة جلد", altEn: "Leather strap" },
    ],
  },
  {
    slug: "pick-set-rosewood",
    nameAr: "مجموعة ريش خشب الورد",
    nameEn: "Rosewood pick set",
    descriptionAr: "ثلاث ريش بدرجات سماكة مختلفة.",
    descriptionEn: "Three picks in varying thicknesses.",
    category: "accessories",
    retailPrice: 65,
    images: [
      { path: IMAGES.heritage, altAr: "ريش خشب الورد", altEn: "Rosewood picks" },
    ],
  },
  {
    slug: "tuner-digital",
    nameAr: "موالف رقمي",
    nameEn: "Digital tuner",
    descriptionAr: "موالف سريع للتمرين والاستوديو.",
    descriptionEn: "A quick tuner for practice and studio work.",
    category: "accessories",
    retailPrice: 95,
    compareAtPrice: 120,
    images: [
      { path: IMAGES.instrument, altAr: "موالف رقمي", altEn: "Digital tuner" },
    ],
  },
];

async function upsertProduct(
  product: SeedProduct,
  categoryIds: Record<string, string>
) {
  const row = await prisma.product.upsert({
    where: { slug: product.slug },
    update: {
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      categoryId: categoryIds[product.category]!,
      retailPrice: product.retailPrice,
      compareAtPrice: product.compareAtPrice ?? null,
      currency: TEST_CURRENCY_CODE,
      status: "published",
      availability: product.availability ?? "available",
      wholesaleEligible: product.wholesaleEligible ?? false,
    },
    create: {
      slug: product.slug,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      categoryId: categoryIds[product.category]!,
      retailPrice: product.retailPrice,
      compareAtPrice: product.compareAtPrice ?? null,
      currency: TEST_CURRENCY_CODE,
      status: "published",
      availability: product.availability ?? "available",
      wholesaleEligible: product.wholesaleEligible ?? false,
    },
  });

  const existingImages = await prisma.productImage.count({
    where: { productId: row.id },
  });
  if (existingImages === 0) {
    await prisma.productImage.createMany({
      data: product.images.map((img, i) => ({
        productId: row.id,
        path: img.path,
        altAr: img.altAr,
        altEn: img.altEn,
        sortOrder: i,
        kind: "image",
      })),
    });
  }

  return row;
}

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

  const accessoriesCat = await prisma.category.upsert({
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

  const categoryIds = {
    "string-instruments": stringCat.id,
    accessories: accessoriesCat.id,
  };

  const email = process.env.ADMIN_EMAIL ?? "admin@rareoud.local";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMeNow!";
  const name = process.env.ADMIN_NAME ?? "RARE OUD Admin";
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  const traderEmail = process.env.TRADER_EMAIL ?? "trader@rareoud.local";
  const traderPassword = process.env.TRADER_PASSWORD ?? "ChangeMeNow!";
  const traderHash = await bcrypt.hash(traderPassword, 12);
  const trader = await prisma.traderAccount.upsert({
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

  const products = [];
  for (const p of DEMO_PRODUCTS) {
    products.push(await upsertProduct(p, categoryIds));
  }
  const demo = products.find((p) => p.slug === "demo-string-instrument")!;
  const classic = products.find((p) => p.slug === "oud-classic-21")!;

  await prisma.publicCuratedOffer.upsert({
    where: { slug: "selected-strings" },
    update: {
      status: "published",
      titleAr: "مختارات وترية",
      titleEn: "Selected strings",
      summaryAr: "قطع يختارها فريق RARE OUD بعناية من المخزون الحالي.",
      summaryEn:
        "Pieces chosen carefully by the RARE OUD team from current stock.",
      productId: demo.id,
      publishedAt: new Date(),
      sortOrder: 0,
    },
    create: {
      slug: "selected-strings",
      titleAr: "مختارات وترية",
      titleEn: "Selected strings",
      summaryAr: "قطع يختارها فريق RARE OUD بعناية من المخزون الحالي.",
      summaryEn:
        "Pieces chosen carefully by the RARE OUD team from current stock.",
      status: "published",
      productId: demo.id,
      sortOrder: 0,
      publishedAt: new Date(),
    },
  });

  await prisma.publicCuratedOffer.upsert({
    where: { slug: "atelier-edit" },
    update: {
      status: "published",
      titleAr: "تحرير الأتيليه",
      titleEn: "Atelier edit",
      summaryAr: "اختيار قصير من الورشة — للطلب عبر واتساب.",
      summaryEn: "A short workshop edit — request via WhatsApp.",
      productId: classic.id,
      publishedAt: new Date(),
      sortOrder: 1,
    },
    create: {
      slug: "atelier-edit",
      titleAr: "تحرير الأتيليه",
      titleEn: "Atelier edit",
      summaryAr: "اختيار قصير من الورشة — للطلب عبر واتساب.",
      summaryEn: "A short workshop edit — request via WhatsApp.",
      status: "published",
      productId: classic.id,
      sortOrder: 1,
      publishedAt: new Date(),
    },
  });

  await prisma.promoBand.upsert({
    where: { slug: "explore-collection" },
    update: {
      status: "published",
      titleAr: "استكشف المجموعة",
      titleEn: "Explore the collection",
      bodyAr: "قطع منشورة حالياً — أضف إلى قائمة الطلب وتواصل عبر واتساب.",
      bodyEn:
        "Published pieces now — add to your request list and continue on WhatsApp.",
      ctaLabelAr: "إلى الكتالوج",
      ctaLabelEn: "View catalog",
      href: "/catalog",
      tone: "ink",
      imagePath: IMAGES.instrument,
      sortOrder: 0,
    },
    create: {
      slug: "explore-collection",
      titleAr: "استكشف المجموعة",
      titleEn: "Explore the collection",
      bodyAr: "قطع منشورة حالياً — أضف إلى قائمة الطلب وتواصل عبر واتساب.",
      bodyEn:
        "Published pieces now — add to your request list and continue on WhatsApp.",
      ctaLabelAr: "إلى الكتالوج",
      ctaLabelEn: "View catalog",
      href: "/catalog",
      tone: "ink",
      imagePath: IMAGES.instrument,
      sortOrder: 0,
      status: "published",
    },
  });

  await prisma.promoBand.upsert({
    where: { slug: "talk-to-team" },
    update: {
      status: "published",
      titleAr: "تحدث مع الفريق",
      titleEn: "Talk to the team",
      bodyAr: "للاستفسار عن قطعة أو عرض — راسلنا عبر صفحة التواصل.",
      bodyEn: "For a piece or offer inquiry — message us via the contact page.",
      ctaLabelAr: "تواصل معنا",
      ctaLabelEn: "Contact us",
      href: "/contact",
      tone: "plum",
      sortOrder: 1,
    },
    create: {
      slug: "talk-to-team",
      titleAr: "تحدث مع الفريق",
      titleEn: "Talk to the team",
      bodyAr: "للاستفسار عن قطعة أو عرض — راسلنا عبر صفحة التواصل.",
      bodyEn: "For a piece or offer inquiry — message us via the contact page.",
      ctaLabelAr: "تواصل معنا",
      ctaLabelEn: "Contact us",
      href: "/contact",
      tone: "plum",
      sortOrder: 1,
      status: "published",
    },
  });

  // Deal awaiting trader action (negotiating + last actor admin → nextActor trader)
  /** Demo (not regression): visible in UI. Regression uses DL-SEED-* / Reg Trader *. */
  const waitingRef = "DL-DEMO-WAIT";
  await prisma.dealProposal.upsert({
    where: { reference: waitingRef },
    update: {
      status: "negotiating",
      title: "عرض مقابل على عود ورشة",
      dealKind: "catalog",
      productId: demo.id,
      traderId: trader.id,
      proposedPrice: 1800,
      currency: "USD",
      quantity: 2,
      conditionsNotes: "تسليم خلال أسبوعين",
    },
    create: {
      reference: waitingRef,
      traderId: trader.id,
      dealKind: "catalog",
      title: "عرض مقابل على عود ورشة",
      productId: demo.id,
      proposedPrice: 1800,
      currency: "USD",
      quantity: 2,
      conditionsNotes: "تسليم خلال أسبوعين",
      status: "negotiating",
      entries: {
        create: [
          {
            action: "propose",
            actorRole: "trader",
            actorTraderId: trader.id,
            message: "نقترح 1700 دولار لقطعتين.",
            proposedPrice: 1700,
            currency: "USD",
            quantity: 2,
          },
          {
            action: "counter",
            actorRole: "admin",
            actorAdminId: admin.id,
            message: "يمكننا الاتفاق على 1800 دولار لقطعتين.",
            proposedPrice: 1800,
            currency: "USD",
            quantity: 2,
          },
        ],
      },
    },
  });
  const waitingDeal = await prisma.dealProposal.findUnique({
    where: { reference: waitingRef },
  });
  if (waitingDeal) {
    await prisma.negotiationEntry.deleteMany({ where: { dealId: waitingDeal.id } });
    await prisma.negotiationEntry.createMany({
      data: [
        {
          dealId: waitingDeal.id,
          action: "propose",
          actorRole: "trader",
          actorTraderId: trader.id,
          message: "نقترح 1700 دولار لقطعتين.",
          proposedPrice: 1700,
          currency: "USD",
          quantity: 2,
        },
        {
          dealId: waitingDeal.id,
          action: "counter",
          actorRole: "admin",
          actorAdminId: admin.id,
          message: "يمكننا الاتفاق على 1800 دولار لقطعتين.",
          proposedPrice: 1800,
          currency: "USD",
          quantity: 2,
        },
      ],
    });
  }

  console.log("Seed complete:");
  console.log("- categories: string-instruments, accessories");
  console.log(`- products: ${DEMO_PRODUCTS.length} published fixtures`);
  console.log(`- admin: ${email}`);
  console.log(`- trader: ${traderEmail}`);
  console.log(`- waiting deal: ${waitingRef} (nextActor=trader)`);
  console.log(`- fixture currency: ${TEST_CURRENCY_CODE} (test only)`);
  console.log("- offers + promo bands seeded (admin-editable)");
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
