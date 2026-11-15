/** Client-safe inspection checklist helpers (no server imports). */

export type InspectionResult = "excellent" | "good" | "note" | "defect" | "na";

export type InspectionRow = {
  key: string;
  label: string;
  result: InspectionResult;
  note: string;
};

/** The rows every inspection report is scored against — the inspector can edit the notes and add rows. */
export const INSPECTION_TEMPLATE: { key: string; label: string }[] = [
  { key: "overall", label: "الحالة العامة" },
  { key: "material", label: "الخشب والمادة" },
  { key: "craft", label: "الصنعة والتشطيب" },
  { key: "sound", label: "الصوت والرنين" },
  { key: "authenticity", label: "الأصالة والختم" },
  { key: "defects", label: "العيوب والترميمات" },
  { key: "accessories", label: "الملحقات والتغليف" },
];

export const INSPECTION_RESULT_META: Record<
  InspectionResult,
  { label: string; score: number; color: string; bg: string }
> = {
  excellent: { label: "ممتاز", score: 100, color: "#2e9d6a", bg: "rgba(46,157,106,.16)" },
  good: { label: "جيد", score: 75, color: "#5b9bd5", bg: "rgba(91,155,213,.16)" },
  note: { label: "ملاحظة", score: 50, color: "#c98a1a", bg: "rgba(224,160,48,.2)" },
  defect: { label: "عيب", score: 20, color: "#e06060", bg: "rgba(220,80,80,.18)" },
  na: { label: "غير منطبق", score: 0, color: "#8a8090", bg: "rgba(138,128,144,.16)" },
};

export function emptyChecklist(): InspectionRow[] {
  return INSPECTION_TEMPLATE.map((t) => ({ key: t.key, label: t.label, result: "good" as InspectionResult, note: "" }));
}

/** The checklist column holds JSON rows; older reports hold free text — return null for those. */
export function parseChecklist(raw: string | null | undefined): InspectionRow[] | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return null;
    const rows = v
      .map((r) => r as Partial<InspectionRow>)
      .filter((r) => typeof r.label === "string" && typeof r.result === "string" && r.result in INSPECTION_RESULT_META)
      .map((r, i) => ({
        key: String(r.key ?? `r${i}`),
        label: String(r.label),
        result: r.result as InspectionResult,
        note: String(r.note ?? ""),
      }));
    return rows.length ? rows : null;
  } catch {
    return null;
  }
}

/** Overall score 0–100 across scored rows. */
export function checklistScore(rows: InspectionRow[]): number | null {
  const scored = rows.filter((r) => r.result !== "na");
  if (!scored.length) return null;
  return Math.round(scored.reduce((s, r) => s + INSPECTION_RESULT_META[r.result].score, 0) / scored.length);
}

export const GRADE_META: Record<string, { label: string; color: string }> = {
  A: { label: "ممتازة", color: "#2e9d6a" },
  B: { label: "جيدة جداً", color: "#5b9bd5" },
  C: { label: "مقبولة", color: "#c98a1a" },
  D: { label: "ضعيفة", color: "#e06060" },
};
