"use client";

import { m } from "motion/react";
import { ShieldCheck } from "lucide-react";
import {
  GRADE_META,
  INSPECTION_RESULT_META,
  checklistScore,
  parseChecklist,
} from "@/lib/brokerage/inspection";
import { useMotion } from "@/components/motion";

/**
 * Animated inspection report: grade ring + a scored table whose rows reveal one by one
 * and whose bars fill. Read-only — shared by the trader page and the admin page.
 */
export function InspectionTable({
  grade,
  checklist,
  verdict,
  notes,
}: {
  grade: string;
  checklist: string;
  verdict: string;
  notes: string;
}) {
  const { lite } = useMotion();
  const rows = parseChecklist(checklist);
  const score = rows ? checklistScore(rows) : null;
  const g = GRADE_META[grade] ?? { label: "", color: "#8a52c4" };
  const R = 42;
  const C = 2 * Math.PI * R;
  const pct = score ?? ({ A: 95, B: 80, C: 60, D: 35 } as Record<string, number>)[grade] ?? 70;

  return (
    <div className="overflow-hidden rounded-3xl border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface)]">
      <div
        className="flex flex-wrap items-center gap-5 p-5 sm:p-6"
        style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${g.color} 18%, transparent), transparent 70%)` }}
      >
        <div className="relative size-[104px] shrink-0">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth="8" />
            <m.circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={g.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={lite ? false : { strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - pct / 100) }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <b className="block text-3xl font-extrabold leading-none" style={{ color: g.color }}>
                {grade}
              </b>
              <span className="text-[10.5px] opacity-70">{score != null ? `${score}%` : g.label}</span>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: g.color }}>
            <ShieldCheck className="size-4" aria-hidden /> تقرير المعاينة · درجة {g.label || grade}
          </p>
          {verdict ? <p className="mt-1.5 text-lg font-bold leading-snug text-[color:var(--rad-tx)]">{verdict}</p> : null}
          {notes ? <p className="mt-1 text-sm leading-relaxed text-[color:var(--rad-tx2)]">{notes}</p> : null}
        </div>
      </div>

      {rows ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-[color:var(--rad-bd)] bg-[color:var(--rad-surface3)] text-[11.5px] font-semibold text-[color:var(--rad-tx3)]">
                <th className="px-4 py-2.5 text-start">البند</th>
                <th className="px-4 py-2.5 text-start">النتيجة</th>
                <th className="w-[28%] px-4 py-2.5 text-start">التقييم</th>
                <th className="px-4 py-2.5 text-start">ملاحظة المعاين</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const meta = INSPECTION_RESULT_META[r.result];
                return (
                  <m.tr
                    key={r.key}
                    className="border-b border-[color:var(--rad-bd)] last:border-0"
                    initial={lite ? false : { opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <td className="px-4 py-3 font-semibold text-[color:var(--rad-tx)]">{r.label}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.result === "na" ? (
                        <span className="text-xs opacity-50">—</span>
                      ) : (
                        <div className="h-2 overflow-hidden rounded-full bg-black/10">
                          <m.div
                            className="h-full rounded-full"
                            style={{ background: meta.color }}
                            initial={lite ? false : { width: 0 }}
                            animate={{ width: `${meta.score}%` }}
                            transition={{ delay: 0.3 + i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[color:var(--rad-tx2)]">{r.note || "—"}</td>
                  </m.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : checklist.trim() ? (
        <p className="whitespace-pre-wrap border-t border-[color:var(--rad-bd)] p-5 text-sm text-[color:var(--rad-tx2)]">{checklist}</p>
      ) : null}
    </div>
  );
}
