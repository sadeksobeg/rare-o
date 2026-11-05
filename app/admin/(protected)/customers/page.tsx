import { Suspense } from "react";
import { Users } from "lucide-react";
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
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { phonesWithWhatsAppMatch } from "@/lib/admin/wa-phone-match";
import { uiVisibleCustomerWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { containsCI } from "@/lib/db/search";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { isFresh } from "@/lib/ui/fresh";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const { q: qRaw, tab: tabRaw } = await searchParams;
  const query = qRaw?.trim() ?? "";
  const tab = tabRaw?.trim() || "all";
  const { locale, dict } = await getRequestDictionary();
  const ar = locale === "ar";
  const a = dict.admin;
  const u = dict.adminUi;

  const visible = uiVisibleCustomerWhere();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const searchWhere: Prisma.CustomerWhereInput | undefined = query
    ? {
        OR: [{ name: containsCI(query) }, { phone: containsCI(query) }],
      }
    : undefined;

  const tabWhere: Prisma.CustomerWhereInput | undefined =
    tab === "with_requests"
      ? { requests: { some: {} } }
      : tab === "no_requests"
        ? { requests: { none: {} } }
        : undefined;

  const listWhere: Prisma.CustomerWhereInput = {
    AND: [visible, searchWhere, tabWhere].filter(Boolean) as Prisma.CustomerWhereInput[],
  };

  const [allCount, withRequestsCount, newCount, customers] = await Promise.all([
    prisma.customer.count({ where: visible }),
    prisma.customer.count({
      where: { AND: [visible, { requests: { some: {} } }] },
    }),
    prisma.customer.count({
      where: { AND: [visible, { createdAt: { gte: sevenDaysAgo } }] },
    }),
    prisma.customer.findMany({
      where: listWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        _count: {
          select: { requests: true, whatsAppConversations: true },
        },
        requests: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, reference: true },
        },
      },
    }),
  ]);

  const noRequestsCount = Math.max(0, allCount - withRequestsCount);
  const waPhones = await phonesWithWhatsAppMatch(customers.map((c) => c.phone));

  return (
    <section className="space-y-5 pb-16">
      <PortalHeroStrip
        eyebrow={ar ? "أشخاص" : "People"}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Users
              className="size-7 shrink-0 text-[color:var(--ro-accent-fg,var(--ro-plum-800))]"
              strokeWidth={1.5}
            />
            {a.customers}
          </span>
        }
        subtitle={u.customersLead}
        stats={[
          { label: u.customersKpiAll, value: allCount },
          { label: u.customersKpiWithRequests, value: withRequestsCount },
          {
            label: u.customersKpiNew,
            value: newCount,
            hint: u.customersKpiNewHint,
          },
        ]}
      />

      <Suspense fallback={null}>
        <AdminTableFilters
          tabsLabel={u.filterTabs}
          searchLabel={u.search}
          searchPlaceholder={u.searchCustomers}
          resultCount={customers.length}
          resultLabel={u.resultsLabel}
          tabs={[
            { id: "all", label: u.filterAll, count: allCount },
            {
              id: "with_requests",
              label: u.customersFilterWithRequests,
              count: withRequestsCount,
            },
            {
              id: "no_requests",
              label: u.customersFilterNoRequests,
              count: noRequestsCount,
            },
          ]}
        />
      </Suspense>

      {customers.length === 0 ? (
        <EmptyState
          variant={query || tab !== "all" ? "no-results" : "first-use"}
          title={u.emptyTitle}
          body={u.emptyBody}
          actionHref={
            query || tab !== "all" ? "/admin/customers" : "/admin/requests"
          }
          actionLabel={
            query || tab !== "all" ? dict.catalog.clearFilters : a.requests
          }
        />
      ) : (
        <>
          <AdminRecordCardList>
            {customers.map((c) => {
              const last = c.requests[0];
              const hasWa =
                c._count.whatsAppConversations > 0 || waPhones.has(c.phone);
              return (
                <AdminRecordCard
                  key={c.id}
                  href={`/admin/customers/${c.id}`}
                  flash={isFresh(last?.createdAt ?? c.createdAt)}
                  title={
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ro-plum-100)] text-sm font-semibold text-[var(--ro-plum-900)]"
                      >
                        {c.name.trim().slice(0, 1) || "C"}
                      </span>
                      {c.name}
                    </span>
                  }
                  trailing={
                    <span className="text-xs font-semibold tabular-nums text-[var(--ro-plum-900)]">
                      {c._count.requests}
                    </span>
                  }
                  meta={<span dir="ltr">{c.phone}</span>}
                >
                  <p className="text-xs text-[color:var(--ro-text-muted)]">
                    {last ? (
                      <>
                        {last.reference}
                        {" · "}
                        {formatRelative(last.createdAt, locale)}
                      </>
                    ) : (
                      formatDate(c.createdAt, locale, { dateStyle: "medium" })
                    )}
                    {hasWa ? ` · ${u.colWa}` : ""}
                  </p>
                </AdminRecordCard>
              );
            })}
          </AdminRecordCardList>

          <div className="hidden md:block">
            <DataTable>
              <DataTableHead>
                <Th className="min-w-[10rem]">{a.colName}</Th>
                <Th>{u.colPhone}</Th>
                <Th className="w-[5.5rem]">{u.colRequests}</Th>
                <Th>{u.colLastActivity}</Th>
                <Th className="w-[6.5rem]">{u.colWa}</Th>
                <Th className="w-[7.5rem]">{u.colCreated}</Th>
              </DataTableHead>
              <tbody>
                {customers.map((c) => {
                  const last = c.requests[0];
                  const href = `/admin/customers/${c.id}`;
                  const hasWa =
                    c._count.whatsAppConversations > 0 || waPhones.has(c.phone);
                  return (
                    <Tr
                      key={c.id}
                      href={href}
                      flash={isFresh(last?.createdAt ?? c.createdAt)}
                    >
                      <Td className="font-medium">
                        <RowHit href={href}>
                          <span className="inline-flex items-center gap-3">
                            <span
                              aria-hidden
                              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--ro-plum-100)] text-sm font-semibold text-[var(--ro-plum-900)]"
                            >
                              {c.name.trim().slice(0, 1) || "C"}
                            </span>
                            {c.name}
                          </span>
                        </RowHit>
                      </Td>
                      <Td>
                        <span dir="ltr">{c.phone}</span>
                      </Td>
                      <Td className="tabular-nums">{c._count.requests}</Td>
                      <Td className="text-[color:var(--ro-text-muted)]">
                        {last ? (
                          <>
                            <span className="block font-medium text-[color:var(--ro-text)]">
                              {last.reference}
                            </span>
                            {formatRelative(last.createdAt, locale)}
                          </>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td>
                        {hasWa ? (
                          <StatusChip size="sm" tone="info" label={u.colWa} />
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td className="text-[color:var(--ro-text-muted)]">
                        {formatDate(c.createdAt, locale, {
                          dateStyle: "medium",
                        })}
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
