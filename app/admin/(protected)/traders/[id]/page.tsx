import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Store } from "lucide-react";
import {
  TraderResetPasswordButton,
  TraderStatusButton,
} from "@/components/admin/trader-forms";
import {
  DetailItem,
  DetailList,
} from "@/components/admin/detail-list";
import { PageHeader } from "@/components/admin/page-header";
import { StatusChip } from "@/components/ui/status-chip";
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

  const trader = await prisma.traderAccount.findFirst({
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
    },
  });
  if (!trader) notFound();

  const interests = parseInterestSlugs(trader.interestCategorySlugs);
  const initial = trader.displayName.trim().slice(0, 1) || "T";

  return (
    <section className="space-y-8">
      <p>
        <Link
          href="/admin/traders"
          className="text-sm font-medium text-[var(--ro-plum-900)] underline-offset-4 hover:underline"
        >
          {u.traderBack}
        </Link>
      </p>
      <PageHeader
        overline={a.traders}
        title={trader.displayName}
        description={u.traderDetailLead}
        icon={<Store className="size-5" strokeWidth={2} />}
        action={
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
      />

      <div className="overflow-hidden rounded-[var(--ro-r-sm)] border border-ro-line bg-ro-surface">
        <div className="flex flex-wrap items-center gap-4 border-b border-[color-mix(in_srgb,var(--ro-plum-900)_12%,transparent)] bg-[linear-gradient(135deg,var(--ro-plum-900)_0%,var(--ro-ink-950)_100%)] px-5 py-6 text-[var(--ro-sand-100)]">
          <span
            aria-hidden
            className="flex size-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--ro-sand-100)_16%,transparent)] font-display text-xl font-semibold"
          >
            {initial}
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
          <DetailItem label={u.traderNotes}>
            {trader.adminNotes?.trim() || "—"}
          </DetailItem>
          <DetailItem label={u.traderInterests}>
            {interests.length > 0 ? interests.join(" · ") : "—"}
          </DetailItem>
        </DetailList>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ro-ink">
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
              <p className="text-xs font-medium text-ro-muted">{card.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                {card.value}
              </p>
            </Link>
          ))}
        </div>
      </div>

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
      <h2 className="font-display text-base font-semibold text-ro-ink">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ro-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-[color-mix(in_srgb,var(--ro-plum-900)_10%,transparent)] rounded-[var(--ro-r-sm)] border border-ro-line bg-ro-surface">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={row.href}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-opacity hover:opacity-90"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ro-ink">{row.title}</p>
                  <p className="text-xs text-ro-muted" dir="ltr">
                    {row.meta}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {row.status}
                  <span className="text-xs text-ro-muted">{row.when}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
