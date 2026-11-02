import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TEST_CURRENCY_CODE } from "../lib/catalog/currency";
import type { OudSpecs } from "../lib/catalog/oud-specs";

const prisma = new PrismaClient();

/** Storefront demo currency — ISO 4217 so prices render (never TEST on storefront). */
const DEMO_CURRENCY = "USD";

const IMAGES = {
  instrument: "/brand/instruments/oud-stage-gold.jpg",
  closeup: "/brand/instruments/oud-neck-detail.jpg",
  heritage: "/brand/instruments/oud-handcraft.jpg",
  signature: "/brand/instruments/oud-atelier-light.jpg",
  /** Prefer atelier cutouts + Phase 8 temporary instrument set. */
  oudPrimary: "/brand/hero-oud-atelier-f.png",
  oudAlt: "/brand/instruments/oud-strings-close.jpg",
  oudWorkshop: "/brand/instruments/oud-workshop.jpg",
  oudWarm: "/brand/instruments/oud-body-warm.jpg",
  oudLive: "/brand/instruments/oud-performance.jpg",
  oudResonance: "/brand/instruments/oud-resonance.jpg",
} as const;

type SeedCategory =
  | "oud-economy"
  | "oud-mid"
  | "oud-professional"
  | "oud-vip"
  | "accessories"
  | "string-instruments";

type SeedProduct = {
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  specsTextAr: string;
  specsTextEn: string;
  category: SeedCategory;
  oudSpecs?: OudSpecs | null;
  retailPrice: number;
  compareAtPrice?: number | null;
  availability?: "available" | "unavailable";
  wholesaleEligible?: boolean;
  images: Array<{ path: string; altAr: string; altEn: string }>;
};

const OUD_SPECS_AR = ["الأوتار: 11 وتراً"].join("\n");

const OUD_SPECS_EN = ["Strings: 11 courses"].join("\n");

function wood(
  face: [string, string],
  back: [string, string],
  pegs: [string, string],
  fingerboard: [string, string],
  bridge: [string, string]
): OudSpecs["wood"] {
  return {
    face: { ar: face[0], en: face[1] },
    back: { ar: back[0], en: back[1] },
    pegs: { ar: pegs[0], en: pegs[1] },
    fingerboard: { ar: fingerboard[0], en: fingerboard[1] },
    bridge: { ar: bridge[0], en: bridge[1] },
  };
}

const WORKSHOP_OUD_SPECS: OudSpecs = {
  wood: wood(
    ["شوح متين", "spruce"],
    ["جوز مطبق", "laminated walnut"],
    ["خشب الورد", "rosewood"],
    ["أبنوس", "ebony"],
    ["خشب الورد", "rosewood"]
  ),
  measures: {
    faceWidthMm: 355,
    faceDepthMm: 175,
    faceLengthMm: 490,
    neckLengthMm: 195,
    stringLengthMm: 585,
  },
  standardNeck: true,
  finish: { ar: "ورنيش يدوي", en: "hand-rubbed varnish" },
};

const CLASSIC_OUD_SPECS: OudSpecs = {
  wood: wood(
    ["شوح مختار", "select spruce"],
    ["جوز هندي", "Indian walnut"],
    ["خشب الورد", "rosewood"],
    ["أبنوس", "ebony"],
    ["خشب الورد", "rosewood"]
  ),
  measures: {
    faceWidthMm: 360,
    faceDepthMm: 180,
    faceLengthMm: 500,
    neckLengthMm: 200,
    stringLengthMm: 600,
  },
  standardNeck: true,
  finish: { ar: "ورنيش زيتي", en: "oil varnish" },
};

const CONCERT_OUD_SPECS: OudSpecs = {
  wood: wood(
    ["شوح ألماني", "German spruce"],
    ["خشب الورد", "rosewood"],
    ["أبنوس", "ebony"],
    ["أبنوس", "ebony"],
    ["خشب الورد", "rosewood"]
  ),
  measures: {
    faceWidthMm: 365,
    faceDepthMm: 185,
    faceLengthMm: 510,
    neckLengthMm: 205,
    stringLengthMm: 610,
  },
  standardNeck: true,
  finish: { ar: "ورنيش صدف يدوي", en: "hand French polish" },
};

