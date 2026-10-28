import Link from "next/link";
import { Users } from "lucide-react";
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
import { containsCI } from "@/lib/db/search";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { isFresh } from "@/lib/ui/fresh";

export const dynamic = "force-dynamic";

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
                { name: containsCI(query) },
                { phone: containsCI(query) },
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
      <PageHeader
        title={a.customers}
        description={u.customersLead}
        icon={<Users className="size-5" strokeWidth={2} />}
      />
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
        <>
          <ul className="space-y-2.5 md:hidden">
            {customers.map((c) => {
              const last = c.requests[0];
              return (
                <li key={c.id}>
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className={
                      "ro-portal-card block space-y-2 border p-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]" +
                      (isFresh(last?.createdAt ?? c.createdAt)
                        ? " ro-s10-flash"
                        : "")
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 font-medium text-ro-ink">{c.name}</p>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--ro-plum-900)]">
                        {c._count.requests}
                      </span>
                    </div>
                    <p className="text-sm text-ro-muted" dir="ltr">
                      {c.phone}
                    </p>
                    <p className="text-xs text-ro-muted">
                      {last ? (
                        <>
                          {last.reference}
                          {" · "}
                          {formatRelative(last.createdAt, locale)}
                        </>
                      ) : (
                        formatDate(c.createdAt, locale, { dateStyle: "medium" })
                      )}
                    </p>
                    <span className="text-sm font-medium text-ro-plum">
                      {u.actionView}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="hidden md:block">
            <DataTable>
              <DataTableHead>
                <Th>{a.colName}</Th>
                <Th>{u.colPhone}</Th>
                <Th>{u.colRequests}</Th>
                <Th>{u.colLastRequest}</Th>
                <Th>{u.colCreated}</Th>
                <Th />
              </DataTableHead>
              <tbody>
                {customers.map((c) => {
                  const last = c.requests[0];
                  return (
                    <Tr
                      key={c.id}
                      flash={isFresh(last?.createdAt ?? c.createdAt)}
                    >
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
                      <Td>
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="text-ro-plum hover:underline"
                        >
                          {u.actionView}
                        </Link>
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
