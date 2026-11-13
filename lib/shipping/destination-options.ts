import { ISO_COUNTRY_CODES } from "@/lib/shipping/iso-countries";
import {
  INTERNATIONAL_ZONES,
  SYRIA_GOVERNORATES,
} from "@/lib/shipping/rates";

export type DestinationOption = {
  code: string;
  nameAr: string;
  nameEn: string;
  flag: string;
  kind: "syria" | "intl";
};

function intlNames(): Map<string, { nameAr: string; nameEn: string }> {
  const map = new Map<string, { nameAr: string; nameEn: string }>();
  let ar: Intl.DisplayNames | null = null;
  let en: Intl.DisplayNames | null = null;
  try {
    ar = new Intl.DisplayNames(["ar"], { type: "region" });
    en = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    /* ignore */
  }
  for (const code of ISO_COUNTRY_CODES) {
    map.set(code, {
      nameAr: ar?.of(code) ?? code,
      nameEn: en?.of(code) ?? code,
    });
  }
  for (const z of INTERNATIONAL_ZONES) {
    for (const c of z.countries) {
      map.set(c.code, { nameAr: c.nameAr, nameEn: c.nameEn });
    }
  }
  // Notebook destinations that may only price after verify
  map.set("LB", { nameAr: "لبنان", nameEn: "Lebanon" });
  map.set("JO", { nameAr: "الأردن", nameEn: "Jordan" });
  map.set("SA", { nameAr: "السعودية", nameEn: "Saudi Arabia" });
  map.set("AE", { nameAr: "الإمارات", nameEn: "United Arab Emirates" });
  return map;
}

let cached: DestinationOption[] | null = null;

/** Syria governorates first, then all ISO countries (searchable combobox). */
export function listDestinationOptions(): DestinationOption[] {
  if (cached) return cached;
  const names = intlNames();
  const syria: DestinationOption[] = SYRIA_GOVERNORATES.map((g) => ({
    code: g.code,
    nameAr: g.nameAr,
    nameEn: g.nameEn,
    flag: "SY",
    kind: "syria" as const,
  }));
  const intl: DestinationOption[] = [...names.entries()]
    .map(([code, n]) => ({
      code,
      nameAr: n.nameAr,
      nameEn: n.nameEn,
      flag: code,
      kind: "intl" as const,
    }))
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  cached = [...syria, ...intl];
  return cached;
}
