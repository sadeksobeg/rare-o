import Link from "next/link";
import {
  DataTable,
  DataTableHead,
  Td,
  Th,
  Tr,
} from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { listDealsForAdmin } from "@/lib/deals/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getStatusChipProps } from "@/lib/ui/status-labels";

export default async function AdminDealsPage() {
  const { dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const deals = await listDealsForAdmin();

  return (
    <section className="space-y-6">
      <PageHeader title={a.deals} description={u.dealsLead} />
      {deals.length === 0 ? (
        <div className="border border-ro-line">
          <EmptyState title={u.emptyTitle} body={u.emptyBody} />
        </div>
      ) : (
        <DataTable>
          <DataTableHead>
            <Th>{u.colReference}</Th>
            <Th>{u.colTrader}</Th>
            <Th>{u.colTitle}</Th>
            <Th>{u.colKind}</Th>
            <Th>{a.colStatus}</Th>
            <Th>{u.colEntries}</Th>
            <Th />
          </DataTableHead>
          <tbody>
            {deals.map((d) => (
              <Tr key={d.id}>
                <Td className="font-medium">{d.reference}</Td>
                <Td>
                  {d.trader.displayName}
                  <div className="text-ro-muted" dir="ltr">
                    {d.trader.email}
                  </div>
                </Td>
                <Td>{d.title}</Td>
                <Td>
                  {d.dealKind === "catalog"
                    ? u.kindCatalog
                    : d.dealKind === "non_catalog"
                      ? u.kindNonCatalog
                      : d.dealKind}
                </Td>
                <Td>
                  <StatusChip
                    size="sm"
                    {...getStatusChipProps(dict, "deal", d.status)}
                  />
                </Td>
                <Td className="tabular-nums">{d._count.entries}</Td>
                <Td>
                  <Link
                    href={`/admin/deals/${d.id}`}
                    className="text-ro-plum hover:underline"
                  >
                    {u.actionNegotiate}
                  </Link>
                </Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </section>
  );
}
