import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin, Package, User } from "lucide-react";
import { BrokerageAdminPanel } from "@/components/admin/brokerage-admin-panel";
import { BrokerageHeroStrip } from "@/components/brokerage/hero-strip";
import { brokerageStatusLabel } from "@/components/brokerage/labels";
import { BrokerageLifecycleRail } from "@/components/brokerage/lifecycle-rail";
import { BrokerageStatusBadge } from "@/components/brokerage/status-badge";
import { BrokeragePhotoGallery } from "@/components/brokerage/photo-gallery";
import { BrokerageStatusBrief } from "@/components/brokerage/status-brief";
import { BrokerageTimeline } from "@/components/brokerage/timeline";
import { getBrokerageForAdmin } from "@/lib/brokerage/service";
import { parsePhotoPaths } from "@/lib/brokerage/media-shared";
import { getRequestDictionary } from "@/lib/i18n/server";
import { localizedName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBrokerageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getBrokerageForAdmin(id);
  if (!row) notFound();
  const { locale } = await getRequestDictionary();
  const ar = locale === "ar";
  const BackIcon = ar ? ArrowRight : ArrowLeft;
  const requestPhotos = parsePhotoPaths(row.photoPaths);
  const inspectionPhotos = parsePhotoPaths(row.inspection?.photoPaths);

  return (
    <section className="space-y-6">
      <Link
        href="/admin/brokerage"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-[var(--ro-plum-900)] underline-offset-2 hover:underline"
      >
        <BackIcon className="size-4" strokeWidth={1.5} />
        {ar ? "الوساطة" : "Brokerage"}
      </Link>

      <BrokerageHeroStrip
        eyebrow={ar ? "طلب وساطة" : "Brokerage request"}
        title={
          <span className="font-mono tracking-tight" dir="ltr">
            {row.reference}
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
        audience="admin"
      />

      <div className="rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] px-4 py-5 sm:px-6">
        <p className="mb-3 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[var(--ro-ink-500)]">
          {ar ? "مسار الوساطة" : "Brokerage path"}
        </p>
        <BrokerageLifecycleRail status={row.status} locale={locale} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-5">
            <div className="mb-3 flex items-center gap-2 text-[var(--ro-plum-800)]">
              <User className="size-4" strokeWidth={1.5} />
              <h2 className="font-display text-base font-semibold text-ro-ink">
                {ar ? "التاجر" : "Trader"}
              </h2>
            </div>
            <p className="font-medium text-ro-ink">{row.trader.displayName}</p>
            <p className="mt-0.5 text-sm text-[var(--ro-ink-600)]">
              <bdi dir="ltr">{row.trader.email}</bdi>
            </p>
          </div>

          <div className="rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-5 text-sm">
            <div className="mb-3 flex items-center gap-2 text-[var(--ro-plum-800)]">
              <MapPin className="size-4" strokeWidth={1.5} />
              <h2 className="font-display text-base font-semibold text-ro-ink">
                {ar ? "تفاصيل القطعة" : "Piece details"}
              </h2>
            </div>
            <dl className="space-y-2.5">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--ro-ink-500)]">
                  {ar ? "رقم الموديل" : "Model number"}
                </dt>
                <dd className="text-end font-medium text-ro-ink" dir="ltr">
                  <bdi dir="ltr">{row.modelNumber || "—"}</bdi>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--ro-ink-500)]">
                  {ar ? "سعر التاجر" : "Trader price"}
                </dt>
                <dd className="font-medium tabular-nums text-ro-ink" dir="ltr">
                  {row.statedPriceUsd != null ? (
                    <bdi dir="ltr">${row.statedPriceUsd}</bdi>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--ro-ink-500)]">{ar ? "المدينة" : "City"}</dt>
                <dd className="text-end font-medium text-ro-ink">
                  {localizedName(locale, row.cityAr, row.cityEn) || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--ro-ink-500)]">{ar ? "المكان" : "Place"}</dt>
                <dd className="text-end font-medium text-ro-ink">
                  {localizedName(locale, row.placeNameAr, row.placeNameEn) || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--ro-ink-500)]">{ar ? "الكمية" : "Qty"}</dt>
                <dd className="font-medium tabular-nums text-ro-ink">{row.quantity}</dd>
              </div>
              {row.quote ? (
                <div className="border-t border-[var(--ro-border-subtle)] pt-2.5" dir="ltr">
                  <dt className="text-[var(--ro-ink-500)]">{ar ? "العرض" : "Quote"}</dt>
                  <dd className="mt-1 font-mono text-xs text-ro-ink">
                    ${row.quote.goodsValueUsd} + {row.quote.commissionRate}% + ship $
                    {row.quote.shippingUsd}
                  </dd>
                </div>
              ) : null}
              {row.inspection ? (
                <div className="border-t border-[var(--ro-border-subtle)] pt-2.5">
                  <dt className="text-[var(--ro-ink-500)]">
                    {ar ? "معاينة" : "Inspection"}
                  </dt>
                  <dd className="mt-1 text-ro-ink">
                    {row.inspection.grade} —{" "}
                    {localizedName(
                      locale,
                      row.inspection.verdictAr,
                      row.inspection.verdictEn
                    )}
                  </dd>
                </div>
              ) : null}
              {row.trackingRef ? (
                <div className="flex items-center gap-2 border-t border-[var(--ro-border-subtle)] pt-2.5" dir="ltr">
                  <Package className="size-3.5 shrink-0 text-[var(--ro-ink-500)]" strokeWidth={1.5} />
                  <span className="font-mono text-xs">
                    {row.carrier} · {row.trackingRef}
                  </span>
                </div>
              ) : null}
            </dl>
          </div>

          <BrokeragePhotoGallery
            paths={requestPhotos}
            title={ar ? "صور الطلب" : "Request photos"}
            emptyLabel={
              ar ? "لم يرفق التاجر صوراً بعد" : "No trader photos yet"
            }
          />
          {inspectionPhotos.length > 0 ? (
            <BrokeragePhotoGallery
              paths={inspectionPhotos}
              title={ar ? "صور المعاينة" : "Inspection photos"}
            />
          ) : null}
        </div>

        <div className="rounded-[var(--ro-r-lg)] border border-[var(--ro-plum-300)]/50 bg-[color-mix(in_srgb,var(--ro-plum-50)_40%,var(--ro-sand-50))] p-5 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ro-sand-100)_80%,transparent)]">
          <h2 className="mb-4 font-display text-base font-semibold text-ro-ink">
            {ar ? "إجراءات الإدارة" : "Admin actions"}
          </h2>
          <BrokerageAdminPanel
            requestId={row.id}
            status={row.status}
            locale={locale}
            hasInspection={Boolean(row.inspection)}
            inspectionPhotoCount={inspectionPhotos.length}
          />
        </div>
      </div>

      <BrokerageTimeline
        events={row.events}
        locale={locale}
        title={ar ? "الخط الزمني" : "Timeline"}
      />
    </section>
  );
}
