// RARE OUD design-lab — shared demo data. Every screen reads from here so
// the same request, trader, or product shows identical details wherever it
// appears (VISION.md section 6: "same records across all screens").
// All data is clearly fictional; no real customer or trader information.

export const currentAdmin = {
  id: "u_admin_1",
  name: "سامر الحلبي",
  nameEn: "Samer Al-Halabi",
  role: "Owner" as const,
  email: "samer@rareoud.example",
};

export const currentTrader = {
  // Same identity as traders[0] ("t1") — the logged-in trader session is
  // Adnan, who also appears in the admin's traders list.
  id: "t1",
  name: "عدنان درويش",
  nameEn: "Adnan Darwish",
  email: "adnan@rareoud.example",
};

export type StatusTone = "neutral" | "info" | "progress" | "attention" | "success" | "danger" | "closed";

export const products = [
  { id: "p1", nameAr: "قانون مختار", nameEn: "Qanun Select", slug: "qanun-select", priceUsd: 8845, category: "قانون وآلات وترية" },
  { id: "p2", nameAr: "عود الأتيليه الأول", nameEn: "Atelier Oud No. 1", slug: "atelier-oud-1", priceUsd: 7500, category: "عود كلاسيكي" },
  { id: "p3", nameAr: "ناي فارسي مُعتّق", nameEn: "Aged Persian Ney", slug: "aged-persian-ney", priceUsd: 1250, category: "قطع نادرة معتّقة" },
];

export const retailRequests = [
  { id: "RO-2026-7595", customerAr: "سارة أحمد", customerEn: "Sara Ahmed", items: 1, status: "info" as StatusTone, statusLabelAr: "جديد", statusLabelEn: "New", date: "2026-10-18", ageMinutes: 22 },
  { id: "RO-2026-2948", customerAr: "Karim N.", customerEn: "Karim N.", items: 1, status: "info" as StatusTone, statusLabelAr: "جديد", statusLabelEn: "New", date: "2026-10-18", ageMinutes: 40 },
  { id: "RO-2026-4153", customerAr: "ليلى حسن", customerEn: "Layla Hassan", items: 2, status: "attention" as StatusTone, statusLabelAr: "متابعة", statusLabelEn: "Follow-up", date: "2026-10-19", ageMinutes: 2880 },
  { id: "RO-2026-3411", customerAr: "Omar S.", customerEn: "Omar S.", items: 1, status: "success" as StatusTone, statusLabelAr: "مكتمل", statusLabelEn: "Completed", date: "2026-10-12", ageMinutes: 20000 },
];

export const kpis = {
  newRetailRequests: 17,
  dealsAwaitingReply: 7,
  wholesaleRequests: 5,
  activeBrokerageRequests: 4,
};

export const requestsOverTime = [3, 4, 3, 5, 6, 5, 7, 6, 8, 7, 9, 8, 9, 9];

export const domainSplit = [
  { labelAr: "تجزئة", labelEn: "Retail", value: 46, color: "var(--color-ro-plum-700)" },
  { labelAr: "صفقات", labelEn: "Deals", value: 24, color: "var(--color-ro-plum-300)" },
  { labelAr: "جملة", labelEn: "Wholesale", value: 18, color: "var(--color-ro-amber-500)" },
  { labelAr: "وساطة", labelEn: "Brokerage", value: 12, color: "var(--color-ro-progress-700)" },
];

export const traders = [
  { id: "t1", name: "عدنان درويش", nameEn: "Adnan Darwish", email: "adnan@rareoud.example", phone: "+963 93 111 2233", status: "active" as const, city: "دمشق", cityEn: "Damascus", dealsCount: 9, acceptRate: 78, joined: "2026-03-14" },
  { id: "t2", name: "ريم قاسم", nameEn: "Reem Qassem", email: "reem@rareoud.example", phone: "+963 94 222 3344", status: "active" as const, city: "حلب", cityEn: "Aleppo", dealsCount: 4, acceptRate: 62, joined: "2026-05-02" },
  { id: "t3", name: "بلال شاهين", nameEn: "Bilal Shaheen", email: "bilal@rareoud.example", phone: "+963 95 333 4455", status: "disabled" as const, city: "حمص", cityEn: "Homs", dealsCount: 1, acceptRate: 30, joined: "2026-01-20" },
];

