import { Suspense } from "react";
import { CreateTraderButton } from "@/components/admin/create-trader-button";
import {
  TraderResetPasswordButton,
  TraderStatusButton,
} from "@/components/admin/trader-forms";
import {
  DataTable,
  DataTableHead,
  RowHit,
  Td,
  Th,
  Tr,
} from "@/components/admin/data-table";
import {
  AdminRecordCard,
  AdminRecordCardList,
} from "@/components/admin/list-record-card";
import { PortalHeroStrip } from "@/components/admin/portal-hero";
import { AdminTableFilters } from "@/components/admin/table-filters";
import { Store } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { uiVisibleTraderWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { containsCI } from "@/lib/db/search";
import { getRequestDictionary } from "@/lib/i18n/server";
import { parseInterestSlugs } from "@/lib/offers/rank-by-interest";
import { isFresh } from "@/lib/ui/fresh";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const OPEN_DEAL_STATUSES = [
  "proposed",
  "negotiating",
  "accepted",
  "awaiting_payment",
] as const;

export default async function AdminTradersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const { q: qRaw, tab: tabRaw } = await searchParams;
  const query = qRaw?.trim() ?? "";
  const tab = tabRaw?.trim() || "all";
  const { locale, dict } = await getRequestDictionary();
  const isAr = locale === "ar";
  const a = dict.admin;
  const u = dict.adminUi;

  const visible = uiVisibleTraderWhere();
  const searchWhere: Prisma.TraderAccountWhereInput | undefined = query
    ? {
        OR: [
          { displayName: containsCI(query) },
          { email: containsCI(query) },
          { phone: containsCI(query) },
          { companyName: containsCI(query) },
        ],
      }
    : undefined;

  const tabWhere: Prisma.TraderAccountWhereInput | undefined =
    tab === "active"
      ? { status: "active" }
      : tab === "disabled"
        ? { status: "disabled" }
        : undefined;

  const listWhere: Prisma.TraderAccountWhereInput = {
    AND: [visible, searchWhere, tabWhere].filter(
      Boolean
    ) as Prisma.TraderAccountWhereInput[],
  };

  const [allCount, activeCount, disabledCount, openDealsCount, traders] =
    await Promise.all([
      prisma.traderAccount.count({ where: visible }),
      prisma.traderAccount.count({
        where: { AND: [visible, { status: "active" }] },
      }),
      prisma.traderAccount.count({
        where: { AND: [visible, { status: "disabled" }] },
      }),
      prisma.dealProposal.count({
        where: {
          AND: [
            { status: { in: [...OPEN_DEAL_STATUSES] } },
            { trader: visible },
          ],
        },
      }),
      prisma.traderAccount.findMany({
        where: listWhere,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              deals: true,
              wholesaleRequests: true,
              brokerageRequests: true,
            },
          },
        },
      }),
    ]);

  return (
    <section className="space-y-5 pb-16">
      <PortalHeroStrip
        eyebrow={isAr ? "أشخاص" : "People"}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Store
              className="size-7 shrink-0 text-[color:var(--ro-accent-fg,var(--ro-plum-800))]"
              strokeWidth={1.5}
            />
            {a.traders}
          </span>
        }
        subtitle={u.tradersLead}
        actions={<CreateTraderButton dict={dict} />}
        stats={[
          { label: u.tradersKpiActive, value: activeCount },
          { label: u.tradersKpiDisabled, value: disabledCount },
          { label: u.tradersKpiOpenDeals, value: openDealsCount },
        ]}
      />

      <Suspense fallback={null}>
        <AdminTableFilters
          tabsLabel={u.filterTabs}
          searchLabel={u.search}
          searchPlaceholder={u.searchTraders}
          resultCount={traders.length}
          resultLabel={u.resultsLabel}
          tabs={[
            { id: "all", label: u.filterAll, count: allCount },
            {
              id: "active",
              label: u.tradersFilterActive,
              count: activeCount,
            },
            {
              id: "disabled",
              label: u.tradersFilterDisabled,
              count: disabledCount,
            },
          ]}
        />
      </Suspense>

      {traders.length === 0 ? (
        <EmptyState
          variant={query || tab !== "all" ? "no-results" : "first-use"}
          title={u.emptyTitle}
          body={u.emptyBody}
          actionHref={query || tab !== "all" ? "/admin/traders" : undefined}
          actionLabel={
            query || tab !== "all" ? dict.catalog.clearFilters : undefined
          }
        />
      ) : (
        <>
          <AdminRecordCardList>
            {traders.map((t) => {
              const initial = t.displayName.trim().slice(0, 1) || "T";
              return (
                <AdminRecordCard
                  key={t.id}
                  href={`/admin/traders/${t.id}`}
                  flash={isFresh(t.updatedAt)}
                  title={
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ro-plum-100)] text-sm font-semibold text-[var(--ro-plum-900)]"
                      >
                        {initial}
                      </span>
                      {t.displayName}
                    </span>
                  }
                  trailing={
                    <StatusChip
                      size="sm"
                      {...getStatusChipProps(dict, "trader", t.status)}
                    />
                  }
                  meta={<span dir="ltr">{t.email}</span>}
                >
                  <p className="text-xs text-[color:var(--ro-text-muted)]">
                    {u.colDeals} {t._count.deals} · {u.colWholesale}{" "}
                    {t._count.wholesaleRequests} · {u.colBrokerage}{" "}
                    {t._count.brokerageRequests}
                  </p>
                </AdminRecordCard>
              );
            })}
          </AdminRecordCardList>
          <div className="hidden md:block">
            <DataTable>
              <DataTableHead>
                <Th className="min-w-[11rem]">{a.colName}</Th>
                <Th>{u.colEmail}</Th>
                <Th className="w-[6.5rem]">{a.colStatus}</Th>
                <Th className="w-[5rem]">{u.colDeals}</Th>
                <Th className="w-[5rem]">{u.colWholesale}</Th>
                <Th className="w-[5rem]">{u.colBrokerage}</Th>
                <Th className="w-[11rem]" />
              </DataTableHead>
              <tbody>
                {traders.map((t) => {
                  const initial = t.displayName.trim().slice(0, 1) || "T";
                  const href = `/admin/traders/${t.id}`;
                  return (
                    <Tr key={t.id} href={href} flash={isFresh(t.updatedAt)}>
                      <Td>
                        <RowHit href={href}>
                          <span className="flex items-center gap-3 font-medium">
                            <span
                              aria-hidden
                              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ro-plum-100)] text-sm font-semibold text-[var(--ro-plum-900)]"
                            >
                              {initial}
                            </span>
                            <span>
                              {t.displayName}
                              {t.companyName ? (
                                <span className="mt-0.5 block text-sm font-normal text-[color:var(--ro-text-muted)]">
                                  {t.companyName}
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </RowHit>
                        {parseInterestSlugs(t.interestCategorySlugs).length >
                        0 ? (
                          <div className="mt-1 ps-12 text-xs text-[color:var(--ro-text-muted)]">
                            {parseInterestSlugs(t.interestCategorySlugs).join(
                              " · "
                            )}
                          </div>
                        ) : null}
                      </Td>
                      <Td dir="ltr">{t.email}</Td>
                      <Td>
                        <StatusChip
                          size="sm"
                          {...getStatusChipProps(dict, "trader", t.status)}
                        />
                      </Td>
                      <Td className="tabular-nums">{t._count.deals}</Td>
                      <Td className="tabular-nums">
                        {t._count.wholesaleRequests}
                      </Td>
                      <Td className="tabular-nums">
                        {t._count.brokerageRequests}
                      </Td>
                      <Td>
                        <div className="flex flex-wrap justify-end gap-2">
                          <TraderStatusButton
                            traderId={t.id}
                            nextStatus={
                              t.status === "active" ? "disabled" : "active"
                            }
                            label={
                              t.status === "active"
                                ? u.traderDisable
                                : u.traderActivate
                            }
                            confirmTitle={u.traderDisableTitle}
                            confirmBody={u.traderDisableBody}
                            confirmLabel={u.traderDisable}
                            cancelLabel={dict.common.cancel}
                          />
                          <TraderResetPasswordButton
                            traderId={t.id}
                            label={u.traderResetPassword}
                            confirmTitle={u.traderResetPasswordConfirmTitle}
                            confirmBody={u.traderResetPasswordConfirmBody}
                            confirmLabel={u.traderResetPasswordConfirmLabel}
                            cancelLabel={dict.common.cancel}
                            tempPasswordTitle={u.traderTempPasswordTitle}
                            tempPasswordLead={u.traderTempPasswordLead}
                            tempPasswordCopy={u.traderTempPasswordCopy}
                            tempPasswordCopied={u.traderTempPasswordCopied}
                            tempPasswordAck={u.traderTempPasswordAck}
                            tempPasswordClose={u.traderTempPasswordClose}
                          />
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </DataTable>
          </div>
        </>
      )}
    </section>
  );
}
