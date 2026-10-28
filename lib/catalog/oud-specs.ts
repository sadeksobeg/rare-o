import type { Locale } from "@/lib/i18n/config";

export type BilingualText = { ar: string; en: string };

export type OudWoodSpecs = {
  back?: BilingualText;
  face?: BilingualText;
  pegs?: BilingualText;
  fingerboard?: BilingualText;
  bridge?: BilingualText;
};

export type OudMeasureSpecs = {
  faceWidthMm?: number;
  faceDepthMm?: number;
  faceLengthMm?: number;
  neckLengthMm?: number;
  stringLengthMm?: number;
};

export type OudSpecs = {
  wood?: OudWoodSpecs;
  measures?: OudMeasureSpecs;
  standardNeck?: boolean;
  finish?: BilingualText;
};

export type OudSpecIconKey =
  | "back"
  | "face"
  | "pegs"
  | "fingerboard"
  | "bridge"
  | "faceWidth"
  | "faceDepth"
  | "faceLength"
  | "neckLength"
  | "stringLength"
  | "standardNeck"
  | "finish";

export type OudSpecGroup = "wood" | "measures" | "details";

export type OudSpecItem = {
  key: OudSpecIconKey;
  group: OudSpecGroup;
  value: string;
};

const WOOD_KEYS = [
  "back",
  "face",
  "pegs",
  "fingerboard",
  "bridge",
] as const;

const MEASURE_KEYS = [
  ["faceWidthMm", "faceWidth"],
  ["faceDepthMm", "faceDepth"],
  ["faceLengthMm", "faceLength"],
  ["neckLengthMm", "neckLength"],
  ["stringLengthMm", "stringLength"],
] as const;

export type OudSpecsFormValues = {
  woodBackAr: string;
  woodBackEn: string;
  woodFaceAr: string;
  woodFaceEn: string;
  woodPegsAr: string;
  woodPegsEn: string;
  woodFingerboardAr: string;
  woodFingerboardEn: string;
  woodBridgeAr: string;
  woodBridgeEn: string;
  faceWidthMm: string;
  faceDepthMm: string;
  faceLengthMm: string;
  neckLengthMm: string;
  stringLengthMm: string;
  standardNeck: "" | "yes" | "no";
  finishAr: string;
  finishEn: string;
};

export const EMPTY_OUD_SPECS_FORM: OudSpecsFormValues = {
  woodBackAr: "",
  woodBackEn: "",
  woodFaceAr: "",
  woodFaceEn: "",
  woodPegsAr: "",
  woodPegsEn: "",
  woodFingerboardAr: "",
  woodFingerboardEn: "",
  woodBridgeAr: "",
  woodBridgeEn: "",
  faceWidthMm: "",
  faceDepthMm: "",
  faceLengthMm: "",
  neckLengthMm: "",
  stringLengthMm: "",
  standardNeck: "",
  finishAr: "",
  finishEn: "",
};

function asBilingual(value: unknown): BilingualText | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  const ar = typeof row.ar === "string" ? row.ar.trim() : "";
  const en = typeof row.en === "string" ? row.en.trim() : "";
  if (!ar && !en) return undefined;
  return { ar, en };
}

function asMm(value: unknown): number | undefined {
  if (value === "" || value == null) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 9999) return undefined;
  return Math.round(n * 10) / 10;
}

function loc(locale: Locale, value?: BilingualText): string {
  if (!value) return "";
  return locale === "ar" ? value.ar || value.en : value.en || value.ar;
}

function formatMm(n: number, unit: string): string {
  const shown = Number.isInteger(n) ? String(n) : String(n);
  return `${shown} ${unit}`;
}

export function parseOudSpecs(value: unknown): OudSpecs | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const woodRaw =
    raw.wood && typeof raw.wood === "object" && !Array.isArray(raw.wood)
      ? (raw.wood as Record<string, unknown>)
      : {};
  const wood: OudWoodSpecs = {};
  for (const key of WOOD_KEYS) {
    const next = asBilingual(woodRaw[key]);
    if (next) wood[key] = next;
  }

  const measuresRaw =
    raw.measures &&
    typeof raw.measures === "object" &&
    !Array.isArray(raw.measures)
      ? (raw.measures as Record<string, unknown>)
      : {};
  const measures: OudMeasureSpecs = {};
  for (const [field] of MEASURE_KEYS) {
    const next = asMm(measuresRaw[field]);
    if (next != null) measures[field] = next;
  }

  let standardNeck: boolean | undefined;
  if (raw.standardNeck === true || raw.standardNeck === "yes") {
    standardNeck = true;
  } else if (raw.standardNeck === false || raw.standardNeck === "no") {
    standardNeck = false;
  }

  const finish = asBilingual(raw.finish);
  const specs: OudSpecs = {};
  if (Object.keys(wood).length > 0) specs.wood = wood;
  if (Object.keys(measures).length > 0) specs.measures = measures;
  if (standardNeck !== undefined) specs.standardNeck = standardNeck;
  if (finish) specs.finish = finish;
  return Object.keys(specs).length > 0 ? specs : null;
}

