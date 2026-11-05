import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Store } from "lucide-react";
import { TraderEditForm } from "@/components/admin/trader-edit-form";
import {
  TraderResetPasswordButton,
  TraderStatusButton,
} from "@/components/admin/trader-forms";
import {
  DetailItem,
  DetailList,
  DetailSection,
} from "@/components/admin/detail-list";
import { PortalHeroStrip } from "@/components/admin/portal-hero";
import { StatusChip } from "@/components/ui/status-chip";
import { findWhatsAppConversationsForPhone } from "@/lib/admin/wa-phone-match";
import { uiVisibleTraderWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { parseInterestSlugs } from "@/lib/offers/rank-by-interest";
import { brokerageStatusLabel } from "@/components/brokerage/labels";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import { localizedName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminTraderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;

  const [trader, categories] = await Promise.all([
    prisma.traderAccount.findFirst({
      where: { AND: [{ id }, uiVisibleTraderWhere()] },
      include: {
        _count: {
          select: {
            deals: true,
            wholesaleRequests: true,
            brokerageRequests: true,
          },
        },
        deals: {
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: {
            id: true,
            reference: true,
            title: true,
            status: true,
            updatedAt: true,
          },
        },
        wholesaleRequests: {
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: {
            id: true,
            reference: true,
            status: true,
            updatedAt: true,
          },
        },
        brokerageRequests: {
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: {
            id: true,
            reference: true,
            status: true,
            cityAr: true,
            cityEn: true,
            updatedAt: true,
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
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, nameAr: true, nameEn: true },
    }),
  ]);
  if (!trader) notFound();

  const interests = parseInterestSlugs(trader.interestCategorySlugs);
  const phoneMatched = trader.phone
    ? await findWhatsAppConversationsForPhone(trader.phone)
    : [];
  const linkedIds = new Set(trader.whatsAppConversations.map((c) => c.id));
  const waConversations = [
    ...trader.whatsAppConversations,
    ...phoneMatched.filter((c) => !linkedIds.has(c.id)),
  ];

  const categoryOptions = categories.map((c) => ({
    slug: c.slug,
    name: localizedName(locale, c.nameAr, c.nameEn) || c.slug,
  }));

  return (
    <section className="space-y-8 pb-16">
      <p>
        <Link
          href="/admin/traders"
          className="text-sm font-medium text-[color:var(--ro-accent-fg,var(--ro-plum-800))] underline-offset-4 hover:underline"
        >
          {u.traderBack}
        </Link>
      </p>

      <PortalHeroStrip
        eyebrow={a.traders}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Store
              className="size-7 shrink-0 text-[color:var(--ro-accent-fg,var(--ro-plum-800))]"
              strokeWidth={1.5}
            />
            {trader.displayName}
          </span>
        }
        subtitle={u.traderDetailLead}
        actions={
          <div className="flex flex-wrap gap-2">
            <TraderStatusButton
              traderId={trader.id}
              nextStatus={trader.status === "active" ? "disabled" : "active"}
              label={
                trader.status === "active" ? u.traderDisable : u.traderActivate
              }
              confirmTitle={u.traderDisableTitle}
              confirmBody={u.traderDisableBody}
              confirmLabel={u.traderDisable}
              cancelLabel={dict.common.cancel}
            />
            <TraderResetPasswordButton
              traderId={trader.id}
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
        }
        stats={[
          { label: u.colDeals, value: trader._count.deals },
          { label: u.colWholesale, value: trader._count.wholesaleRequests },
          { label: u.colBrokerage, value: trader._count.brokerageRequests },
        ]}
      />

      <div className="overflow-hidden rounded-[var(--ro-r-sm)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel)]">
        <div className="flex flex-wrap items-center gap-4 border-b border-[color-mix(in_srgb,var(--ro-plum-900)_12%,transparent)] bg-[linear-gradient(135deg,var(--ro-plum-900)_0%,var(--ro-ink-950)_100%)] px-5 py-6 text-[var(--ro-sand-100)]">
          <span
            aria-hidden
            className="flex size-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--ro-sand-100)_16%,transparent)] font-display text-xl font-semibold"
          >
            {trader.displayName.trim().slice(0, 1) || "T"}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-display text-xl font-semibold">
              {trader.displayName}
            </p>
            <p dir="ltr" className="text-sm opacity-80">
              {trader.email}
            </p>
          </div>
          <StatusChip
            size="sm"
            {...getStatusChipProps(dict, "trader", trader.status)}
          />
        </div>
        <DetailList>
          <DetailItem label={u.traderCompany}>
            {trader.companyName || "—"}
          </DetailItem>
          <DetailItem label={u.traderPhone}>
            <span dir="ltr">{trader.phone || "—"}</span>
          </DetailItem>
          <DetailItem label={u.colCreated}>
            {formatDate(trader.createdAt, locale, { dateStyle: "medium" })}
          </DetailItem>
          <DetailItem label={u.traderInterests}>
            {interests.length > 0 ? interests.join(" · ") : "—"}
          </DetailItem>
        </DetailList>
      </div>

      <TraderEditForm
        traderId={trader.id}
        displayName={trader.displayName}
        companyName={trader.companyName}
        phone={trader.phone}
        adminNotes={trader.adminNotes}
        interestNotes={trader.interestNotes}
        selectedSlugs={interests}
        categories={categoryOptions}
        dict={dict}
      />

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-[color:var(--ro-text)]">
          {u.traderActivity}
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {[
            {
              label: u.colDeals,
              value: trader._count.deals,
              href: "/admin/deals",
            },
            {
              label: u.colWholesale,
              value: trader._count.wholesaleRequests,
              href: "/admin/wholesale",
            },
            {
              label: u.colBrokerage,
              value: trader._count.brokerageRequests,
              href: "/admin/brokerage",
            },
          ].map((card) => (
            <Link
              key={card.href + card.label}
              href={card.href}
              className="ro-portal-card border p-4 transition-opacity hover:opacity-95"
            >
              <p className="text-xs font-medium text-[color:var(--ro-text-muted)]">
                {card.label}
              </p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-[color:var(--ro-text)]">
                {card.value}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <DetailSection title={u.traderWaTitle}>
        {waConversations.length === 0 ? (
          <p className="text-sm text-[color:var(--ro-text-muted)]">
            {u.traderWaEmpty}
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

      <ActivityBlock
        title={u.traderRecentDeals}
        empty={u.traderNoActivity}
        rows={trader.deals.map((d) => ({
          id: d.id,
          href: `/admin/deals/${d.id}`,
          title: d.title || d.reference,
          meta: d.reference,
          status: (
            <StatusChip
              size="sm"
              {...getStatusChipProps(dict, "deal", d.status)}
            />
          ),
          when: formatRelative(d.updatedAt, locale),
        }))}
      />
      <ActivityBlock
        title={u.traderRecentWholesale}
        empty={u.traderNoActivity}
        rows={trader.wholesaleRequests.map((w) => ({
          id: w.id,
          href: `/admin/wholesale/${w.id}`,
          title: w.reference,
          meta: w.reference,
          status: (
            <StatusChip
              size="sm"
              {...getStatusChipProps(dict, "wholesale", w.status)}
            />
          ),
          when: formatRelative(w.updatedAt, locale),
        }))}
      />
      <ActivityBlock
        title={u.traderRecentBrokerage}
        empty={u.traderNoActivity}
        rows={trader.brokerageRequests.map((b) => ({
          id: b.id,
          href: `/admin/brokerage/${b.id}`,
          title: b.reference,
          meta:
            localizedName(locale, b.cityAr, b.cityEn) ||
            b.cityAr ||
            b.cityEn ||
            b.reference,
          status: (
            <StatusChip
              size="sm"
              tone="info"
              label={brokerageStatusLabel(b.status, locale)}
            />
          ),
          when: formatRelative(b.updatedAt, locale),
        }))}
      />
    </section>
  );
}

function ActivityBlock({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: {
    id: string;
    href: string;
    title: string;
    meta: string;
    status: ReactNode;
    when: string;
  }[];
}) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-base font-semibold text-[color:var(--ro-text)]">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[color:var(--ro-text-muted)]">{empty}</p>
      ) : (
        <ul className="divide-y divide-[color:var(--ro-border-subtle)] overflow-hidden rounded-[var(--ro-r-sm)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel)]">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={row.href}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-opacity hover:opacity-90"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[color:var(--ro-text)]">
                    {row.title}
                  </p>
                  <p className="text-xs text-[color:var(--ro-text-muted)]" dir="ltr">
                    {row.meta}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {row.status}
                  <span className="text-xs text-[color:var(--ro-text-muted)]">
                    {row.when}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
