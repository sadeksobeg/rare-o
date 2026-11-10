"use client";

import { useRouter } from "next/navigation";
import {
  DataTable,
  Pill,
  type DataTableColumn,
} from "@/components/ui-kit";
import {
  brokerageActorLabel,
  brokerageNextHint,
  brokerageStatusLabel,
  formatBrokerageAge,
} from "@/components/brokerage/labels";
import { brokeragePillTone } from "@/components/brokerage/status-badge";

export type BrokerageTableRow = {
  id: string;
  reference: string;
  traderName: string;
  description: string;
  createdAt: Date | string;
  status: string;
  href: string;
};

export function BrokerageTable({
  rows,
  locale,
  labels,
}: {
  rows: BrokerageTableRow[];
  locale: string;
  labels: {
    colReference: string;
    colTrader: string;
    colDescription: string;
    colAge: string;
    colWaiting: string;
    colStatus: string;
    colNext: string;
  };
}) {
  const router = useRouter();
  const ar = locale === "ar";

  const columns: DataTableColumn<BrokerageTableRow>[] = [
    {
      id: "reference",
      header: labels.colReference,
      mobileSlot: "id",
      cell: (r) => <span className="rad-mono">{r.reference}</span>,
    },
    {
      id: "trader",
      header: labels.colTrader,
      mobileSlot: "who",
      cell: (r) => <b>{r.traderName}</b>,
    },
    {
      id: "description",
      header: labels.colDescription,
      hideOnMobile: true,
      cell: (r) => (
        <span className="line-clamp-2" style={{ maxWidth: "14rem" }}>
          {r.description}
        </span>
      ),
    },
    {
      id: "age",
      header: labels.colAge,
      hideOnMobile: true,
      cell: (r) => (
        <span className="tabular-nums rad-dim">
          {formatBrokerageAge(r.createdAt, locale)}
        </span>
      ),
    },
    {
      id: "waiting",
      header: labels.colWaiting,
      hideOnMobile: true,
      cell: (r) => (
        <span className="text-xs font-semibold">
          {brokerageActorLabel(r.status, locale)}
        </span>
      ),
    },
    {
      id: "status",
      header: labels.colStatus,
      mobileSlot: "status",
      cell: (r) => (
        <Pill tone={brokeragePillTone(r.status)}>
          {brokerageStatusLabel(r.status, locale)}
        </Pill>
      ),
    },
    {
      id: "next",
      header: labels.colNext,
      hideOnMobile: true,
      cell: (r) => {
        const next = brokerageNextHint(r.status, locale, "admin");
        return (
          <p
            className="line-clamp-2 text-xs leading-snug rad-dim"
            style={{ maxWidth: "15rem", overflowWrap: "anywhere" }}
            title={next}
          >
            {next}
          </p>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(r) => r.id}
      onRowClick={(r) => router.push(r.href)}
      empty={
        <p className="rad-dim p-6 text-center text-sm">
          {ar ? "لا طلبات" : "No requests"}
        </p>
      }
    />
  );
}
