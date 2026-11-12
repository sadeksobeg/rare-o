"use client";

import { useRouter } from "next/navigation";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui-kit/data-table";
import { Pill } from "@/components/ui-kit/pill";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import type { StatusTone } from "@/lib/ui/status";

export type DealsTableRow = {
  id: string;
  href: string;
  reference: string;
  title: string;
  kindLabel: string;
  statusLabel: string;
  waitingLabel: string | null;
  tone: StatusTone;
  amount: string;
  updatedLabel: string;
  messages: number;
  flash?: boolean;
};

export function DealsTable({
  rows,
  labels,
}: {
  rows: DealsTableRow[];
  labels: {
    reference: string;
    title: string;
    kind: string;
    status: string;
    updated: string;
    amount: string;
    messages: string;
  };
}) {
  const router = useRouter();

  const columns: DataTableColumn<DealsTableRow>[] = [
    {
      id: "reference",
      header: labels.reference,
      mobileSlot: "id",
      cell: (r) => (
        <span className="rad-mono text-[13px] font-semibold text-[color:var(--rad-tx)]">
          {r.reference}
        </span>
      ),
    },
    {
      id: "title",
      header: labels.title,
      mobileSlot: "who",
      cell: (r) => (
        <span className="block min-w-0 space-y-1">
          <span className="block truncate font-semibold" title={r.title}>
            {r.title}
          </span>
          <span className="flex flex-wrap items-center gap-1.5 min-[901px]:hidden">
            <Pill tone={statusToneToPill(r.tone)}>{r.statusLabel}</Pill>
            {r.waitingLabel ? <Pill tone="warn">{r.waitingLabel}</Pill> : null}
          </span>
        </span>
      ),
    },
    {
      id: "amount",
      header: labels.amount,
      mobileSlot: "status",
      className: "tabular-nums whitespace-nowrap",
      cell: (r) => (
        <span className="block min-w-0 text-end min-[901px]:text-start">
          <span className="block font-semibold text-[color:var(--rad-tx)]">
            {r.amount}
          </span>
          <span className="mt-0.5 block text-[11.5px] text-[color:var(--rad-tx3)] min-[901px]:hidden">
            {r.updatedLabel}
          </span>
        </span>
      ),
    },
    {
      id: "status",
      header: labels.status,
      hideOnMobile: true,
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-1.5">
          <Pill tone={statusToneToPill(r.tone)}>{r.statusLabel}</Pill>
          {r.waitingLabel ? <Pill tone="warn">{r.waitingLabel}</Pill> : null}
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
    {
      id: "kind",
      header: labels.kind,
      hideOnMobile: true,
      cell: (r) => (
        <span className="text-[color:var(--rad-tx3)]">{r.kindLabel}</span>
      ),
    },
    {
      id: "messages",
      header: labels.messages,
      hideOnMobile: true,
      className: "tabular-nums w-[1%] whitespace-nowrap",
      cell: (r) => r.messages,
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
