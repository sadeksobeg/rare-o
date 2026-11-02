import Link from "next/link";
import { Suspense } from "react";
import { Compass, LayoutGrid, List } from "lucide-react";
import { BrokerageAdminFilters } from "@/components/admin/brokerage-filters";
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
  SUBMITTED: "border-t-[var(--ro-plum-700)]",
  ACCEPTED: "border-t-[var(--ro-progress-700)]",
  INSPECTION_SCHEDULED: "border-t-[var(--ro-progress-700)]",
  INSPECTED: "border-t-[var(--ro-plum-700)]",
  QUOTE_SENT: "border-t-[var(--ro-amber-500)]",
  APPROVED: "border-t-[var(--ro-success-700)]",
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
  const boardCols = BROKERAGE_LIFECYCLE.slice(0, 6);

  const awaitingAdmin = rows.filter((r) => nextActor(r.status) === "admin").length;
  const awaitingTrader = rows.filter((r) => nextActor(r.status) === "trader").length;
  const active = rows.filter(
    (r) =>
      !["CLOSED", "DECLINED", "REJECTED", "CANCELLED"].includes(r.status)
  ).length;
  const stale = textFiltered.filter(isStaleRow).length;

  return (
    <section className="space-y-6">
      <BrokerageHeroStrip
        eyebrow={ar ? "عمليات" : "Operations"}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Compass
              className="size-7 shrink-0 text-[var(--ro-plum-800)]"
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

      <div className="flex items-center gap-2 text-xs text-[var(--ro-ink-500)]">
        <LayoutGrid className="size-3.5" strokeWidth={1.5} />
        <span>{ar ? "لوحة كانبان" : "Kanban board"}</span>
        <span aria-hidden className="text-[var(--ro-border)]">
          ·
        </span>
        <List className="size-3.5" strokeWidth={1.5} />
        <span>{ar ? "جدول كامل أدناه" : "Full table below"}</span>
        <span className="tabular-nums">
          · {rows.length}/{allRows.length}
        </span>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pb-2"
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
              className={`ro-brokerage-col w-[16.5rem] shrink-0 rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] border-t-[3px] p-3 ${COL_ACCENT[status] ?? "border-t-[var(--ro-plum-300)]"}`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-ro-ink">{label}</h2>
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--ro-sand-100)] px-1.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--ro-ink-700)]">
                  {items.length}
                </span>
              </div>
              <p className="mb-3 line-clamp-2 text-[0.65rem] leading-snug text-[var(--ro-ink-500)]">
                {brokerageNextHint(status, locale, "admin")}
              </p>
              <ul className="space-y-2">
                {items.map((r) => {
                  const age = daysSince(r.createdAt);
                  const actor = nextActor(r.status);
                  const hot = actor === "admin";
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/admin/brokerage/${r.id}`}
                        className={`ro-brokerage-card block rounded-[var(--ro-r-md)] border border-transparent bg-[var(--ro-sand-100)] p-3 ${hot ? "ro-brokerage-pulse" : ""} hover:border-[var(--ro-plum-300)] hover:bg-[color-mix(in_srgb,var(--ro-plum-50)_75%,var(--ro-sand-100))]`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="font-mono text-[0.7rem] text-[var(--ro-ink-500)]"
                            dir="ltr"
                          >
                            {r.reference}
                          </p>
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] tabular-nums ${
                              age >= 3
                                ? "bg-[var(--ro-amber-100)] text-[var(--ro-amber-800)]"
                                : "text-[var(--ro-ink-500)]"
                            }`}
                          >
                            {age}d
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-ro-ink">
                          {localizedName(
                            locale,
                            r.descriptionAr,
                            r.descriptionEn
                          )}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-[var(--ro-ink-600)]">
                            {r.trader.displayName}
                          </p>
                          <span
                            className={`shrink-0 text-[0.65rem] font-semibold ${
                              actor === "admin"
                                ? "text-[var(--ro-plum-900)]"
                                : actor === "trader"
                                  ? "text-[var(--ro-amber-800)]"
                                  : "text-[var(--ro-ink-500)]"
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
                  <li className="rounded-[var(--ro-r-md)] border border-dashed border-[var(--ro-border)] py-8 text-center text-xs text-[var(--ro-ink-500)]">
                    —
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--ro-border-subtle)] px-4 py-3">
          <h2 className="font-display text-base font-semibold text-ro-ink">
            {ar ? "كل الطلبات" : "All requests"}
          </h2>
          <span className="text-xs tabular-nums text-[var(--ro-ink-500)]">
            {rows.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[color-mix(in_srgb,var(--ro-sand-100)_80%,transparent)] text-start text-xs text-[var(--ro-ink-600)]">
              <tr>
                <th className="px-4 py-3 font-medium">
                  {ar ? "المرجع" : "Ref"}
                </th>
                <th className="px-4 py-3 font-medium">
                  {ar ? "التاجر" : "Trader"}
                </th>
                <th className="px-4 py-3 font-medium">
                  {ar ? "الوصف" : "Description"}
                </th>
                <th className="px-4 py-3 font-medium">{ar ? "العمر" : "Age"}</th>
                <th className="px-4 py-3 font-medium">
                  {ar ? "ينتظر" : "Waiting"}
                </th>
                <th className="px-4 py-3 font-medium">
                  {ar ? "الحالة" : "Status"}
                </th>
                <th className="px-4 py-3 font-medium">
                  {ar ? "الخطوة التالية" : "Next"}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[var(--ro-border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--ro-plum-50)_55%,transparent)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/brokerage/${r.id}`}
                      className="font-mono text-xs font-medium text-[var(--ro-plum-900)] underline-offset-2 hover:underline"
                      dir="ltr"
                    >
                      {r.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.trader.displayName}</td>
                  <td className="max-w-xs truncate px-4 py-3">
                    {localizedName(locale, r.descriptionAr, r.descriptionEn)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-[var(--ro-ink-600)]">
                    {daysSince(r.createdAt)}d
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">
                    {brokerageActorLabel(r.status, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <BrokerageStatusBadge
                      status={r.status}
                      label={brokerageStatusLabel(r.status, locale)}
                    />
                  </td>
                  <td className="max-w-[14rem] px-4 py-3 text-xs leading-snug text-[var(--ro-ink-600)]">
                    {brokerageNextHint(r.status, locale, "admin")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
