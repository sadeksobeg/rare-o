/** Shared quote UI types + badge helpers (customer surfaces). */

export type QuoteMethodUi = {
  code: string;
  labelAr: string;
  labelEn: string;
  mode: string | null;
  speed: string | null;
  security: string | null;
  consolidation: boolean;
  note: string | null;
  amount: number;
  currency: string;
  alternate: { amount: number; currency: string } | null;
};

export type QuoteOkUi = {
  ok: true;
  methods: QuoteMethodUi[];
  inquiry: boolean;
  inquiryReason: string | null;
  inquiryNote: { ar: string; en: string } | null;
  weightKg: number | null;
};

export type MethodBadge = "cheapest" | "fastest" | "securest";

const DEST_KEY = "ro_shipping_dest_v1";

export function readRememberedDestination(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(DEST_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function rememberDestination(code: string) {
  if (typeof window === "undefined") return;
  try {
    if (code) localStorage.setItem(DEST_KEY, code);
    else localStorage.removeItem(DEST_KEY);
  } catch {
    /* ignore */
  }
}

/** Speed rank — lower is faster. Unknown → large. */
function speedRank(speed: string | null): number {
  const s = (speed || "").toUpperCase();
  if (s.includes("EXPRESS") || s.includes("FAST") || s === "AIR") return 1;
  if (s.includes("STANDARD") || s === "LAND") return 3;
  if (s.includes("SLOW") || s.includes("ECONOMY")) return 5;
  if (s.includes("AIR")) return 2;
  if (s.includes("LAND") || s.includes("SEA")) return 4;
  return 9;
}

function securityRank(security: string | null): number {
  const s = (security || "").toUpperCase();
  if (s.includes("HIGH") || s.includes("SECURE") || s.includes("VIP")) return 3;
  if (s.includes("MED") || s.includes("STANDARD")) return 2;
  if (s.includes("LOW") || s.includes("BASIC")) return 1;
  return 0;
}

/**
 * Data-driven badges. Ties: first method in list wins for that badge.
 * Fastest uses mode AIR as a soft hint when speed is null.
 */
export function computeMethodBadges(
  methods: QuoteMethodUi[]
): Map<string, MethodBadge[]> {
  const map = new Map<string, MethodBadge[]>();
  if (methods.length === 0) return map;
  for (const m of methods) map.set(m.code, []);

  let cheapest = methods[0]!;
  for (const m of methods) {
    if (m.amount < cheapest.amount) cheapest = m;
  }
  map.get(cheapest.code)!.push("cheapest");

  let fastest = methods[0]!;
  let bestSpeed = speedRank(fastest.speed ?? fastest.mode);
  for (const m of methods) {
    const r = speedRank(m.speed ?? m.mode);
    if (r < bestSpeed) {
      fastest = m;
      bestSpeed = r;
    }
  }
  map.get(fastest.code)!.push("fastest");

  let securest = methods[0]!;
  let bestSec = securityRank(securest.security);
  for (const m of methods) {
    const r = securityRank(m.security);
    if (r > bestSec) {
      securest = m;
      bestSec = r;
    }
  }
  if (bestSec > 0) {
    map.get(securest.code)!.push("securest");
  }

  return map;
}

export function badgeLabel(
  badge: MethodBadge,
  locale: "ar" | "en"
): string {
  if (badge === "cheapest") return locale === "ar" ? "الأرخص" : "Cheapest";
  if (badge === "fastest") return locale === "ar" ? "الأسرع" : "Fastest";
  return locale === "ar" ? "الأعلى أماناً" : "Most secure";
}

export function modeLabel(mode: string | null | undefined, locale: "ar" | "en"): string {
  const m = (mode || "").toUpperCase();
  if (m === "LAND" || m.includes("LAND")) return locale === "ar" ? "بري" : "Land";
  if (m === "AIR" || m.includes("AIR")) return locale === "ar" ? "جوي" : "Air";
  if (m === "SEA" || m.includes("SEA")) return locale === "ar" ? "بحري" : "Sea";
  return mode || "";
}

export function speedLabel(speed: string | null | undefined, locale: "ar" | "en"): string {
  const s = (speed || "").toUpperCase();
  if (!s) return "";
  if (s.includes("FAST") || s.includes("EXPRESS")) return locale === "ar" ? "سريع" : "Fast";
  if (s.includes("SLOW") || s.includes("ECONOMY")) return locale === "ar" ? "بطيء" : "Slow";
  if (s.includes("STANDARD")) return locale === "ar" ? "قياسي" : "Standard";
  return speed || "";
}

export function securityLabel(
  security: string | null | undefined,
  locale: "ar" | "en"
): string {
  const s = (security || "").toUpperCase();
  if (!s) return "";
  if (s.includes("HIGH") || s.includes("SECURE")) return locale === "ar" ? "أمان عالٍ" : "High security";
  if (s.includes("MED")) return locale === "ar" ? "أمان متوسط" : "Medium security";
  if (s.includes("LOW") || s.includes("BASIC")) return locale === "ar" ? "أمان أساسي" : "Basic security";
  return security || "";
}

export function inquiryReasonLabel(
  reason: string | null | undefined,
  locale: "ar" | "en"
): string {
  switch ((reason || "").toUpperCase()) {
    case "NO_METHOD":
      return locale === "ar"
        ? "لا تتوفر طريقة شحن معتمدة لهذه الوجهة حالياً."
        : "No verified shipping method for this destination yet.";
    case "MAX_WEIGHT":
      return locale === "ar"
        ? "الوزن أعلى من الحد الأقصى للطرق المتاحة — نجهّز عرض سعر خاصاً."
        : "Weight is above the available methods’ limit — we’ll prepare a custom quote.";
    case "BELOW_TIER_FLOOR":
      return locale === "ar"
        ? "الوزن دون الحد الأدنى لهذه الوجهة — نجهّز عرض سعر خاصاً."
        : "Weight is below this destination’s floor — we’ll prepare a custom quote.";
    case "WEIGHT_REQUIRED":
      return locale === "ar"
        ? "يلزم تحديد الوزن لعرض الأسعار — أكمل الطلب لعرض سعر يدوي."
        : "Weight is required to price this route — complete the request for a manual quote.";
    case "RESTRICTED_CLASS":
      return locale === "ar"
        ? "صنف المنتج يقيّد بعض طرق الشحن — سنتواصل لتأكيد الأنسب."
        : "Product class restricts some methods — we’ll confirm the best option.";
    default:
      return locale === "ar"
        ? "سنؤكّد تكلفة الشحن بعرض سعر مخصص."
        : "We’ll confirm shipping with a custom quote.";
  }
}

export function weightSourceLabel(
  source: string | null | undefined,
  locale: "ar" | "en"
): string {
  const s = (source || "").toLowerCase();
  if (s === "explicit" || s === "manual")
    return locale === "ar" ? "وزن مُدخل" : "Entered weight";
  if (s === "products") return locale === "ar" ? "من المنتجات" : "From products";
  if (s === "heuristic") return locale === "ar" ? "تقدير تلقائي" : "Estimated";
  if (s === "mixed") return locale === "ar" ? "مزيج" : "Mixed";
  return source || "";
}

/** Customer-facing shipping amount line — never "0 USD" for inquiry. */
export function shippingEstimateDisplay(
  selection: {
    amount: number;
    currency: string;
    inquiry?: boolean;
  } | null,
  locale: "ar" | "en"
): string {
  if (!selection) return "—";
  if (selection.inquiry || selection.amount <= 0) {
    return locale === "ar" ? "يُحدَّد بعرض سعر" : "Quoted on request";
  }
  return `${selection.amount} ${selection.currency}`;
}

/** Collapse duplicated mode phrasing from legacy seed labels. */
export function tidyMethodLabel(label: string): string {
  return label
    .replace(/\s*\(شحن جوي\)\s*[—–-]\s*شحن جوي/g, " — شحن جوي")
    .replace(/\s*\(Air\)\s*[—–-]\s*Air shipping/gi, " — Air shipping")
    .replace(/\s{2,}/g, " ")
    .trim();
}
