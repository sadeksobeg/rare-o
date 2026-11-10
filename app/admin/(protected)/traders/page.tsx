import { CreateTraderButton } from "@/components/admin/create-trader-button";
import {
  TraderResetPasswordButton,
  TraderStatusButton,
} from "@/components/admin/trader-forms";
import {
  TradersListView,
  type TradersListRow,
} from "@/components/admin/rad/traders-list-view";
import { uiVisibleTraderWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { containsCI } from "@/lib/db/search";
import { getRequestDictionary } from "@/lib/i18n/server";
import { parseInterestSlugs } from "@/lib/offers/rank-by-interest";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminTradersPage({
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

  const [allCount, activeCount, disabledCount, traders] = await Promise.all([
    prisma.traderAccount.count({ where: visible }),
    prisma.traderAccount.count({
      where: { AND: [visible, { status: "active" }] },
    }),
    prisma.traderAccount.count({
      where: { AND: [visible, { status: "disabled" }] },
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

  const rows: TradersListRow[] = traders.map((t) => {
    const chip = getStatusChipProps(dict, "trader", t.status);
    return {
      id: t.id,
      href: `/admin/traders/${t.id}`,
      name: t.displayName,
      companyName: t.companyName,
      email: t.email,
      statusLabel: chip.label,
      pillTone: statusToneToPill(chip.tone),
      deals: t._count.deals,
      wholesale: t._count.wholesaleRequests,
      brokerage: t._count.brokerageRequests,
      interests: parseInterestSlugs(t.interestCategorySlugs).join(" · "),
      actions: (
        <>
          <TraderStatusButton
            traderId={t.id}
            nextStatus={t.status === "active" ? "disabled" : "active"}
            label={t.status === "active" ? u.traderDisable : u.traderActivate}
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
        </>
      ),
    };
  });

  return (
    <TradersListView
      title={a.traders}
      lead={u.tradersLead}
      query={{ tab, q: query }}
      tabs={[
        { value: "all", label: u.filterAll, count: allCount },
        { value: "active", label: u.tradersFilterActive, count: activeCount },
        {
          value: "disabled",
          label: u.tradersFilterDisabled,
          count: disabledCount,
        },
      ]}
      rows={rows}
      totalFiltered={traders.length}
      headerAction={<CreateTraderButton dict={dict} />}
      labels={{
        listAria: a.traders,
        statusFilterAria: u.filterTabs,
        searchLabel: u.search,
        searchPlaceholder: u.searchTraders,
        colName: a.colName,
        colEmail: u.colEmail,
        colStatus: a.colStatus,
        colDeals: u.colDeals,
        colWholesale: u.colWholesale,
        colBrokerage: u.colBrokerage,
        colActions: ar ? "إجراءات" : "Actions",
        emptyTitle: u.emptyTitle,
        emptyBody: u.emptyBody,
        noResultsTitle: u.emptyTitle,
        noResultsBody: u.emptyBody,
        clearFilters: dict.catalog.clearFilters,
        resultsSummary: ar
          ? `عرض ${traders.length} تاجراً`
          : `Showing ${traders.length}`,
      }}
    />
  );
}
