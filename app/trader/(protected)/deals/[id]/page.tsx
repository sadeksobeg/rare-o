import type { ReactNode } from "react";
import { NegotiationThread } from "@/components/deals/negotiation-thread";
import { TraderDealPhaseCard } from "@/components/trader/deal-phase-card";
import { dealPhase } from "@/lib/deals/constants";
import { Banner } from "@/components/ui/banner";
import { Card, CardHeader } from "@/components/ui-kit/card";
import {
  DetailBack,
  DetailHeader,
  DetailStepper,
  KeyValue,
  type DetailStep,
} from "@/components/ui-kit/detail";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getDealForTrader } from "@/lib/deals/service";
import { isOpenDealStatus, isDealStatus } from "@/lib/deals/constants";
import { getRequestDictionary } from "@/lib/i18n/server";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import { dealNextActor, getStatusMeta, getStatusSequence } from "@/lib/ui/status";
import { getStatusLabel } from "@/lib/ui/status-labels";
import {
  dealStatusLabel,
  fmt,
  formatMoney,
} from "@/lib/ui/trader-labels";
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

  const open = isDealStatus(deal.status) && isOpenDealStatus(deal.status);
  const lastActor = (deal.entries[deal.entries.length - 1]?.actorRole ??
    null) as "trader" | "admin" | null;
  const nextActor = dealNextActor(deal.status, lastActor);
  const statusText = dealStatusLabel(t, deal.status);
  const productName = deal.product
    ? locale === "ar"
      ? deal.product.nameAr || deal.product.nameEn
      : deal.product.nameEn || deal.product.nameAr
    : null;

  const sequence = getStatusSequence("deal");
  const index = sequence.indexOf(deal.status);
  const offPath = index === -1;
  const steps: DetailStep[] = sequence.map((value, i) => ({
    value,
    label: getStatusLabel(dict, "deal", value),
    state: offPath
      ? "upcoming"
      : i < index
        ? "done"
        : i === index
          ? "current"
          : "upcoming",
  }));
  if (offPath) {
    steps.push({
      value: deal.status,
      label: statusText,
      state: "blocked",
    });
  }

  return (
    <section className="space-y-6 pb-[calc(68px+env(safe-area-inset-bottom,0px)+24px)] min-[901px]:pb-0">
      <DetailBack href="/trader/deals">{t.deals}</DetailBack>
      <DetailHeader
        reference={deal.title}
        mono={false}
        status={statusText}
        statusTone={statusToneToPill(getStatusMeta("deal", deal.status).tone)}
        meta={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="rad-mono">{deal.reference}</span>
            <span aria-hidden>·</span>
            <span>{t.dealKind[deal.dealKind] ?? deal.dealKind}</span>
          </span>
        }
      />

      <DetailStepper
        aria-label={dict.adminUi.detail.stepperLabel}
        steps={steps}
      />

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

      <Card padded={false}>
        <CardHeader title={t.dealSnapshot} />
        <div className="rad-cb2">
          <KeyValue
            items={(() => {
              const items: {
                label: string;
                value: React.ReactNode;
                full?: boolean;
                nowrap?: boolean;
              }[] = [
                {
                  label: t.dealProduct,
                  value: deal.product ? productName : t.dealNonCatalog,
                },
              ];
              if (deal.modelNumber?.trim()) {
                items.push({
                  label: t.modelNumberLabel,
                  value: <bdi dir="ltr">{deal.modelNumber}</bdi>,
                  nowrap: true,
                });
              }
              if (deal.proposedPrice != null) {
                items.push({
                  label: locale === "ar" ? "السعر الحالي للوحدة" : "Current unit price",
                  value: <bdi dir="ltr">{formatMoney(deal.proposedPrice, deal.currency, locale)}</bdi>,
                });
                if (deal.quantity != null && deal.quantity > 0) {
                  items.push({
                    label: t.dealQtyShort,
                    value: String(deal.quantity),
                  });
                  items.push({
                    label: locale === "ar" ? "الإجمالي" : "Total",
                    value: (
                      <b dir="ltr">
                        {formatMoney(Number(deal.proposedPrice) * deal.quantity, deal.currency, locale)}
                      </b>
                    ),
                  });
                }
              } else if (deal.quantity != null) {
                items.push({
                  label: t.dealQtyShort,
                  value: String(deal.quantity),
                });
              }
              if (deal.conditionsNotes?.trim()) {
                items.push({
                  label: t.dealConditions,
                  value: deal.conditionsNotes,
                  full: true,
                });
              }
              return items;
            })()}
          />
        </div>
      </Card>

      {(() => {
        const phase = dealPhase(deal);
        if (phase === "negotiating" || phase === "rejected" || phase === "closed") return null;
        return (
          <TraderDealPhaseCard
            dealId={deal.id}
            phase={phase}
            invoiceUrl={deal.invoiceToken ? `/deal-invoice/${deal.invoiceToken}` : null}
            whatsAppDeepLink={deal.whatsAppDeepLink}
            claimed={Boolean(deal.paymentClaimedAt)}
            carrier={deal.carrier}
            tracking={deal.trackingReference}
          />
        );
      })()}

      <NegotiationThread
        entries={deal.entries}
        dealId={deal.id}
        mode="trader"
        open={open}
        locale={locale}
        labels={t}
        title={t.dealHistory}
        money={(v, c) => formatMoney(v as number, c, locale)}
        termsLabel={t.dealTerms}
        qtyLabel={t.dealQtyShort}
        currency={deal.currency}
      />

      {!open &&
      deal.status !== "awaiting_payment" &&
      deal.status !== "payment_confirmed" ? (
        <p className="text-sm text-[color:var(--rad-tx3)]">
          {fmt(t.dealClosed, { status: statusText })}
        </p>
      ) : null}
    </section>
  );
}
