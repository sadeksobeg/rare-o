import { NegotiationThread } from "@/components/deals/negotiation-thread";
import { TraderPageHeader } from "@/components/trader/page-header";
import { PaymentHandoffCard } from "@/components/trader/payment-handoff-card";
import { Banner } from "@/components/ui/banner";
import { StatusChip } from "@/components/ui/status-chip";
import { StatusStepper } from "@/components/ui/status-stepper";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getDealForTrader } from "@/lib/deals/service";
import { isOpenDealStatus, isDealStatus } from "@/lib/deals/constants";
import { getRequestDictionary } from "@/lib/i18n/server";
import { dealNextActor, getStatusMeta } from "@/lib/ui/status";
import {
  dealStatusLabel,
  fmt,
  formatMoney,
} from "@/lib/ui/trader-labels";
import { Handshake, Hash, Package, Tags } from "lucide-react";
import { notFound } from "next/navigation";

export default async function TraderDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireTraderSession();
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;

  let deal;
  try {
    deal = await getDealForTrader(id, session.sub);
  } catch {
    notFound();
  }

  const open =
    isDealStatus(deal.status) && isOpenDealStatus(deal.status);
  const lastActor = (deal.entries[deal.entries.length - 1]?.actorRole ??
    null) as "trader" | "admin" | null;
  const nextActor = dealNextActor(deal.status, lastActor);
  const statusText = dealStatusLabel(t, deal.status);
  const productName = deal.product
    ? locale === "ar"
      ? deal.product.nameAr || deal.product.nameEn
      : deal.product.nameEn || deal.product.nameAr
    : null;

  return (
    <section className="ro-portal-stagger space-y-8">
      <TraderPageHeader
        title={deal.title}
        description={deal.reference}
        icon={<Handshake className="size-5" strokeWidth={2} />}
        backHref="/trader/deals"
        backLabel={t.deals}
        action={
          <StatusChip
            tone={getStatusMeta("deal", deal.status).tone}
            label={statusText}
          />
        }
      />
      <p className="text-sm font-semibold text-ro-muted">
        {t.dealKind[deal.dealKind] ?? deal.dealKind}
      </p>
      <StatusStepper domain="deal" current={deal.status} dict={dict} />

      {open && nextActor === "trader" ? (
        <Banner tone="attention">{t.dealWaitingBanner}</Banner>
      ) : open && nextActor === "admin" ? (
        <Banner tone="info">{t.dealWaitingAdmin}</Banner>
      ) : null}

      {deal.status === "rejected"
        ? (() => {
            const rejectEntry = [...deal.entries]
              .reverse()
              .find((e) => e.action === "reject");
            const reason = rejectEntry?.message?.trim();
            return (
              <div data-reject-reason={reason ? "1" : "0"}>
                <Banner tone="danger">
                  {reason
                    ? fmt(t.dealRejectedWithReason, { reason })
                    : t.dealRejected}
                </Banner>
              </div>
            );
          })()
        : null}

      <dl className="ro-portal-card grid gap-4 border p-4 text-sm md:grid-cols-2 md:p-5">
        <div className="flex items-start gap-2.5">
          <span className="ro-portal-icon-well size-8 [&>svg]:size-3.5" aria-hidden>
            <Package className="size-3.5" strokeWidth={2} />
          </span>
          <div>
            <dt className="text-xs font-bold text-ro-muted">{t.dealProduct}</dt>
            <dd className="mt-0.5 font-semibold">
              {deal.product ? productName : t.dealNonCatalog}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="ro-portal-icon-well size-8 [&>svg]:size-3.5" aria-hidden>
            <Hash className="size-3.5" strokeWidth={2} />
          </span>
          <div>
            <dt className="text-xs font-bold text-ro-muted">{t.modelNumberLabel}</dt>
            <dd className="mt-0.5 font-semibold" dir="ltr">
              <bdi dir="ltr">{deal.modelNumber || "—"}</bdi>
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="ro-portal-icon-well size-8 [&>svg]:size-3.5" aria-hidden>
            <Tags className="size-3.5" strokeWidth={2} />
          </span>
          <div>
            <dt className="text-xs font-bold text-ro-muted">{t.dealSnapshot}</dt>
            <dd className="mt-0.5 font-semibold">
              {deal.proposedPrice != null
                ? formatMoney(deal.proposedPrice, deal.currency)
                : "—"}
              {deal.quantity != null
                ? ` · ${t.dealQtyShort} ${deal.quantity}`
                : ""}
            </dd>
          </div>
        </div>
        <div className="md:col-span-2">
          <dt className="text-xs font-bold text-ro-muted">{t.dealConditions}</dt>
          <dd className="ro-portal-message-panel mt-1">
            {deal.conditionsNotes || "—"}
          </dd>
        </div>
      </dl>

      {deal.status === "awaiting_payment" ? (
        <PaymentHandoffCard
          kind="deal"
          recordId={deal.id}
          title={t.dealPayTitle}
          body={t.dealPayBody}
          openLabel={t.dealPayOpenWa}
          unavailableLabel={t.dealPayUnavailable}
          deepLink={deal.whatsAppDeepLink}
          messageText={deal.handoffMessageText}
        />
      ) : null}

      {deal.status === "payment_confirmed" ? (
        <Banner tone="success">{t.dealPayConfirmed}</Banner>
      ) : null}

      <NegotiationThread
        entries={deal.entries}
        dealId={deal.id}
        mode="trader"
        open={open}
        locale={locale}
        labels={t}
        title={t.dealHistory}
        money={(v, c) => formatMoney(v as number, c)}
        termsLabel={t.dealTerms}
        qtyLabel={t.dealQtyShort}
        currency={deal.currency}
      />

      {!open &&
      deal.status !== "awaiting_payment" &&
      deal.status !== "payment_confirmed" ? (
        <p className="ro-portal-muted">
          {fmt(t.dealClosed, { status: statusText })}
        </p>
      ) : null}
    </section>
  );
}