export const customers = [
  { id: "c1", name: "سارة أحمد", nameEn: "Sara Ahmed", phone: "+963 93 xxx xxxx", requestsCount: 2, lastRequest: "2026-10-18" },
  { id: "c2", name: "ليلى حسن", nameEn: "Layla Hassan", phone: "+963 94 xxx xxxx", requestsCount: 1, lastRequest: "2026-10-19" },
];

export const teamMembers = [
  { id: "m1", name: "سامر الحلبي", nameEn: "Samer Al-Halabi", email: "samer@rareoud.example", role: "Owner" as const, status: "active" as const, lastActive: "قبل 5 دقائق", lastActiveEn: "5 minutes ago" },
  { id: "m2", name: "هالة نصر", nameEn: "Hala Nasr", email: "hala@rareoud.example", role: "Manager" as const, status: "active" as const, lastActive: "قبل ساعة", lastActiveEn: "an hour ago" },
  { id: "m3", name: "وائل زيدان", nameEn: "Wael Zaidan", email: "wael@rareoud.example", role: "Staff" as const, status: "active" as const, lastActive: "أمس", lastActiveEn: "yesterday" },
];

export const auditLog = [
  { id: "a1", actorAr: "سامر الحلبي", actorEn: "Samer Al-Halabi", actionAr: "أعاد تعيين كلمة مرور التاجر عدنان درويش", actionEn: "Reset trader Adnan Darwish's password", time: "2026-10-28 14:02" },
  { id: "a2", actorAr: "هالة نصر", actorEn: "Hala Nasr", actionAr: "عطّلت حساب التاجر بلال شاهين", actionEn: "Disabled trader Bilal Shaheen's account", time: "2026-10-27 09:40" },
  { id: "a3", actorAr: "سامر الحلبي", actorEn: "Samer Al-Halabi", actionAr: "سجّل الدخول", actionEn: "Signed in", time: "2026-10-28 08:01" },
];

// Brokerage domain (VISION.md section 7) — a fourth, separate domain from
// retail/deals/wholesale. Lifecycle per section 7.1.
export type BrokerageStatus =
  | "SUBMITTED"
  | "NEEDS_INFO"
  | "ACCEPTED"
  | "INSPECTION_SCHEDULED"
  | "INSPECTED"
  | "QUOTE_SENT"
  | "APPROVED"
  | "PURCHASED"
  | "SHIPPED"
  | "DELIVERED"
  | "CLOSED"
  | "DECLINED"
  | "REJECTED"
  | "CANCELLED";

export const brokerageStatusMeta: Record<BrokerageStatus, { ar: string; en: string; tone: StatusTone }> = {
  SUBMITTED: { ar: "جديد", en: "New", tone: "info" },
  NEEDS_INFO: { ar: "بحاجة لمعلومات", en: "Needs Info", tone: "attention" },
  ACCEPTED: { ar: "مقبول للمعاينة", en: "Accepted for Inspection", tone: "progress" },
  INSPECTION_SCHEDULED: { ar: "المعاينة مجدولة", en: "Inspection Scheduled", tone: "progress" },
  INSPECTED: { ar: "تمت المعاينة", en: "Inspected", tone: "progress" },
  QUOTE_SENT: { ar: "العرض بانتظارك", en: "Quote Awaiting You", tone: "attention" },
  APPROVED: { ar: "وافق التاجر", en: "Trader Approved", tone: "success" },
  PURCHASED: { ar: "تم الشراء", en: "Purchased", tone: "success" },
  SHIPPED: { ar: "قيد الشحن", en: "Shipped", tone: "progress" },
  DELIVERED: { ar: "تم التسليم", en: "Delivered", tone: "success" },
  CLOSED: { ar: "مغلق", en: "Closed", tone: "closed" },
  DECLINED: { ar: "مرفوض", en: "Declined", tone: "danger" },
  REJECTED: { ar: "رفض العرض", en: "Quote Rejected", tone: "danger" },
  CANCELLED: { ar: "ملغى", en: "Cancelled", tone: "closed" },
};

// The forward order of the lifecycle's normal path (excludes the three
// terminal rejection states), used to render the trader-side stepper.
export const brokerageLifecycleOrder: BrokerageStatus[] = [
  "SUBMITTED",
  "ACCEPTED",
  "INSPECTION_SCHEDULED",
  "INSPECTED",
  "QUOTE_SENT",
  "APPROVED",
  "PURCHASED",
  "SHIPPED",
  "DELIVERED",
];

