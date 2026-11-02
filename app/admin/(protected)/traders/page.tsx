import Link from "next/link";
import {
  CreateTraderForm,
  TraderResetPasswordButton,
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
    include: {
      _count: {
        select: {
          deals: true,
          wholesaleRequests: true,
          brokerageRequests: true,
        },
      },
    },
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
        <EmptyState
          variant="first-use"
          title={u.emptyTitle}
          body={u.emptyBody}
          actionHref="#create-trader"
          actionLabel={u.newTrader}
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
                  meta={
                    <span dir="ltr">{t.email}</span>
                  }
                >
                  <p className="text-xs text-ro-muted">
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
                <Th>{a.colName}</Th>
                <Th>{u.colEmail}</Th>
                <Th>{a.colStatus}</Th>
                <Th>{u.colDeals}</Th>
                <Th>{u.colWholesale}</Th>
                <Th>{u.colBrokerage}</Th>
                <Th />
              </DataTableHead>
              <tbody>
                {traders.map((t) => {
                  const initial = t.displayName.trim().slice(0, 1) || "T";
                  return (
                    <Tr key={t.id} flash={isFresh(t.updatedAt)}>
                      <Td>
                        <Link
                          href={`/admin/traders/${t.id}`}
                          className="flex items-center gap-3 font-medium text-ro-ink underline-offset-4 hover:underline"
                        >
                          <span
                            aria-hidden
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ro-plum-100)] text-sm font-semibold text-[var(--ro-plum-900)]"
                          >
                            {initial}
                          </span>
                          <span>
                            {t.displayName}
                            {t.companyName ? (
                              <span className="mt-0.5 block text-sm font-normal text-ro-muted">
                                {t.companyName}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                        {parseInterestSlugs(t.interestCategorySlugs).length >
                        0 ? (
                          <div className="mt-1 ps-12 text-xs text-ro-muted">
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
                        <div className="flex flex-wrap gap-2">
                          <ButtonLink
                            href={`/admin/traders/${t.id}`}
                            variant="secondary"
                            size="sm"
                          >
                            {u.actionView}
                          </ButtonLink>
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
      <div id="create-trader" className="scroll-mt-20">
        <CreateTraderForm dict={dict} />
      </div>
    </section>
  );
}
