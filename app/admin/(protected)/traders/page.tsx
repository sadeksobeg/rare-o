import {
  CreateTraderForm,
  TraderStatusButton,
} from "@/components/admin/trader-forms";
import {
  DataTable,
  DataTableHead,
  Td,
  Th,
  Tr,
} from "@/components/admin/data-table";
import {
  AdminRecordCard,
  AdminRecordCardList,
} from "@/components/admin/list-record-card";
import { Store } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { uiVisibleTraderWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { parseInterestSlugs } from "@/lib/offers/rank-by-interest";
import { isFresh } from "@/lib/ui/fresh";
import { getStatusChipProps } from "@/lib/ui/status-labels";

export default async function AdminTradersPage() {
  const { dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const traders = await prisma.traderAccount.findMany({
    where: uiVisibleTraderWhere(),
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { deals: true } } },
  });

  return (
    <section className="space-y-8">
      <PageHeader
        title={a.traders}
        description={u.tradersLead}
        icon={<Store className="size-5" strokeWidth={2} />}
        action={
          <ButtonLink href="#create-trader" variant="primary" size="sm">
            {u.newTrader}
          </ButtonLink>
        }
      />
      {traders.length === 0 ? (
        <div className="border border-ro-line">
          <EmptyState title={u.emptyTitle} body={u.emptyBody} />
        </div>
      ) : (
        <>
          <AdminRecordCardList>
            {traders.map((t) => (
              <AdminRecordCard
                key={t.id}
                flash={isFresh(t.updatedAt)}
                title={t.displayName}
                trailing={
                  <StatusChip
                    size="sm"
                    {...getStatusChipProps(dict, "trader", t.status)}
                  />
                }
                meta={
                  <span dir="ltr">{t.email}</span>
                }
              >
                {parseInterestSlugs(t.interestCategorySlugs).length > 0 ? (
                  <p className="text-xs text-ro-muted">
                    {parseInterestSlugs(t.interestCategorySlugs).join(" · ")}
                  </p>
                ) : null}
              </AdminRecordCard>
            ))}
          </AdminRecordCardList>
          <div className="hidden md:block">
        <DataTable>
          <DataTableHead>
            <Th>{a.colName}</Th>
            <Th>{u.colEmail}</Th>
            <Th>{a.colStatus}</Th>
            <Th>{u.colDeals}</Th>
            <Th />
          </DataTableHead>
          <tbody>
            {traders.map((t) => (
              <Tr key={t.id} flash={isFresh(t.updatedAt)}>
                <Td>
                  <span className="font-medium">{t.displayName}</span>
                  {t.companyName ? (
                    <div className="text-ro-muted">{t.companyName}</div>
                  ) : null}
                  {parseInterestSlugs(t.interestCategorySlugs).length > 0 ? (
                    <div className="text-xs text-ro-muted">
                      {parseInterestSlugs(t.interestCategorySlugs).join(" · ")}
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
                <Td>
                  <TraderStatusButton
                    traderId={t.id}
                    nextStatus={t.status === "active" ? "disabled" : "active"}
                    label={
                      t.status === "active" ? u.traderDisable : u.traderActivate
                    }
                    confirmTitle={u.traderDisableTitle}
                    confirmBody={u.traderDisableBody}
                    confirmLabel={u.traderDisable}
                    cancelLabel={dict.common.cancel}
                  />
                </Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
          </div>
        </>
      )}
      <div id="create-trader" className="scroll-mt-20">
        <CreateTraderForm dict={dict} />
      </div>
    </section>
  );
}
