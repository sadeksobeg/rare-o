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
  avatarInitials: "س",
};

export const currentTrader = {
  id: "u_trader_1",
  name: "عدنان درويش",
  nameEn: "Adnan Darwish",
  email: "adnan@rareoud.example",
  avatarInitials: "ع",
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
  { id: "t1", name: "عدنان درويش", nameEn: "Adnan Darwish", email: "adnan@rareoud.example", phone: "+963 93 111 2233", status: "active" as const, city: "دمشق", dealsCount: 9, acceptRate: 78, joined: "2026-03-14" },
  { id: "t2", name: "ريم قاسم", nameEn: "Reem Qassem", email: "reem@rareoud.example", phone: "+963 94 222 3344", status: "active" as const, city: "حلب", dealsCount: 4, acceptRate: 62, joined: "2026-05-02" },
  { id: "t3", name: "بلال شاهين", nameEn: "Bilal Shaheen", email: "bilal@rareoud.example", phone: "+963 95 333 4455", status: "disabled" as const, city: "حمص", dealsCount: 1, acceptRate: 30, joined: "2026-01-20" },
];

export const customers = [
  { id: "c1", name: "سارة أحمد", nameEn: "Sara Ahmed", phone: "+963 93 xxx xxxx", requestsCount: 2, lastRequest: "2026-10-18" },
  { id: "c2", name: "ليلى حسن", nameEn: "Layla Hassan", phone: "+963 94 xxx xxxx", requestsCount: 1, lastRequest: "2026-10-19" },
];

export const teamMembers = [
  { id: "m1", name: "سامر الحلبي", nameEn: "Samer Al-Halabi", email: "samer@rareoud.example", role: "Owner" as const, status: "active" as const, lastActive: "قبل 5 دقائق" },
  { id: "m2", name: "هالة نصر", nameEn: "Hala Nasr", email: "hala@rareoud.example", role: "Manager" as const, status: "active" as const, lastActive: "قبل ساعة" },
  { id: "m3", name: "وائل زيدان", nameEn: "Wael Zaidan", email: "wael@rareoud.example", role: "Staff" as const, status: "active" as const, lastActive: "أمس" },
];

export const auditLog = [
  { id: "a1", actorAr: "سامر الحلبي", actorEn: "Samer Al-Halabi", actionAr: "أعاد تعيين كلمة مرور التاجر عدنان درويش", actionEn: "Reset trader Adnan Darwish's password", time: "2026-10-28 14:02" },
  { id: "a2", actorAr: "هالة نصر", actorEn: "Hala Nasr", actionAr: "عطّلت حساب التاجر بلال شاهين", actionEn: "Disabled trader Bilal Shaheen's account", time: "2026-10-27 09:40" },
  { id: "a3", actorAr: "سامر الحلبي", actorEn: "Samer Al-Halabi", actionAr: "سجّل الدخول", actionEn: "Signed in", time: "2026-10-28 08:01" },
];

export function greetingForHour(hour: number, nameAr: string) {
  if (hour < 12) return `صباح الخير، ${nameAr}`;
  if (hour < 17) return `نهارك سعيد، ${nameAr}`;
  return `مساء الخير، ${nameAr}`;
}
