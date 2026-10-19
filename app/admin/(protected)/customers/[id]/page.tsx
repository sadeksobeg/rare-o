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

function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").replace(/^0{2,}/, "");
}

/** Conversations whose participantE164 matches the customer phone (digits only). */
async function findWhatsAppConversationsForPhone(phone: string) {
  const digits = digitsOnly(phone);
  if (digits.length < 7) return [];
  const tail = digits.slice(-8);
  const candidates = await prisma.whatsAppConversation.findMany({
    where: { participantE164: { contains: tail } },
    orderBy: { lastMessageAt: "desc" },
    take: 20,
    select: {
      id: true,
      displayName: true,
      participantE164: true,
      lastMessageAt: true,
      lastMessagePreview: true,
      unreadCount: true,
      linkType: true,
    },
  });
  return candidates.filter((c) => {
    const p = digitsOnly(c.participantE164);
    if (!p) return false;
    return p === digits || p.endsWith(digits) || digits.endsWith(p);
  });
}

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

  const waConversations = await findWhatsAppConversationsForPhone(
    customer.phone
  );

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

      <DetailSection title={u.customerWaTitle}>
        {waConversations.length === 0 ? (
          <p className="text-sm text-ro-muted">{u.customerWaEmpty}</p>
        ) : (
          <ul className="divide-y divide-ro-line border border-ro-line text-sm">
            {waConversations.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0 space-y-1">
                  <Link
                    href={`/admin/inbox/${c.id}`}
                    className="font-medium text-ro-plum hover:underline"
                  >
                    <bdi>{c.displayName || c.participantE164 || c.id}</bdi>
                    <span className="sr-only"> — {u.customerWaOpen}</span>
                  </Link>
                  {c.lastMessagePreview ? (
                    <p className="line-clamp-1 text-ro-muted">
                      <bdi>{c.lastMessagePreview}</bdi>
                    </p>
                  ) : null}
                  {c.lastMessageAt ? (
                    <p className="text-xs text-ro-muted">
                      {formatRelative(c.lastMessageAt, locale)}
                    </p>
                  ) : null}
                </div>
                {c.unreadCount > 0 ? (
                  <span className="text-xs font-semibold tabular-nums text-ro-plum">
                    {c.unreadCount}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

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