export function oudSpecsFromFormData(formData: FormData): OudSpecs | null {
  return parseOudSpecs({
    wood: {
      back: {
        ar: String(formData.get("oudWoodBackAr") ?? ""),
        en: String(formData.get("oudWoodBackEn") ?? ""),
      },
      face: {
        ar: String(formData.get("oudWoodFaceAr") ?? ""),
        en: String(formData.get("oudWoodFaceEn") ?? ""),
      },
      pegs: {
        ar: String(formData.get("oudWoodPegsAr") ?? ""),
        en: String(formData.get("oudWoodPegsEn") ?? ""),
      },
      fingerboard: {
        ar: String(formData.get("oudWoodFingerboardAr") ?? ""),
        en: String(formData.get("oudWoodFingerboardEn") ?? ""),
      },
      bridge: {
        ar: String(formData.get("oudWoodBridgeAr") ?? ""),
        en: String(formData.get("oudWoodBridgeEn") ?? ""),
      },
    },
    measures: {
      faceWidthMm: String(formData.get("oudFaceWidthMm") ?? ""),
      faceDepthMm: String(formData.get("oudFaceDepthMm") ?? ""),
      faceLengthMm: String(formData.get("oudFaceLengthMm") ?? ""),
      neckLengthMm: String(formData.get("oudNeckLengthMm") ?? ""),
      stringLengthMm: String(formData.get("oudStringLengthMm") ?? ""),
    },
    standardNeck: String(formData.get("oudStandardNeck") ?? ""),
    finish: {
      ar: String(formData.get("oudFinishAr") ?? ""),
      en: String(formData.get("oudFinishEn") ?? ""),
    },
  });
}

export function oudSpecsFormDefaults(
  specs: OudSpecs | null | undefined
): OudSpecsFormValues {
  const parsed = parseOudSpecs(specs);
  if (!parsed) return { ...EMPTY_OUD_SPECS_FORM };
  const mm = (n?: number) => (n == null ? "" : String(n));
  return {
    woodBackAr: parsed.wood?.back?.ar ?? "",
    woodBackEn: parsed.wood?.back?.en ?? "",
    woodFaceAr: parsed.wood?.face?.ar ?? "",
    woodFaceEn: parsed.wood?.face?.en ?? "",
    woodPegsAr: parsed.wood?.pegs?.ar ?? "",
    woodPegsEn: parsed.wood?.pegs?.en ?? "",
    woodFingerboardAr: parsed.wood?.fingerboard?.ar ?? "",
    woodFingerboardEn: parsed.wood?.fingerboard?.en ?? "",
    woodBridgeAr: parsed.wood?.bridge?.ar ?? "",
    woodBridgeEn: parsed.wood?.bridge?.en ?? "",
    faceWidthMm: mm(parsed.measures?.faceWidthMm),
    faceDepthMm: mm(parsed.measures?.faceDepthMm),
    faceLengthMm: mm(parsed.measures?.faceLengthMm),
    neckLengthMm: mm(parsed.measures?.neckLengthMm),
    stringLengthMm: mm(parsed.measures?.stringLengthMm),
    standardNeck:
      parsed.standardNeck === true
        ? "yes"
        : parsed.standardNeck === false
          ? "no"
          : "",
    finishAr: parsed.finish?.ar ?? "",
    finishEn: parsed.finish?.en ?? "",
  };
}

export function collectOudSpecItems(
  specs: OudSpecs | null | undefined,
  locale: Locale,
  unit: string,
  yesLabel: string,
  noLabel: string
): OudSpecItem[] {
  const parsed = parseOudSpecs(specs);
  if (!parsed) return [];
  const items: OudSpecItem[] = [];
  for (const key of WOOD_KEYS) {
    const value = loc(locale, parsed.wood?.[key]);
    if (value) items.push({ key, group: "wood", value });
  }
  for (const [field, key] of MEASURE_KEYS) {
    const n = parsed.measures?.[field];
    if (n != null) {
      items.push({ key, group: "measures", value: formatMm(n, unit) });
    }
  }
  if (parsed.standardNeck !== undefined) {
    items.push({
      key: "standardNeck",
      group: "details",
      value: parsed.standardNeck ? yesLabel : noLabel,
    });
  }
  const finish = loc(locale, parsed.finish);
  if (finish) items.push({ key: "finish", group: "details", value: finish });
  return items;
}
