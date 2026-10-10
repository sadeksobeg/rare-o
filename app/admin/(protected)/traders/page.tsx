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
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getStatusChipProps } from "@/lib/ui/status-labels";

export default async function AdminTradersPage() {
  const { dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const traders = await prisma.traderAccount.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { deals: true } } },
  });

  return (
    <section className="space-y-8">
      <PageHeader
        title={a.traders}
        description={u.tradersLead}
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
              <Tr key={t.id}>
                <Td>
                  <span className="font-medium">{t.displayName}</span>
                  {t.companyName ? (
                    <div className="text-ro-muted">{t.companyName}</div>
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
                  />
                </Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
      )}
      <div id="create-trader" className="scroll-mt-20">
        <CreateTraderForm dict={dict} />
      </div>
    </section>
  );
}
