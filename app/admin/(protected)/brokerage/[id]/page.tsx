import { notFound } from "next/navigation";
import { MapPin, Package, User } from "lucide-react";
import { BrokerageAdminPanel } from "@/components/admin/brokerage-admin-panel";
import { brokerageStatusLabel } from "@/components/brokerage/labels";
import { BrokerageLifecycleRail } from "@/components/brokerage/lifecycle-rail";
import { BrokeragePhotoGallery } from "@/components/brokerage/photo-gallery";
import { brokeragePillTone } from "@/components/brokerage/status-badge";
import { BrokerageStatusBrief } from "@/components/brokerage/status-brief";
import { BrokerageTimeline } from "@/components/brokerage/timeline";
import {
  Card,
  CardHeader,
  DetailBack,
  DetailGrid,
  DetailHeader,
  KeyValue,
  Pill,
} from "@/components/ui-kit";
import { getBrokerageForAdmin } from "@/lib/brokerage/service";
import { parsePhotoPaths } from "@/lib/brokerage/media-shared";
import { formatAdminMoney, formatAdminNumber } from "@/lib/i18n/admin-format";
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
  const requestPhotos = parsePhotoPaths(row.photoPaths);
  const inspectionPhotos = parsePhotoPaths(row.inspection?.photoPaths);
  const statusLabel = brokerageStatusLabel(row.status, locale);

  return (
    <section data-admin-brokerage-detail="" className="pb-8">
      <DetailBack href="/admin/brokerage">
        {ar ? "الوساطة" : "Brokerage"}
      </DetailBack>

      <DetailHeader
        reference={row.reference}
        status={statusLabel}
        statusTone={brokeragePillTone(row.status)}
        meta={localizedName(locale, row.descriptionAr, row.descriptionEn)}
      />

      <div className="mb-4">
        <BrokerageStatusBrief
          status={row.status}
          locale={locale}
          audience="admin"
        />
      </div>

      <Card padded={false} className="mb-4">
        <CardHeader title={ar ? "مسار الوساطة" : "Brokerage path"} />
        <div className="rad-cb2">
          <BrokerageLifecycleRail status={row.status} locale={locale} />
        </div>
      </Card>

      <DetailGrid
        main={
          <>
            <Card padded={false}>
              <CardHeader title={ar ? "تفاصيل القطعة" : "Piece details"} />
              <div className="rad-cb2">
                <KeyValue
                  items={[
                    {
                      label: ar ? "رقم الموديل" : "Model number",
                      value: (
                        <bdi dir="ltr">{row.modelNumber || "—"}</bdi>
                      ),
                    },
                    {
                      label: ar ? "سعر التاجر" : "Trader price",
                      value:
                        row.statedPriceUsd != null ? (
                          <bdi dir="ltr">
                            {formatAdminMoney(
                              row.statedPriceUsd,
                              "USD",
                              locale
                            )}
                          </bdi>
                        ) : (
                          "—"
                        ),
                    },
                    {
                      label: ar ? "المدينة" : "City",
                      value:
                        localizedName(locale, row.cityAr, row.cityEn) || "—",
                    },
                    {
                      label: ar ? "المكان" : "Place",
                      value:
                        localizedName(
                          locale,
                          row.placeNameAr,
                          row.placeNameEn
                        ) || "—",
                    },
                    {
                      label: ar ? "الكمية" : "Qty",
                      value: String(row.quantity),
                    },
                    ...(row.quote
                      ? [
                          {
                            label: ar ? "العرض" : "Quote",
                            value: (
                              <span className="rad-mono" style={{ fontSize: 12 }}>
                                <bdi dir="ltr">
                                  {formatAdminMoney(
                                    row.quote.goodsValueUsd,
                                    "USD",
                                    locale
                                  )}{" "}
                                  +{" "}
                                  {formatAdminNumber(
                                    row.quote.commissionRate,
                                    locale,
                                    { maximumFractionDigits: 1 }
                                  )}
                                  % +{" "}
                                  {formatAdminMoney(
                                    row.quote.shippingUsd,
                                    "USD",
                                    locale
                                  )}
                                </bdi>
                              </span>
                            ),
                            full: true as const,
                          },
                        ]
                      : []),
                    ...(row.inspection
                      ? [
                          {
                            label: ar ? "معاينة" : "Inspection",
                            value: `${row.inspection.grade} — ${localizedName(
                              locale,
                              row.inspection.verdictAr,
                              row.inspection.verdictEn
                            )}`,
                            full: true as const,
                          },
                        ]
                      : []),
                    ...(row.trackingRef
                      ? [
                          {
                            label: ar ? "الشحن" : "Shipping",
                            value: (
                              <span className="inline-flex items-center gap-2">
                                <Package
                                  width={14}
                                  height={14}
                                  strokeWidth={1.5}
                                  aria-hidden
                                />
                                <bdi dir="ltr">
                                  {row.carrier} · {row.trackingRef}
                                </bdi>
                              </span>
                            ),
                            full: true as const,
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            </Card>

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

            <BrokerageTimeline
              events={row.events}
              locale={locale}
              title={ar ? "الخط الزمني" : "Timeline"}
            />
          </>
        }
        rail={
          <>
            <Card padded={false}>
              <CardHeader title={ar ? "التاجر" : "Trader"} />
              <div className="rad-cb2">
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <span className="rad-chip rad-c-ac">
                    <User width={16} height={16} strokeWidth={1.5} aria-hidden />
                  </span>
                  <div>
                    <b>{row.trader.displayName}</b>
                    <div style={{ color: "var(--rad-tx3)", fontSize: 12.5 }}>
                      <bdi dir="ltr">{row.trader.email}</bdi>
                    </div>
                  </div>
                </div>
                <div
                  className="mt-3 flex items-center gap-2 text-sm"
                  style={{ color: "var(--rad-tx2)" }}
                >
                  <MapPin width={14} height={14} strokeWidth={1.5} aria-hidden />
                  {localizedName(locale, row.cityAr, row.cityEn) || "—"}
                </div>
                <div className="mt-3">
                  <Pill tone={brokeragePillTone(row.status)}>{statusLabel}</Pill>
                </div>
              </div>
            </Card>

            <Card padded={false}>
              <CardHeader title={ar ? "إجراءات الإدارة" : "Admin actions"} />
              <div className="rad-cb2">
                <BrokerageAdminPanel
                  requestId={row.id}
                  status={row.status}
                  locale={locale}
                  hasInspection={Boolean(row.inspection)}
                  inspectionPhotoCount={inspectionPhotos.length}
                />
              </div>
            </Card>
          </>
        }
      />
    </section>
  );
}
