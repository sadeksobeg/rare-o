import { PageHeader } from "@/components/admin/page-header";
import { PromoBandForm } from "@/components/admin/promo-band-form";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getPromoBandById } from "@/lib/promos/service";
import { notFound } from "next/navigation";

export default async function AdminPromoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const band = await getPromoBandById(id);
  if (!band) notFound();

  const title =
    (locale === "ar"
      ? band.titleAr || band.titleEn
      : band.titleEn || band.titleAr) || band.slug;

  return (
    <section className="space-y-6">
      <PageHeader
        title={`${dict.admin.edit}: ${title}`}
        description={dict.adminUi.promosLead}
      />
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
    </section>
  );
}