const VIP_OUD_SPECS: OudSpecs = {
  wood: wood(
    ["أرز معمّر", "aged cedar"],
    ["جوز مختار", "selected walnut"],
    ["أبنوس", "ebony"],
    ["أبنوس أفريقي", "African ebony"],
    ["خشب الورد", "rosewood"]
  ),
  measures: {
    faceWidthMm: 370,
    faceDepthMm: 190,
    faceLengthMm: 515,
    neckLengthMm: 210,
    stringLengthMm: 615,
  },
  standardNeck: false,
  finish: { ar: "تشطيب أتيليه متعدد الطبقات", en: "atelier multi-coat finish" },
};

const DEMO_PRODUCTS: SeedProduct[] = [
  {
    slug: "demo-string-instrument",
    nameAr: "عود ورشة",
    nameEn: "Workshop oud",
    descriptionAr: "عود ورشة بنبرة دافئة مناسب للممارسة والعرض.",
    descriptionEn: "A workshop oud with a warm tone for practice and display.",
    specsTextAr: OUD_SPECS_AR,
    specsTextEn: OUD_SPECS_EN,
    category: "oud-economy",
    oudSpecs: WORKSHOP_OUD_SPECS,
    retailPrice: 2098,
    compareAtPrice: 2490,
    wholesaleEligible: true,
    images: [
      { path: IMAGES.oudPrimary, altAr: "عود — منظر أمامي", altEn: "Oud — front view" },
      { path: IMAGES.oudAlt, altAr: "تفاصيل الأوتار", altEn: "String detail" },
      { path: IMAGES.oudWorkshop, altAr: "الورشة", altEn: "Workshop" },
      { path: IMAGES.closeup, altAr: "تفاصيل العنق", altEn: "Neck detail" },
    ],
  },
  {
    slug: "oud-classic-21",
    nameAr: "عود كلاسيك 21",
    nameEn: "Classic oud 21",
    descriptionAr: "عود بتركيبة متوازنة للعزف اليومي والاستوديو.",
    descriptionEn: "A balanced oud for daily practice and studio sessions.",
    specsTextAr: ["الأوتار: 11 وتراً", "الوزن التقريبي: 850 غ"].join("\n"),
    specsTextEn: ["Strings: 11 courses", "Approx. weight: 850 g"].join("\n"),
    category: "oud-mid",
    oudSpecs: CLASSIC_OUD_SPECS,
    retailPrice: 3180,
    compareAtPrice: 3550,
    images: [
      { path: IMAGES.oudWarm, altAr: "عود كلاسيك", altEn: "Classic oud" },
      { path: IMAGES.oudPrimary, altAr: "منظر أمامي", altEn: "Front view" },
      { path: IMAGES.oudAlt, altAr: "تفصيل الوجه", altEn: "Face detail" },
      { path: IMAGES.oudResonance, altAr: "حضور المسرح", altEn: "Stage presence" },
    ],
  },
  {
    slug: "oud-concert-premium",
    nameAr: "عود حفلات بريميوم",
    nameEn: "Concert premium oud",
    descriptionAr: "اختيار للحفلات بنبرة أوضح واستجابة سريعة.",
    descriptionEn: "A concert choice with clearer tone and quick response.",
    specsTextAr: ["الوردة: نقش يدوي", "الأوتار: 11 وتراً"].join("\n"),
    specsTextEn: ["Rosette: hand-carved", "Strings: 11 courses"].join("\n"),
    category: "oud-professional",
    oudSpecs: CONCERT_OUD_SPECS,
    retailPrice: 4920,
    images: [
      { path: IMAGES.oudLive, altAr: "عود حفلات", altEn: "Concert oud" },
      { path: IMAGES.oudPrimary, altAr: "منظر جانبي", altEn: "Side view" },
      { path: IMAGES.oudAlt, altAr: "تفاصيل الأوتار", altEn: "String detail" },
      { path: IMAGES.instrument, altAr: "إضاءة المسرح", altEn: "Stage light" },
    ],
  },
  {
    slug: "oud-vip-signature",
    nameAr: "عود توقيع VIP",
    nameEn: "VIP signature oud",
    descriptionAr: "قطعة أتيليه بأخشاب معمّرة وتشطيب متعدد الطبقات.",
    descriptionEn: "An atelier piece with aged woods and a multi-coat finish.",
    specsTextAr: [
      "الوردة: نقش يدوي",
      "الأوتار: 11 وتراً",
      "الاستخدام: حفلات ومقتنيات",
    ].join("\n"),
    specsTextEn: [
      "Rosette: hand-carved",
      "Strings: 11 courses",
      "Use: concert and collection",
    ].join("\n"),
    category: "oud-vip",
    oudSpecs: VIP_OUD_SPECS,
    retailPrice: 8900,
    wholesaleEligible: true,
    images: [
      { path: IMAGES.signature, altAr: "عود توقيع", altEn: "Signature oud" },
      { path: IMAGES.oudPrimary, altAr: "منظر أمامي", altEn: "Front view" },
      { path: IMAGES.oudWorkshop, altAr: "تفاصيل الأتيليه", altEn: "Atelier detail" },
      { path: IMAGES.heritage, altAr: "حرفة اليد", altEn: "Hand craft" },
    ],
  },
  {
    slug: "violin-atelier",
    nameAr: "كمان أتيليه",
    nameEn: "Atelier violin",
    descriptionAr: "كمان ورشة بلمسة دافئة مناسب للعزف الفردي.",
    descriptionEn: "An atelier violin with a warm character for solo play.",
    specsTextAr: [
      "الحجم: 4/4",
      "الوجه: شوح",
      "الجانب والظهر: قيقب",
      "التشطيب: ورنيش زيتي",
    ].join("\n"),
    specsTextEn: [
      "Size: 4/4",
      "Top: spruce",
      "Back & sides: maple",
      "Finish: oil varnish",
    ].join("\n"),
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
    specsTextAr: [
      "الحجم: 4/4",
      "الوجه: شوح",
      "الجانب والظهر: قيقب",
      "الحالة: غير متوفر حالياً",
    ].join("\n"),
    specsTextEn: [
      "Size: 4/4",
      "Top: spruce",
      "Back & sides: maple",
      "Status: currently unavailable",
    ].join("\n"),
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
    specsTextAr: [
      "الأوتار: فولاذ ونيلون",
      "اللوح: جوز",
      "العربات: معدنية مضبوطة",
      "الحالة: منشور للطلب",
    ].join("\n"),
    specsTextEn: [
      "Strings: steel and nylon",
      "Deck: walnut",
      "Levers: precision metal",
      "Status: published for request",
    ].join("\n"),
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
    specsTextAr: "",
    specsTextEn: "",
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
    specsTextAr: "",
    specsTextEn: "",
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
    specsTextAr: "",
    specsTextEn: "",
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
    specsTextAr: "",
    specsTextEn: "",
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
      specsTextAr: product.specsTextAr,
      specsTextEn: product.specsTextEn,
      oudSpecs: product.oudSpecs ?? undefined,
      categoryId: categoryIds[product.category]!,
      retailPrice: product.retailPrice,
      compareAtPrice: product.compareAtPrice ?? null,
      currency: DEMO_CURRENCY,
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
      specsTextAr: product.specsTextAr,
      specsTextEn: product.specsTextEn,
      oudSpecs: product.oudSpecs ?? undefined,
      categoryId: categoryIds[product.category]!,
      retailPrice: product.retailPrice,
      compareAtPrice: product.compareAtPrice ?? null,
      currency: DEMO_CURRENCY,
      status: "published",
      availability: product.availability ?? "available",
      wholesaleEligible: product.wholesaleEligible ?? false,
    },
  });

  // Keep demo media in sync with seed (safe for local/demo; fixtures stay editorial).
  await prisma.productImage.deleteMany({ where: { productId: row.id } });
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

  return row;
}

