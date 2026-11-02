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
import { getBrokerageForTrader } from "@/lib/brokerage/service";
import { parsePhotoPaths } from "@/lib/brokerage/media-shared";
import { getTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
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
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-[var(--ro-plum-900)] underline-offset-2 hover:underline"
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

      <div className="rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] px-4 py-5 sm:px-6">
        <p className="mb-3 text-[0.65rem] font-medium text-[var(--ro-ink-500)]">
          {t.brokeragePath}
        </p>
        <BrokerageLifecycleRail status={row.status} locale={locale} />
      </div>

      <BrokeragePhotoGallery
        paths={requestPhotos}
        title={t.brokerageYourPhotos}
        emptyLabel={t.brokerageNoPhotos}
      />

      {row.status === "NEEDS_INFO" ? (
        <div className="rounded-[var(--ro-r-lg)] border border-[color-mix(in_srgb,var(--ro-amber-500)_40%,transparent)] bg-[color-mix(in_srgb,var(--ro-amber-100)_45%,var(--ro-sand-50))] p-5">
          <h2 className="mb-3 font-display text-lg font-semibold text-ro-ink">
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
        <div className="overflow-hidden rounded-[var(--ro-r-lg)] border border-[color-mix(in_srgb,var(--ro-plum-700)_35%,transparent)] bg-[var(--ro-sand-50)]">
          <div className="border-b border-[var(--ro-border-subtle)] bg-[color-mix(in_srgb,var(--ro-plum-50)_55%,transparent)] px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-ro-ink">
              {t.brokerageQuoteTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--ro-ink-600)]">
              {t.brokerageQuoteAwaiting}
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div>
              <p className="text-[0.65rem] text-[var(--ro-ink-500)]">
                {t.brokerageGoodsValue}
              </p>
              <p
                className="mt-1 font-display text-xl font-semibold tabular-nums"
                dir="ltr"
              >
                <bdi dir="ltr">{quote.goodsValueUsd.toFixed(2)}</bdi>
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] text-[var(--ro-ink-500)]">
                {t.brokerageCommission}
              </p>
              <p
                className="mt-1 font-display text-xl font-semibold tabular-nums"
                dir="ltr"
              >
                <bdi dir="ltr">{quote.commissionRate}%</bdi>
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] text-[var(--ro-ink-500)]">
                {t.brokerageShipping}
              </p>
              <p
                className="mt-1 font-display text-xl font-semibold tabular-nums"
                dir="ltr"
              >
                <bdi dir="ltr">{quote.shippingUsd.toFixed(2)}</bdi>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ro-border-subtle)] bg-[color-mix(in_srgb,var(--ro-ink-950)_4%,var(--ro-sand-50))] px-5 py-4">
            <div>
              <p className="text-[0.65rem] text-[var(--ro-ink-500)]">
                {t.brokerageQuoteTotal}
              </p>
              <p
                className="font-display text-2xl font-semibold tabular-nums text-[var(--ro-plum-900)]"
                dir="ltr"
              >
                <bdi dir="ltr">
                  {(
                    quote.goodsValueUsd +
                    quote.goodsValueUsd * (quote.commissionRate / 100) +
                    quote.shippingUsd
                  ).toFixed(2)}
                </bdi>
              </p>
            </div>
            <BrokerageQuoteActions requestId={row.id} labels={dict.trader} />
          </div>
        </div>
      ) : null}

      {row.inspection ? (
        <div className="rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-5">
          <h2 className="font-display text-lg font-semibold text-ro-ink">
            {t.brokerageInspectionReport}
          </h2>
          <p className="mt-3 inline-flex rounded-md bg-[var(--ro-plum-100)] px-2.5 py-1 text-sm font-semibold text-[var(--ro-plum-900)]">
            {t.brokerageGrade}: {row.inspection.grade}
          </p>
          <p className="mt-3 text-sm text-ro-ink">
            {localizedName(
              locale,
              row.inspection.verdictAr,
              row.inspection.verdictEn
            )}
          </p>
          <p className="mt-1 text-sm text-[var(--ro-ink-600)]">
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
          className="flex items-center gap-3 rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] px-5 py-4 text-sm"
          dir="ltr"
        >
          <Package
            className="size-4 shrink-0 text-[var(--ro-plum-700)]"
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
