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
import { uiVisibleRetailRequestWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getStatusChipProps } from "@/lib/ui/status-labels";

export default async function AdminRequestsPage() {
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const requests = await prisma.retailRequest.findMany({
    where: uiVisibleRetailRequestWhere,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <section className="space-y-6">
      <PageHeader title={a.requests} description={u.requestsLead} />
      {requests.length === 0 ? (
        <div className="border border-ro-line">
          <EmptyState title={u.emptyTitle} body={a.noRequests} />
        </div>
      ) : (
        <DataTable>
          <DataTableHead>
            <Th>{u.colReference}</Th>
            <Th>{u.colCustomer}</Th>
            <Th>{u.colCountry}</Th>
            <Th>{a.colStatus}</Th>
            <Th>{u.colTotal}</Th>
            <Th />
          </DataTableHead>
          <tbody>
            {requests.map((r) => (
              <Tr key={r.id}>
                <Td className="font-medium">{r.reference}</Td>
                <Td>
                  {r.customerName}
                  <div className="text-ro-muted" dir="ltr">
                    {r.customerPhone}
                  </div>
                </Td>
                <Td>{r.destinationCountry}</Td>
                <Td>
                  <StatusChip
                    size="sm"
                    {...getStatusChipProps(dict, "retail", r.status)}
                  />
                </Td>
                <Td className="tabular-nums">
                  {formatCurrency(
                    Number(r.subtotal),
                    r.currency,
                    locale,
                    dict.product.priceOnRequest
                  )}
                </Td>
                <Td>
                  <Link
                    href={`/admin/requests/${r.id}`}
                    className="text-ro-plum hover:underline"
                  >
                    {u.actionView}
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
