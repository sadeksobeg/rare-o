import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare, Package, Users } from "lucide-react";
import { CustomerEditForm } from "@/components/admin/customer-edit-form";
import { CustomerNotesForm } from "@/components/admin/customer-notes-form";
import {
  DetailItem,
  DetailList,
  DetailSection,
} from "@/components/admin/detail-list";
import { PortalHeroStrip } from "@/components/admin/portal-hero";
import { ButtonLink } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { findWhatsAppConversationsForPhone } from "@/lib/admin/wa-phone-match";
import { prisma } from "@/lib/db/prisma";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getStatusChipProps } from "@/lib/ui/status-labels";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notesSaved?: string; notesError?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { requests: true } },
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
      whatsAppConversations: {
        orderBy: { lastMessageAt: "desc" },
        take: 10,
        select: {
          id: true,
          displayName: true,
          participantE164: true,
          lastMessageAt: true,
          lastMessagePreview: true,
          unreadCount: true,
        },
      },
    },
  });
  if (!customer) notFound();

  const phoneMatched = await findWhatsAppConversationsForPhone(customer.phone);
  const linkedIds = new Set(customer.whatsAppConversations.map((c) => c.id));
  const waConversations = [
    ...customer.whatsAppConversations,
    ...phoneMatched.filter((c) => !linkedIds.has(c.id)),
  ];
  const primaryWa = waConversations[0];

  return (
    <section className="space-y-8 pb-16">
      <p>
        <Link
          href="/admin/customers"
          className="text-sm font-medium text-[color:var(--ro-accent-fg,var(--ro-plum-800))] underline-offset-4 hover:underline"
        >
          {a.customers}
        </Link>
      </p>

      <PortalHeroStrip
        eyebrow={a.customers}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Users
              className="size-7 shrink-0 text-[color:var(--ro-accent-fg,var(--ro-plum-800))]"
              strokeWidth={1.5}
            />
            {customer.name}
          </span>
        }
        subtitle={<span dir="ltr">{customer.phone}</span>}
        actions={
          <div className="flex flex-wrap gap-2">
            {customer._count.requests > 0 ? (
              <ButtonLink
                href={`/admin/requests?q=${encodeURIComponent(customer.phone)}`}
                variant="secondary"
                size="sm"
              >
                <Package className="size-3.5" strokeWidth={1.5} aria-hidden />
                {u.customerOpenRequests}
              </ButtonLink>
            ) : null}
            {primaryWa ? (
              <ButtonLink
                href={`/admin/inbox/${primaryWa.id}`}
                variant="primary"
                size="sm"
              >
                <MessageSquare
                  className="size-3.5"
                  strokeWidth={1.5}
                  aria-hidden
                />
                {u.customerOpenWa}
              </ButtonLink>
            ) : null}
          </div>
        }
        stats={[
          { label: u.colRequests, value: customer._count.requests },
          {
            label: u.colCreated,
            value: formatDate(customer.createdAt, locale, {
              dateStyle: "medium",
            }),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="ro-portal-card overflow-hidden border">
            <DetailList>
              <DetailItem label={u.colPhone}>
                <span dir="ltr">{customer.phone}</span>
              </DetailItem>
              <DetailItem label={u.colCreated}>
                {formatDate(customer.createdAt, locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </DetailItem>
              <DetailItem label={u.colRequests}>
                {customer._count.requests}
              </DetailItem>
            </DetailList>
          </div>
          <CustomerEditForm
            customerId={customer.id}
            name={customer.name}
            phone={customer.phone}
            dict={dict}
          />
        </div>

        <div className="ro-portal-card space-y-3 border p-4 md:p-5">
          <CustomerNotesForm
            customerId={customer.id}
            notes={customer.notes ?? ""}
            dict={dict}
            saved={q.notesSaved === "1"}
            error={Boolean(q.notesError)}
          />
        </div>
      </div>

      <DetailSection title={u.customerWaTitle}>
        {waConversations.length === 0 ? (
          <p className="text-sm text-[color:var(--ro-text-muted)]">
            {u.customerWaEmpty}
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--ro-border-subtle)] overflow-hidden rounded-[var(--ro-r-sm)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel)] text-sm">
            {waConversations.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0 space-y-1">
                  <Link
                    href={`/admin/inbox/${c.id}`}
                    className="font-medium text-[color:var(--ro-accent-fg,var(--ro-plum-800))] hover:underline"
                  >
                    <bdi>{c.displayName || c.participantE164 || c.id}</bdi>
                    <span className="sr-only"> — {u.customerWaOpen}</span>
                  </Link>
                  {c.lastMessagePreview ? (
                    <p className="line-clamp-1 text-[color:var(--ro-text-muted)]">
                      <bdi>{c.lastMessagePreview}</bdi>
                    </p>
                  ) : null}
                  {c.lastMessageAt ? (
                    <p className="text-xs text-[color:var(--ro-text-muted)]">
                      {formatRelative(c.lastMessageAt, locale)}
                    </p>
                  ) : null}
                </div>
                {c.unreadCount > 0 ? (
                  <span className="text-xs font-semibold tabular-nums text-[color:var(--ro-accent-fg,var(--ro-plum-800))]">
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
          <p className="text-sm text-[color:var(--ro-text-muted)]">
            {a.noRequests}
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--ro-border-subtle)] overflow-hidden rounded-[var(--ro-r-sm)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel)] text-sm">
            {customer.requests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div className="space-y-1">
                  <Link
                    href={`/admin/requests/${r.id}`}
                    className="font-medium text-[color:var(--ro-accent-fg,var(--ro-plum-800))] hover:underline"
                  >
                    {r.reference}
                  </Link>
                  <p className="text-[color:var(--ro-text-muted)]">
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
