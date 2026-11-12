"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  shippingExportCsvAction,
  shippingImportCsvAction,
} from "@/app/shipping-admin-actions";
import { Button } from "@/components/ui/button";
import { formErrorClass } from "@/lib/ui/form-classes";

type DiffRow = {
  line: number;
  key: string;
  action: string;
  changes: { field: string; from: unknown; to: unknown }[];
  error: string | null;
};

export function ImportPanel({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [diff, setDiff] = useState<DiffRow[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(apply: boolean) {
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set("csv", csv);
      if (apply) fd.set("apply", "true");
      const res = await shippingImportCsvAction(fd);
      if (!res.ok) {
        setError(res.error);
        const data = res.data as { data?: { diff?: DiffRow[] } } | undefined;
        if (data && typeof data === "object" && "diff" in (data as object)) {
          setDiff((data as { diff: DiffRow[] }).diff);
        }
        return;
      }
      const payload = res.data as {
        diff: DiffRow[];
        counts: Record<string, number>;
        applied: boolean;
      };
      setDiff(payload.diff);
      setCounts(payload.counts);
      if (payload.applied) router.refresh();
    });
  }

  function downloadExport() {
    start(async () => {
      const res = await shippingExportCsvAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const { csv: text } = res.data as { csv: string };
      const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "shipping-rates.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={downloadExport} loading={pending}>
          {ar ? "تصدير CSV" : "Export CSV"}
        </Button>
      </div>
      <label className="block space-y-2 text-sm">
        <span className="font-medium">{ar ? "الصق CSV هنا" : "Paste CSV here"}</span>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={12}
          dir="ltr"
          className="w-full rounded-md border border-[color:var(--rad-bd)] bg-[color:var(--rad-c0)] p-3 font-mono text-xs"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => run(false)} loading={pending} disabled={!csv.trim()}>
          {ar ? "معاينة (بدون كتابة)" : "Dry-run preview"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => run(true)}
          loading={pending}
          disabled={!csv.trim() || !diff || (counts?.error ?? 0) > 0}
        >
          {ar ? "تطبيق الاستيراد" : "Apply import"}
        </Button>
      </div>
      <p className="text-xs text-[color:var(--rad-tx-2)]">
        {ar
          ? "الصفوف الجديدة تُنشأ غير معتمدة دائماً — الاستيراد لا ينشر أسعاراً وحده."
          : "New rows are always created unverified — import never publishes prices alone."}
      </p>
      {error ? (
        <p role="alert" className={formErrorClass}>
          {error}
        </p>
      ) : null}
      {counts ? (
        <p className="text-sm">
          create={counts.create} · update={counts.update} · unchanged={counts.unchanged} · error=
          {counts.error}
        </p>
      ) : null}
      {diff ? (
        <div className="overflow-x-auto rounded-lg border border-[color:var(--rad-bd)]">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="bg-[color:var(--rad-c1)] text-start">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">{ar ? "المفتاح" : "Key"}</th>
                <th className="px-3 py-2">{ar ? "الإجراء" : "Action"}</th>
                <th className="px-3 py-2">{ar ? "التفاصيل" : "Details"}</th>
              </tr>
            </thead>
            <tbody>
              {diff.map((d) => (
                <tr key={`${d.line}-${d.key}`} className="border-t border-[color:var(--rad-bd)]">
                  <td className="px-3 py-2">
                    <bdi dir="ltr">{d.line}</bdi>
                  </td>
                  <td className="px-3 py-2">{d.key}</td>
                  <td className="px-3 py-2">{d.action}</td>
                  <td className="px-3 py-2 text-xs">
                    {d.error
                      ? d.error
                      : d.changes.map((c) => `${c.field}: ${String(c.from)} → ${String(c.to)}`).join("; ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
