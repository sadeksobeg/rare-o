import {
  DataTable,
  DataTableHead,
  Td,
  Th,
  Tr,
} from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { uiVisibleCustomerWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;

  const customers = await prisma.customer.findMany({
    where: query
      ? {
          AND: [
            uiVisibleCustomerWhere(),
            {
              OR: [
                { name: { contains: query } },
                { phone: { contains: query } },
              ],
            },
          ],
        }
      : uiVisibleCustomerWhere(),
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { requests: true } },
      requests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, reference: true },
      },
    },
  });

  return (
    <section className="space-y-6">
      <PageHeader title={a.customers} description={u.customersLead} />
      <form className="flex flex-wrap gap-2" role="search">
        <input
          name="q"
          defaultValue={query ?? ""}
          placeholder={u.searchPlaceholder}
          aria-label={u.searchPlaceholder}
          className="h-10 w-full max-w-xs rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 text-sm outline-none focus:border-[var(--ro-plum-900)]"
        />
        <Button type="submit" size="sm">
          {u.search}
        </Button>
      </form>
      {customers.length === 0 ? (
        <div className="border border-ro-line">
          <EmptyState title={u.emptyTitle} body={u.emptyBody} />
        </div>
      ) : (
        <DataTable>
          <DataTableHead>
            <Th>{a.colName}</Th>
            <Th>{u.colPhone}</Th>
            <Th>{u.colRequests}</Th>
            <Th>{u.colLastRequest}</Th>
            <Th>{u.colCreated}</Th>
          </DataTableHead>
          <tbody>
            {customers.map((c) => {
              const last = c.requests[0];
              return (
                <Tr key={c.id}>
                  <Td className="font-medium">{c.name}</Td>
                  <Td>
                    <span dir="ltr">{c.phone}</span>
                  </Td>
                  <Td className="tabular-nums">{c._count.requests}</Td>
                  <Td className="text-ro-muted">
                    {last ? (
                      <>
                        <span className="block font-medium text-ro-ink">
                          {last.reference}
                        </span>
                        {formatRelative(last.createdAt, locale)}
                      </>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className="text-ro-muted">
                    {formatDate(c.createdAt, locale, { dateStyle: "medium" })}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </section>
  );
}
