import Link from "next/link";
import { Suspense } from "react";
import { LayoutGrid, List } from "lucide-react";
import { BrokerageAdminFilters } from "@/components/admin/brokerage-filters";
import { BrokerageTable } from "@/components/admin/rad/brokerage-table";
import {
  brokerageActorLabel,
  brokerageNextHint,
  brokerageStatusLabel,
  daysSince,
  formatBrokerageAge,
} from "@/components/brokerage/labels";
import { Card, CardHeader } from "@/components/ui-kit";
import { listAdminBrokerage } from "@/lib/brokerage/service";
import { BROKERAGE_LIFECYCLE, nextActor } from "@/lib/brokerage/status";
import { getRequestDictionary } from "@/lib/i18n/server";
import { localizedName } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COL_ACCENT: Record<string, string> = {
  SUBMITTED: "border-t-[color:var(--rad-acf)]",
  AWAITING_PAYMENT: "border-t-[color:var(--rad-warn)]",
  PAYMENT_CONFIRMED: "border-t-[color:var(--rad-ok)]",
  ACCEPTED: "border-t-[color:var(--rad-info)]",
  INSPECTION_SCHEDULED: "border-t-[color:var(--rad-info)]",
  INSPECTED: "border-t-[color:var(--rad-acf)]",
  QUOTE_SENT: "border-t-[color:var(--rad-warn)]",
  APPROVED: "border-t-[color:var(--rad-ok)]",
  PURCHASED: "border-t-[color:var(--rad-ok)]",
  SHIPPED: "border-t-[color:var(--rad-info)]",
  DELIVERED: "border-t-[color:var(--rad-ok)]",
  CLOSED: "border-t-[color:var(--rad-tx3)]",
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
      <header className="rad-phead">
        <div>
          <h1>{dict.admin.brokerage}</h1>
          <p>
            {ar
              ? "من استقبال الطلب حتى الإغلاق — كل عمود مرحلة واضحة مع من ينتظر"
              : "From intake to close — each column is a clear stage with who acts next"}
            {" · "}
            <span className="tabular-nums">
              {active} {ar ? "نشط" : "active"} · {awaitingAdmin}{" "}
              {ar ? "للإدارة" : "admin"} · {awaitingTrader}{" "}
              {ar ? "للتاجر" : "trader"}
              {stale > 0
                ? ` · ${stale} ${ar ? "متأخر" : "stale"}`
                : ""}
            </span>
          </p>
        </div>
      </header>

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

      <div
        className="flex flex-wrap items-center gap-2 text-xs"
        style={{ color: "var(--rad-tx3)" }}
      >
        <LayoutGrid className="size-3.5" strokeWidth={1.5} aria-hidden />
        <span>{ar ? "لوحة كانبان" : "Kanban board"}</span>
        <span aria-hidden>·</span>
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
              className={`ro-brokerage-col w-[16.5rem] shrink-0 rounded-[14px] border border-t-[3px] p-3.5 ${COL_ACCENT[status] ?? "border-t-[color:var(--rad-acf)]"}`}
              style={{
                borderColor: "var(--rad-bd)",
                background: "var(--rad-surface)",
              }}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2
                  className="text-sm font-semibold leading-snug"
                  style={{ color: "var(--rad-tx)" }}
                >
                  {label}
                </h2>
                <span
                  className="inline-flex min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums"
                  style={{
                    background: "var(--rad-surface3)",
                    color: "var(--rad-tx2)",
                  }}
                >
                  {items.length}
                </span>
              </div>
              <p
                className="mb-3 line-clamp-3 min-h-[3.15rem] text-[0.72rem] leading-relaxed"
                style={{ color: "var(--rad-tx3)" }}
              >
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
                        style={{
                          background: "var(--rad-surface2)",
                          border: "1px solid var(--rad-bd)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="font-mono text-[0.7rem] font-medium"
                            style={{ color: "var(--rad-tx2)" }}
                            dir="ltr"
                          >
                            {r.reference}
                          </p>
                          <span
                            className="shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] tabular-nums"
                            style={
                              staleAge
                                ? {
                                    background: "var(--rad-warns)",
                                    color: "var(--rad-warn)",
                                  }
                                : { color: "var(--rad-tx3)" }
                            }
                          >
                            {formatBrokerageAge(r.createdAt, locale)}
                          </span>
                        </div>
                        <p
                          className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug"
                          style={{ color: "var(--rad-tx)" }}
                        >
                          {localizedName(
                            locale,
                            r.descriptionAr,
                            r.descriptionEn
                          )}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p
                            className="truncate text-xs"
                            style={{ color: "var(--rad-tx2)" }}
                          >
                            {r.trader.displayName}
                          </p>
                          <span
                            className="shrink-0 text-[0.65rem] font-semibold"
                            style={{
                              color:
                                actor === "admin"
                                  ? "var(--rad-ac)"
                                  : actor === "trader"
                                    ? "var(--rad-warn)"
                                    : "var(--rad-tx3)",
                            }}
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
                  <li
                    className="rounded-[12px] border border-dashed py-5 text-center text-[0.7rem]"
                    style={{
                      borderColor: "var(--rad-bd)",
                      background: "var(--rad-surface3)",
                      color: "var(--rad-tx3)",
                    }}
                  >
                    {ar ? "فارغ" : "Empty"}
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>

      <Card padded={false} className="overflow-hidden">
        <CardHeader
          title={ar ? "كل الطلبات" : "All requests"}
          count={rows.length}
        />
        <BrokerageTable
          locale={locale}
          rows={rows.map((r) => ({
            id: r.id,
            reference: r.reference,
            traderName: r.trader.displayName,
            description: localizedName(
              locale,
              r.descriptionAr,
              r.descriptionEn
            ),
            createdAt: r.createdAt,
            status: r.status,
            href: `/admin/brokerage/${r.id}`,
          }))}
          labels={{
            colReference: ar ? "المرجع" : "Ref",
            colTrader: ar ? "التاجر" : "Trader",
            colDescription: ar ? "الوصف" : "Description",
            colAge: ar ? "العمر" : "Age",
            colWaiting: ar ? "ينتظر" : "Waiting",
            colStatus: ar ? "الحالة" : "Status",
            colNext: ar ? "الخطوة التالية" : "Next",
          }}
        />
      </Card>
    </section>
  );
}