async function upsertCategory(
  slug: string,
  nameAr: string,
  nameEn: string,
  sortOrder: number
) {
  return prisma.category.upsert({
    where: { slug },
    update: { nameAr, nameEn, sortOrder },
    create: { slug, nameAr, nameEn, sortOrder },
  });
}

async function main() {
  const economyCat = await upsertCategory(
    "oud-economy",
    "عود اقتصادي",
    "Economy oud",
    1
  );
  const midCat = await upsertCategory(
    "oud-mid",
    "عود متوسط",
    "Mid-range oud",
    2
  );
  const professionalCat = await upsertCategory(
    "oud-professional",
    "عود احترافي",
    "Professional oud",
    3
  );
  const vipCat = await upsertCategory("oud-vip", "عود VIP", "VIP oud", 4);
  const accessoriesCat = await upsertCategory(
    "accessories",
    "إكسسوارات",
    "Accessories",
    5
  );
  const stringCat = await upsertCategory(
    "string-instruments",
    "آلات موسيقية وترية",
    "String Musical Instruments",
    90
  );

  const categoryIds: Record<SeedCategory, string> = {
    "oud-economy": economyCat.id,
    "oud-mid": midCat.id,
    "oud-professional": professionalCat.id,
    "oud-vip": vipCat.id,
    accessories: accessoriesCat.id,
    "string-instruments": stringCat.id,
  };

  const defaultAdminEmail = "admin@rareoud.local";
  const email = process.env.ADMIN_EMAIL ?? defaultAdminEmail;
  if (
    process.env.NODE_ENV === "production" &&
    email === defaultAdminEmail &&
    process.env.ALLOW_DEFAULT_SEED !== "1"
  ) {
    throw new Error(
      "Refusing production seed with admin@rareoud.local. Set ADMIN_EMAIL or ALLOW_DEFAULT_SEED=1 explicitly."
    );
  }
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

  const brRef = "BR-SEED-014";
  const existingBr = await prisma.brokerageRequest.findUnique({
    where: { reference: brRef },
  });
  if (!existingBr) {
    await prisma.brokerageRequest.create({
      data: {
        reference: brRef,
        traderId: trader.id,
        status: "QUOTE_SENT",
        descriptionAr: "عود حلبي قديم — بذرة وساطة للتحقق",
        descriptionEn: "Old Aleppo oud — brokerage seed fixture",
        categoryAr: "عود كلاسيكي",
        categoryEn: "Classic Oud",
        quantity: 1,
        cityAr: "حلب",
        cityEn: "Aleppo",
        placeNameAr: "محل آلات الفرات",
        placeNameEn: "Al-Furat Instruments",
        budgetMinUsd: 2000,
        budgetMaxUsd: 3000,
        quote: {
          create: {
            goodsValueUsd: 2400,
            commissionRate: 1.5,
            shippingUsd: 60,
          },
        },
        inspection: {
          create: {
            grade: "B",
            notesAr: "آثار استخدام طبيعية",
            notesEn: "Normal wear",
            verdictAr: "موصى بالشراء",
            verdictEn: "Recommended",
          },
        },
        events: {
          create: [
            {
              actor: "trader",
              toStatus: "SUBMITTED",
              messageAr: "تم التقديم",
              messageEn: "Submitted",
            },
            {
              actor: "admin",
              fromStatus: "INSPECTED",
              toStatus: "QUOTE_SENT",
              messageAr: "أُرسل العرض",
              messageEn: "Quote sent",
            },
          ],
        },
      },
    });
  }

  console.log("Seed complete:");
  console.log(
    "- categories: oud-economy, oud-mid, oud-professional, oud-vip, accessories"
  );
  console.log(`- products: ${DEMO_PRODUCTS.length} published fixtures`);
  console.log(`- admin: ${email}`);
  console.log(`- trader: ${traderEmail}`);
  console.log(`- waiting deal: ${waitingRef} (nextActor=trader)`);
  console.log(`- brokerage seed: ${brRef} (QUOTE_SENT)`);
  console.log(`- storefront demo currency: ${DEMO_CURRENCY}`);
  console.log(`- regression fixture currency: ${TEST_CURRENCY_CODE} (hidden in UI)`);
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