export const brokerageRequests = [
  {
    id: "BR-2026-014",
    traderId: "t1",
    descriptionAr: "عود حلبي قديم رأيته في محل أدوات موسيقية — يبدو أصلياً وبحالة جيدة",
    descriptionEn: "An old Aleppo oud I saw at a music shop — looks original and in good condition",
    category: "عود كلاسيكي",
    categoryEn: "Classic Oud",
    quantity: 1,
    city: "حلب",
    cityEn: "Aleppo",
    placeName: "محل آلات الفرات",
    placeNameEn: "Al-Furat Instruments Shop",
    status: "QUOTE_SENT" as BrokerageStatus,
    submittedDate: "2026-10-20",
    budgetMin: 2000,
    budgetMax: 3000,
    inspection: {
      grade: "B" as const,
      notes: "آثار استخدام طبيعية، لا تشققات، الأوتار بحاجة تغيير",
      notesEn: "Normal wear, no cracks, strings need replacing",
      verdict: "موصى بالشراء",
      verdictEn: "Recommended for purchase",
      photos: 4,
    },
    quote: { goodsValue: 2400, commissionRate: 1.5, shipping: 60, validUntil: "2026-11-05" },
  },
  {
    id: "BR-2026-013",
    traderId: "t1",
    descriptionAr: "قانون من ورشة محلية في اللاذقية، مطلوب معاينة قبل أي قرار",
    descriptionEn: "A qanun from a local workshop in Latakia, needs inspection before any decision",
    category: "قانون وآلات وترية",
    categoryEn: "Qanun & Strings",
    quantity: 1,
    city: "اللاذقية",
    cityEn: "Latakia",
    placeName: "ورشة أبو خالد",
    placeNameEn: "Abu Khaled's Workshop",
    status: "INSPECTION_SCHEDULED" as BrokerageStatus,
    submittedDate: "2026-10-24",
    budgetMin: 1500,
    budgetMax: 2200,
    inspection: null,
    quote: null,
  },
  {
    id: "BR-2026-011",
    traderId: "t1",
    descriptionAr: "ناي فارسي معتّق، صورة من بائع عبر فيسبوك ماركت بليس",
    descriptionEn: "An aged Persian ney, photo from a Facebook Marketplace seller",
    category: "قطع نادرة معتّقة",
    categoryEn: "Aged Rarities",
    quantity: 1,
    city: "دمشق",
    cityEn: "Damascus",
    placeName: "—",
    placeNameEn: "—",
    status: "DELIVERED" as BrokerageStatus,
    submittedDate: "2026-09-30",
    budgetMin: 800,
    budgetMax: 1200,
    inspection: {
      grade: "A" as const,
      notes: "حالة ممتازة، موثّقة بشهادة الورشة الأصلية",
      notesEn: "Excellent condition, documented with the original workshop certificate",
      verdict: "موصى بالشراء",
      verdictEn: "Recommended for purchase",
      photos: 6,
    },
    quote: { goodsValue: 950, commissionRate: 2, shipping: 40, validUntil: "2026-10-10" },
  },
  {
    id: "BR-2026-009",
    traderId: "t2",
    descriptionAr: "عود مصري قديم، البائع لا يملك وثائق أصل",
    descriptionEn: "An old Egyptian oud, the seller has no provenance documents",
    category: "عود كلاسيكي",
    categoryEn: "Classic Oud",
    quantity: 1,
    city: "القاهرة",
    cityEn: "Cairo",
    placeName: "سوق خان الخليلي",
    placeNameEn: "Khan el-Khalili Market",
    status: "DECLINED" as BrokerageStatus,
    submittedDate: "2026-10-15",
    budgetMin: 1000,
    budgetMax: 1800,
    inspection: null,
    quote: null,
    declineReason: "خارج نطاق التغطية الجغرافية الحالية",
    declineReasonEn: "Outside the current geographic coverage area",
  },
];

export function greetingForHour(hour: number, name: string, locale: "ar" | "en" = "ar") {
  if (locale === "en") {
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }
  if (hour < 12) return `صباح الخير، ${name}`;
  if (hour < 17) return `نهارك سعيد، ${name}`;
  return `مساء الخير، ${name}`;
}
