import Link from "next/link";
import { Suspense } from "react";
import { Compass, LayoutGrid, List } from "lucide-react";
import { BrokerageAdminFilters } from "@/components/admin/brokerage-filters";
import {
  DataTable,
  DataTableHead,
  RowHit,
  Td,
  Th,
  Tr,
} from "@/components/admin/data-table";
import { BrokerageHeroStrip } from "@/components/brokerage/hero-strip";
import {
  brokerageActorLabel,
  brokerageNextHint,
  brokerageStatusLabel,
  daysSince,
} from "@/components/brokerage/labels";
import { BrokerageStatusBadge } from "@/components/brokerage/status-badge";
import { listAdminBrokerage } from "@/lib/brokerage/service";
import { BROKERAGE_LIFECYCLE, nextActor } from "@/lib/brokerage/status";
import { getRequestDictionary } from "@/lib/i18n/server";
import { localizedName } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COL_ACCENT: Record<string, string> = {
  SUBMITTED: "border-t-[color:var(--ro-plum-700)]",
  AWAITING_PAYMENT: "border-t-[color:var(--ro-amber-500,#efb04a)]",
  PAYMENT_CONFIRMED: "border-t-[color:var(--ro-success-700)]",
  ACCEPTED: "border-t-[color:var(--ro-progress-700,#7eb6ff)]",
  INSPECTION_SCHEDULED: "border-t-[color:var(--ro-progress-700,#7eb6ff)]",
  INSPECTED: "border-t-[color:var(--ro-plum-700)]",
  QUOTE_SENT: "border-t-[color:var(--ro-amber-500,#efb04a)]",
  APPROVED: "border-t-[color:var(--ro-success-700)]",
  PURCHASED: "border-t-[color:var(--ro-success-700)]",
  SHIPPED: "border-t-[color:var(--ro-progress-700,#7eb6ff)]",
  DELIVERED: "border-t-[color:var(--ro-success-700)]",
  CLOSED: "border-t-[color:var(--ro-text-muted)]",
};

function isStaleRow(r: { createdAt: Date; status: string }) {
  return daysSince(r.createdAt) >= 3 && nextActor(r.status) === "admin";
}

