/**
 * Localized country / destination labels for shipping UI.
 * Governorate codes (domestic) and ISO country codes share one lookup.
 */
import {
  INTERNATIONAL_ZONES,
  SYRIA_GOVERNORATES,
} from "@/lib/shipping/rates";

const BY_CODE = new Map<string, { nameAr: string; nameEn: string }>();

for (const g of SYRIA_GOVERNORATES) {
  BY_CODE.set(g.code.toLowerCase(), { nameAr: g.nameAr, nameEn: g.nameEn });
  BY_CODE.set(g.code.toUpperCase(), { nameAr: g.nameAr, nameEn: g.nameEn });
}
BY_CODE.set("sy", { nameAr: "سوريا", nameEn: "Syria" });
BY_CODE.set("SY", { nameAr: "سوريا", nameEn: "Syria" });

for (const z of INTERNATIONAL_ZONES) {
  for (const c of z.countries) {
    BY_CODE.set(c.code.toUpperCase(), { nameAr: c.nameAr, nameEn: c.nameEn });
    BY_CODE.set(c.code.toLowerCase(), { nameAr: c.nameAr, nameEn: c.nameEn });
  }
}

export function shippingDestinationLabel(
  codeOrName: string | null | undefined,
  locale: string
): string {
  const raw = (codeOrName ?? "").trim();
  if (!raw) return "—";
  const hit = BY_CODE.get(raw) ?? BY_CODE.get(raw.toUpperCase()) ?? BY_CODE.get(raw.toLowerCase());
  if (hit) return locale === "ar" ? hit.nameAr : hit.nameEn;
  // Already a localized name stored on the request
  if (/[\u0600-\u06FF]/.test(raw) || raw.length > 3) return raw;
  return raw;
}

export function shippingDestinationParts(
  destinationCountry: string | null | undefined,
  destinationCode: string | null | undefined,
  locale: string
): { label: string; code: string | null } {
  const code = destinationCode?.trim() || null;
  if (code) {
    return { label: shippingDestinationLabel(code, locale), code: code.toUpperCase() };
  }
  return {
    label: shippingDestinationLabel(destinationCountry, locale),
    code: null,
  };
}
