import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { BrokerageHeroStrip } from "@/components/brokerage/hero-strip";
import { brokerageStatusLabel } from "@/components/brokerage/labels";
import { BrokerageLifecycleRail } from "@/components/brokerage/lifecycle-rail";
import { BrokerageStatusBadge } from "@/components/brokerage/status-badge";
import { BrokeragePhotoGallery } from "@/components/brokerage/photo-gallery";
import { BrokerageStatusBrief } from "@/components/brokerage/status-brief";
import { BrokerageTimeline } from "@/components/brokerage/timeline";
import { BrokerageNeedsInfoActions } from "@/components/trader/brokerage-needs-info-actions";
import { BrokerageQuoteActions } from "@/components/trader/brokerage-quote-actions";
import { PaymentHandoffCard } from "@/components/trader/payment-handoff-card";
import { getBrokerageForTrader } from "@/lib/brokerage/service";
import { parsePhotoPaths } from "@/lib/brokerage/media-shared";
import { getTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/ui/trader-labels";
import { localizedName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TraderBrokerageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getTraderSession();
  if (!session) redirect("/trader/login");
  const { id } = await params;
  const row = await getBrokerageForTrader(id, session.sub);
  if (!row) notFound();
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;

  const quote = row.quote;
  const requestPhotos = parsePhotoPaths(row.photoPaths);
  const inspectionPhotos = parsePhotoPaths(row.inspection?.photoPaths);

  return (
    <section className="space-y-6">
      <Link
        href="/trader/brokerage"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-[color:var(--rad-ac)] underline-offset-2 hover:underline"
      >
        <ArrowLeft className="size-4 rtl:-scale-x-100" strokeWidth={1.5} />
        {t.brokerageMyRequests}
      </Link>

      <BrokerageHeroStrip
        eyebrow={t.brokerageYourRequest}
        title={
          <span className="font-mono" dir="ltr">
            <bdi dir="ltr">{row.reference}</bdi>
          </span>
        }
        subtitle={localizedName(locale, row.descriptionAr, row.descriptionEn)}
        actions={
          <BrokerageStatusBadge
            status={row.status}
            label={brokerageStatusLabel(row.status, locale)}
            className="px-3 py-1 text-sm"
          />
        }
      />

      <BrokerageStatusBrief
        status={row.status}
        locale={locale}
        audience="trader"
      />

      <div className="rad-card px-4 py-5 sm:px-6">
        <p className="mb-3 text-[0.65rem] font-medium text-[color:var(--rad-tx3)]">
          {t.brokeragePath}
        </p>
        <BrokerageLifecycleRail status={row.status} locale={locale} />
      </div>

      <div className="rad-card grid gap-3 p-5 text-sm sm:grid-cols-2">
        <div>
          <p className="text-[0.65rem] text-[color:var(--rad-tx3)]">
            {t.modelNumberLabel}
          </p>
          <p className="mt-1 font-semibold text-[color:var(--rad-tx)]" dir="ltr">
            <bdi dir="ltr">{row.modelNumber || "—"}</bdi>
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] text-[color:var(--rad-tx3)]">
            {t.brokerageFieldBudgetMin}
          </p>
          <p
            className="mt-1 font-semibold tabular-nums text-[color:var(--rad-tx)]"
            dir="ltr"
          >
            {row.statedPriceUsd != null ? (
              <bdi dir="ltr">{formatMoney(row.statedPriceUsd, "USD", locale)}</bdi>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      {row.status === "AWAITING_PAYMENT" ? (
        <PaymentHandoffCard
          kind="brokerage"
          recordId={row.id}
          title={t.brokeragePayTitle}
          body={t.brokeragePayBody}
          openLabel={t.dealPayOpenWa}
          unavailableLabel={t.dealPayUnavailable}
          deepLink={row.whatsAppDeepLink}
          messageText={row.handoffMessageText}
        />
      ) : null}

      <BrokeragePhotoGallery
        paths={requestPhotos}
        title={t.brokerageYourPhotos}
        emptyLabel={t.brokerageNoPhotos}
      />

      {row.status === "NEEDS_INFO" ? (
        <div className="rad-card border-[color-mix(in_srgb,var(--rad-warn)_40%,var(--rad-bd))] bg-[color:var(--rad-warns)] p-5">
          <h2 className="mb-3 text-lg font-semibold text-[color:var(--rad-tx)]">
            {t.brokerageInfoNeeded}
          </h2>
          <BrokerageNeedsInfoActions
            requestId={row.id}
            locale={locale}
            alreadyPhotoCount={requestPhotos.length}
          />
        </div>
      ) : null}

      {row.status === "QUOTE_SENT" && quote ? (
        <div className="rad-card overflow-hidden border-[color-mix(in_srgb,var(--rad-ac)_35%,var(--rad-bd))]">
          <div className="border-b border-[color:var(--rad-bd)] bg-[color-mix(in_srgb,var(--rad-ac)_8%,var(--rad-surface))] px-5 py-4">
            <h2 className="text-lg font-semibold text-[color:var(--rad-tx)]">
              {t.brokerageQuoteTitle}
            </h2>
            <p className="mt-1 text-sm text-[color:var(--rad-tx2)]">
              {t.brokerageQuoteAwaiting}
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div>
              <p className="text-[0.65rem] text-[color:var(--rad-tx3)]">
                {t.brokerageGoodsValue}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[color:var(--rad-tx)]">
                <bdi dir="ltr">
                  {formatMoney(quote.goodsValueUsd, "USD", locale)}
                </bdi>
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] text-[color:var(--rad-tx3)]">
                {t.brokerageCommission}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[color:var(--rad-tx)]">
                <bdi dir="ltr">{quote.commissionRate}%</bdi>
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] text-[color:var(--rad-tx3)]">
                {t.brokerageShipping}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[color:var(--rad-tx)]">
                <bdi dir="ltr">
                  {formatMoney(quote.shippingUsd, "USD", locale)}
                </bdi>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--rad-bd)] bg-[color:var(--rad-surface3)] px-5 py-4">
            <div>
              <p className="text-[0.65rem] text-[color:var(--rad-tx3)]">
                {t.brokerageQuoteTotal}
              </p>
              <p className="text-2xl font-semibold tabular-nums text-[color:var(--rad-ac)]">
                <bdi dir="ltr">
                  {formatMoney(
                    quote.goodsValueUsd +
                      quote.goodsValueUsd * (quote.commissionRate / 100) +
                      quote.shippingUsd,
                    "USD",
                    locale
                  )}
                </bdi>
              </p>
            </div>
            <BrokerageQuoteActions requestId={row.id} labels={dict.trader} />
          </div>
        </div>
      ) : null}

      {row.inspection ? (
        <div className="rad-card p-5">
          <h2 className="text-lg font-semibold text-[color:var(--rad-tx)]">
            {t.brokerageInspectionReport}
          </h2>
          <p className="mt-3 inline-flex rounded-md bg-[color-mix(in_srgb,var(--rad-ac)_14%,var(--rad-surface3))] px-2.5 py-1 text-sm font-semibold text-[color:var(--rad-ac)]">
            {t.brokerageGrade}: {row.inspection.grade}
          </p>
          <p className="mt-3 text-sm text-[color:var(--rad-tx)]">
            {localizedName(
              locale,
              row.inspection.verdictAr,
              row.inspection.verdictEn
            )}
          </p>
          <p className="mt-1 text-sm text-[color:var(--rad-tx2)]">
            {localizedName(
              locale,
              row.inspection.notesAr,
              row.inspection.notesEn
            )}
          </p>
          {inspectionPhotos.length > 0 ? (
            <div className="mt-4">
              <BrokeragePhotoGallery
                paths={inspectionPhotos}
                title={t.brokerageInspectionPhotos}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {(row.carrier || row.trackingRef) && (
        <div
          className="rad-card flex items-center gap-3 px-5 py-4 text-sm"
          dir="ltr"
        >
          <Package
            className="size-4 shrink-0 text-[color:var(--rad-ac)]"
            strokeWidth={1.5}
          />
          <span className="font-mono">
            <bdi dir="ltr">
              {row.carrier} · {row.trackingRef}
            </bdi>
          </span>
        </div>
      )}

      <BrokerageTimeline
        events={row.events}
        locale={locale}
        title={t.brokerageTimeline}
      />
    </section>
  );
}