export default async function AdminBrokeragePage({
  searchParams,
}: {
  searchParams: Promise<{
    trader?: string;
    city?: string;
    stale?: string;
    status?: string;
  }>;
}) {
  const { locale, dict } = await getRequestDictionary();
  const ar = locale === "ar";
  const u = dict.adminUi;
  const q = await searchParams;
  const traderQ = q.trader?.trim().toLowerCase() ?? "";
  const cityQ = q.city?.trim().toLowerCase() ?? "";
  const staleOnly = q.stale === "1";
  const activeOnly = q.status === "active";
  const allRows = await listAdminBrokerage();

  const textFiltered = allRows.filter((r) => {
    if (traderQ) {
      const hay = `${r.trader.displayName} ${r.trader.email}`.toLowerCase();
      if (!hay.includes(traderQ)) return false;
    }
    if (cityQ) {
      const city = `${r.cityAr} ${r.cityEn}`.toLowerCase();
      if (!city.includes(cityQ)) return false;
    }
    if (
      activeOnly &&
      ["CLOSED", "DECLINED", "REJECTED", "CANCELLED"].includes(r.status)
    ) {
      return false;
    }
    return true;
  });

  const rows = textFiltered.filter((r) => (staleOnly ? isStaleRow(r) : true));
  const TERMINAL = new Set(["CANCELLED", "DECLINED", "REJECTED"]);
  const occupied = new Set(rows.map((r) => r.status));
  const orphanStatuses = [...occupied].filter(
    (s) =>
      !BROKERAGE_LIFECYCLE.includes(s as (typeof BROKERAGE_LIFECYCLE)[number]) &&
      !TERMINAL.has(s)
  );
  /** Occupied work first (visible without scroll), then empty funnel stages. */
  const boardCols = [
    ...BROKERAGE_LIFECYCLE.filter((s) => occupied.has(s)),
    ...orphanStatuses,
    ...BROKERAGE_LIFECYCLE.filter((s) => !occupied.has(s)),
  ];

  const awaitingAdmin = rows.filter((r) => nextActor(r.status) === "admin")
    .length;
  const awaitingTrader = rows.filter((r) => nextActor(r.status) === "trader")
    .length;
  const active = rows.filter(
    (r) =>
      !["CLOSED", "DECLINED", "REJECTED", "CANCELLED"].includes(r.status)
  ).length;
  const stale = textFiltered.filter(isStaleRow).length;

  return (
    <section data-admin-brokerage="" className="space-y-5 pb-16">
      <BrokerageHeroStrip
        eyebrow={ar ? "عمليات" : "Operations"}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Compass
              className="size-7 shrink-0 text-[color:var(--ro-accent-fg,var(--ro-plum-800))]"
              strokeWidth={1.5}
            />
            {dict.admin.brokerage}
          </span>
        }
        subtitle={
          ar
            ? "من استقبال الطلب حتى الإغلاق — كل عمود مرحلة واضحة مع من ينتظر"
            : "From intake to close — each column is a clear stage with who acts next"
        }
        stats={[
          {
            label: ar ? "نشط" : "Active",
            value: active,
            hint: ar ? "طلبات مفتوحة" : "Open requests",
          },
          {
            label: ar ? "ينتظر الإدارة" : "Needs admin",
            value: awaitingAdmin,
          },
          {
            label: ar ? "ينتظر التاجر" : "Needs trader",
            value: awaitingTrader,
          },
          {
            label: ar ? "متأخر ≥3 أيام" : "Stale ≥3d",
            value: stale,
            hint: stale > 0 ? (ar ? "راجع الآن" : "Review now") : undefined,
          },
        ]}
      />

      <Suspense fallback={null}>
        <BrokerageAdminFilters
          tabsLabel={u.filterTabs}
          allLabel={u.filterAll}
          allCount={textFiltered.length}
          staleLabel={ar ? "متأخر فقط" : "Stale only"}
          staleCount={stale}
          traderLabel={ar ? "تاجر" : "Trader"}
          cityLabel={ar ? "مدينة" : "City"}
          searchLabel={u.search}
          clearLabel={dict.catalog.clearFilters}
          resultCount={rows.length}
          resultLabel={u.resultsLabel}
        />
      </Suspense>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--ro-text-muted)]">
        <LayoutGrid className="size-3.5" strokeWidth={1.5} aria-hidden />
        <span>{ar ? "لوحة كانبان" : "Kanban board"}</span>
        <span aria-hidden className="text-[color:var(--ro-border)]">
          ·
        </span>
        <List className="size-3.5" strokeWidth={1.5} aria-hidden />
        <span>{ar ? "جدول كامل أدناه" : "Full table below"}</span>
        <span className="tabular-nums">
          · {rows.length}/{allRows.length}
        </span>
      </div>

      <div
        className="ro-brokerage-board"
        tabIndex={0}
        role="region"
        aria-label={ar ? "لوحة الوساطة" : "Brokerage board"}
      >
        {boardCols.map((status) => {
          const items = rows.filter((r) => r.status === status);
          const label = brokerageStatusLabel(status, locale);
          return (
            <div
              key={status}
              className={`ro-brokerage-col w-[16.5rem] shrink-0 rounded-[14px] border border-t-[3px] p-3.5 ${COL_ACCENT[status] ?? "border-t-[color:var(--ro-plum-700)]"}`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold leading-snug text-[color:var(--ro-text)]">
                  {label}
                </h2>
                <span className="inline-flex min-w-6 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--ro-text)_8%,transparent)] px-1.5 py-0.5 text-xs font-semibold tabular-nums text-[color:var(--ro-text-2)]">
                  {items.length}
                </span>
              </div>
              <p className="mb-3 line-clamp-3 min-h-[3.15rem] text-[0.72rem] leading-relaxed text-[color:var(--ro-text-muted)]">
                {brokerageNextHint(status, locale, "admin")}
              </p>
              <ul className="space-y-2">
                {items.map((r) => {
                  const age = daysSince(r.createdAt);
                  const actor = nextActor(r.status);
                  const hot = actor === "admin";
                  const staleAge = age >= 3 && actor !== "none";
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/admin/brokerage/${r.id}`}
                        className={`ro-brokerage-card block rounded-[12px] p-3 ${hot ? "ro-brokerage-pulse" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="font-mono text-[0.7rem] font-medium text-[color:var(--ro-text-2)]"
                            dir="ltr"
                          >
                            {r.reference}
                          </p>
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] tabular-nums ${
                              staleAge
                                ? "bg-[color:var(--ro-warn-bg,color-mix(in_srgb,#efb04a_18%,transparent))] text-[color:var(--ro-warn,#efb04a)]"
                                : "text-[color:var(--ro-text-muted)]"
                            }`}
                          >
                            {age}d
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-[color:var(--ro-text)]">
                          {localizedName(
                            locale,
                            r.descriptionAr,
                            r.descriptionEn
                          )}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-[color:var(--ro-text-2)]">
                            {r.trader.displayName}
                          </p>
                          <span
                            className={`shrink-0 text-[0.65rem] font-semibold ${
                              actor === "admin"
                                ? "text-[color:var(--ro-accent-fg)]"
                                : actor === "trader"
                                  ? "text-[color:var(--ro-warn,#efb04a)]"
                                  : "text-[color:var(--ro-text-muted)]"
                            }`}
                          >
                            {ar ? "ينتظر: " : "Needs: "}
                            {brokerageActorLabel(r.status, locale)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
                {items.length === 0 ? (
                  <li className="rounded-[12px] border border-dashed border-[color:var(--ro-border-subtle)] bg-[color:color-mix(in_srgb,var(--ro-bg-sunken)_40%,transparent)] py-5 text-center text-[0.7rem] text-[color:var(--ro-text-muted)]">
                    {ar ? "فارغ" : "Empty"}
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-0.5">
          <h2 className="font-display text-base font-semibold text-[color:var(--ro-text)]">
            {ar ? "كل الطلبات" : "All requests"}
          </h2>
          <span className="text-xs tabular-nums text-[color:var(--ro-text-muted)]">
            {rows.length}
          </span>
        </div>
        <div className="hidden md:block">
          <DataTable>
            <DataTableHead>
              <Th>{ar ? "المرجع" : "Ref"}</Th>
              <Th>{ar ? "التاجر" : "Trader"}</Th>
              <Th>{ar ? "الوصف" : "Description"}</Th>
              <Th>{ar ? "العمر" : "Age"}</Th>
              <Th>{ar ? "ينتظر" : "Waiting"}</Th>
              <Th>{ar ? "الحالة" : "Status"}</Th>
              <Th>{ar ? "الخطوة التالية" : "Next"}</Th>
            </DataTableHead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.id} href={`/admin/brokerage/${r.id}`}>
                  <Td>
                    <RowHit href={`/admin/brokerage/${r.id}`}>
                      <span dir="ltr">{r.reference}</span>
                    </RowHit>
                  </Td>
                  <Td>
                    <span className="font-semibold text-[color:var(--ro-text)]">
                      {r.trader.displayName}
                    </span>
                  </Td>
                  <Td className="max-w-[14rem] truncate text-[color:var(--ro-text)]">
                    {localizedName(locale, r.descriptionAr, r.descriptionEn)}
                  </Td>
                  <Td className="tabular-nums text-[color:var(--ro-text-2)]">
                    {daysSince(r.createdAt)}d
                  </Td>
                  <Td className="text-xs font-semibold text-[color:var(--ro-text)]">
                    {brokerageActorLabel(r.status, locale)}
                  </Td>
                  <Td>
                    <BrokerageStatusBadge
                      status={r.status}
                      label={brokerageStatusLabel(r.status, locale)}
                    />
                  </Td>
                  <Td className="max-w-[15rem]">
                    <p className="line-clamp-2 text-xs leading-snug text-[color:var(--ro-text-2)]">
                      {brokerageNextHint(r.status, locale, "admin")}
                    </p>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        </div>
        <ul className="divide-y divide-[color:var(--ro-border-subtle)] overflow-hidden rounded-[14px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] md:hidden">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/brokerage/${r.id}`}
                className="block space-y-2 p-4 transition-[background-color] hover:bg-[color:var(--ro-panel-hover)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="font-mono text-xs font-semibold text-[color:var(--ro-accent-fg)]"
                    dir="ltr"
                  >
                    {r.reference}
                  </p>
                  <span className="text-xs tabular-nums text-[color:var(--ro-text-muted)]">
                    {daysSince(r.createdAt)}d
                  </span>
                </div>
                <p className="text-sm font-medium text-[color:var(--ro-text)]">
                  {r.trader.displayName}
                </p>
                <p className="line-clamp-2 text-xs text-[color:var(--ro-text-muted)]">
                  {localizedName(locale, r.descriptionAr, r.descriptionEn)}
                </p>
                <BrokerageStatusBadge
                  status={r.status}
                  label={brokerageStatusLabel(r.status, locale)}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
