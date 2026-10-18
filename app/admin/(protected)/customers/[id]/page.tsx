import Link from "next/link";
import {
  DetailItem,
  DetailList,
  DetailSection,
} from "@/components/admin/detail-list";
import { StatusChip } from "@/components/ui/status-chip";
import { prisma } from "@/lib/db/prisma";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      requests: {
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true,
          reference: true,
          status: true,
          createdAt: true,
          subtotal: true,
          currency: true,
        },
      },
    },
  });
  if (!customer) notFound();

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-ro-muted">{a.customers}</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
          {customer.name}
        </h1>
        <p className="text-ro-muted" dir="ltr">
          {customer.phone}
        </p>
      </div>

      <DetailList>
        <DetailItem label={u.colCreated}>
          {formatDate(customer.createdAt, locale, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </DetailItem>
        <DetailItem label={u.detail.customerNotes}>
          {customer.notes?.trim() || "—"}
        </DetailItem>
        <DetailItem label={u.colRequests}>
          {customer.requests.length}
        </DetailItem>
      </DetailList>

      <DetailSection title={a.requests}>
        {customer.requests.length === 0 ? (
          <p className="text-sm text-ro-muted">{a.noRequests}</p>
        ) : (
          <ul className="divide-y divide-ro-line border border-ro-line text-sm">
            {customer.requests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div className="space-y-1">
                  <Link
                    href={`/admin/requests/${r.id}`}
                    className="font-medium text-ro-plum hover:underline"
                  >
                    {r.reference}
                  </Link>
                  <p className="text-ro-muted">
                    {formatRelative(r.createdAt, locale)}
                  </p>
                </div>
                <StatusChip
                  size="sm"
                  {...getStatusChipProps(dict, "retail", r.status)}
                />
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </section>
  );
}
