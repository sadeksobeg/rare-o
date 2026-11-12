"use client";

import { useRouter } from "next/navigation";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui-kit/data-table";
import { Pill } from "@/components/ui-kit/pill";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import type { StatusTone } from "@/lib/ui/status";

export type WholesaleTableRow = {
  id: string;
  href: string;
  reference: string;
  modeLabel: string;
  statusLabel: string;
  waitingLabel: string | null;
  tone: StatusTone;
  lines: number;
  updatedLabel: string;
};

export function WholesaleTable({
  rows,
  labels,
}: {
  rows: WholesaleTableRow[];
  labels: {
    reference: string;
    mode: string;
    status: string;
    lines: string;
    updated: string;
    linesCount: string;
  };
}) {
  const router = useRouter();

  const columns: DataTableColumn<WholesaleTableRow>[] = [
    {
      id: "reference",
      header: labels.reference,
      mobileSlot: "id",
      cell: (r) => (
        <span className="rad-mono text-[13px] font-semibold">{r.reference}</span>
      ),
    },
    {
      id: "mode",
      header: labels.mode,
      mobileSlot: "who",
      cell: (r) => (
        <span className="block min-w-0 space-y-1">
          <span className="block font-semibold">{r.modeLabel}</span>
          <span className="flex flex-wrap gap-1.5 min-[901px]:hidden">
            <Pill tone={statusToneToPill(r.tone)}>{r.statusLabel}</Pill>
            {r.waitingLabel ? <Pill tone="warn">{r.waitingLabel}</Pill> : null}
          </span>
        </span>
      ),
    },
    {
      id: "status",
      header: labels.status,
      hideOnMobile: true,
      cell: (r) => (
        <span className="flex flex-wrap gap-1.5">
          <Pill tone={statusToneToPill(r.tone)}>{r.statusLabel}</Pill>
          {r.waitingLabel ? <Pill tone="warn">{r.waitingLabel}</Pill> : null}
        </span>
      ),
    },
    {
      id: "lines",
      header: labels.lines,
      mobileSlot: "status",
      className: "tabular-nums",
      cell: (r) => (
        <span className="block text-end min-[901px]:text-start">
          <span className="font-semibold min-[901px]:hidden">
            {labels.linesCount}: {r.lines}
          </span>
          <span className="hidden font-semibold min-[901px]:inline">
            {r.lines}
          </span>
          <span className="mt-0.5 block text-[11.5px] text-[color:var(--rad-tx3)] min-[901px]:hidden">
            {r.updatedLabel}
          </span>
        </span>
      ),
    },
    {
      id: "updated",
      header: labels.updated,
      hideOnMobile: true,
      className: "whitespace-nowrap text-[color:var(--rad-tx2)]",
      cell: (r) => r.updatedLabel,
    },
  ];

  return (
    <DataTable
      rows={rows}
      getRowId={(r) => r.id}
      columns={columns}
      onRowClick={(r) => router.push(r.href)}
      className="min-w-0"
    />
  );
}
