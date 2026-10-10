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
import { getRequestDictionary } from "@/lib/i18n/server";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import { listWholesaleRequestsForAdmin } from "@/lib/wholesale/service";

export default async function AdminWholesalePage() {
  const { dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const requests = await listWholesaleRequestsForAdmin();

  return (
    <section className="space-y-6">
      <PageHeader title={a.wholesale} description={u.wholesaleLead} />
      {requests.length === 0 ? (
        <div className="border border-ro-line">
          <EmptyState title={u.emptyTitle} body={u.emptyBody} />
        </div>
      ) : (
        <DataTable>
          <DataTableHead>
            <Th>{u.colReference}</Th>
            <Th>{u.colTrader}</Th>
            <Th>{u.colMode}</Th>
            <Th>{a.colStatus}</Th>
            <Th>{u.colLines}</Th>
            <Th />
          </DataTableHead>
          <tbody>
            {requests.map((r) => (
              <Tr key={r.id}>
                <Td className="font-medium">{r.reference}</Td>
                <Td>
                  {r.trader.displayName}
                  <div className="text-ro-muted" dir="ltr">
                    {r.trader.email}
                  </div>
                </Td>
                <Td>
                  {r.requestMode === "request_quote"
                    ? u.modeRequestQuote
                    : r.requestMode === "propose_price"
                      ? u.modeProposePrice
                      : r.requestMode}
                </Td>
                <Td>
                  <StatusChip
                    size="sm"
                    {...getStatusChipProps(dict, "wholesale", r.status)}
                  />
                </Td>
                <Td className="tabular-nums">{r._count.lines}</Td>
                <Td>
                  <Link
                    href={`/admin/wholesale/${r.id}`}
                    className="text-ro-plum hover:underline"
                  >
                    {u.actionReview}
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
