import { Card, DetailBack, DetailHeader } from "@/components/ui-kit";
import { PromoBandForm } from "@/components/admin/promo-band-form";
import { isPromoFeaturesEnabled } from "@/lib/config/feature-flags";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getPromoBandById } from "@/lib/promos/service";
import { notFound } from "next/navigation";

export default async function AdminPromoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isPromoFeaturesEnabled()) notFound();
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const band = await getPromoBandById(id);
  if (!band) notFound();

  const title =
    (locale === "ar"
      ? band.titleAr || band.titleEn
      : band.titleEn || band.titleAr) || band.slug;

  return (
    <section data-admin-promo-detail="" className="space-y-5 pb-8">
      <DetailBack href="/admin/promos">{dict.admin.promos}</DetailBack>
      <DetailHeader
        reference={`${dict.admin.edit}: ${title}`}
        mono={false}
        meta={dict.adminUi.promosLead}
      />
      <Card aria-label={title}>
        <div className="px-4 py-5 sm:px-5 sm:py-6">
          <PromoBandForm
            labels={dict.adminUi}
            band={{
              id: band.id,
              slug: band.slug,
              titleAr: band.titleAr,
              titleEn: band.titleEn,
              bodyAr: band.bodyAr,
              bodyEn: band.bodyEn,
              ctaLabelAr: band.ctaLabelAr,
              ctaLabelEn: band.ctaLabelEn,
              href: band.href,
              tone: band.tone,
              imagePath: band.imagePath,
              sortOrder: band.sortOrder,
              status: band.status,
              startsAt: band.startsAt,
              endsAt: band.endsAt,
            }}
          />
        </div>
      </Card>
    </section>
  );
}
