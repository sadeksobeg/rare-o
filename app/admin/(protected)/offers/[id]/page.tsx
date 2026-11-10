import { PublicOfferForm } from "@/components/admin/public-offer-form";
import { Card, DetailBack, DetailHeader } from "@/components/ui-kit";
import { uiVisibleDealWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import { notFound } from "next/navigation";

export default async function AdminOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const offer = await prisma.publicCuratedOffer.findUnique({ where: { id } });
  if (!offer) notFound();

  const [deals, products] = await Promise.all([
    prisma.dealProposal.findMany({
      where: uiVisibleDealWhere(),
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: { id: true, reference: true, title: true },
    }),
    prisma.product.findMany({
      where: { status: "published" },
      orderBy: { nameEn: "asc" },
      select: { id: true, slug: true, nameEn: true, nameAr: true },
    }),
  ]);

  const title =
    (locale === "ar"
      ? offer.titleAr || offer.titleEn
      : offer.titleEn || offer.titleAr) || offer.slug;
  const chip = getStatusChipProps(dict, "offer", offer.status);

  return (
    <section data-admin-offer-detail="" className="space-y-5 pb-8">
      <DetailBack href="/admin/offers">{a.offers}</DetailBack>
      <DetailHeader
        reference={title}
        mono={false}
        status={chip.label}
        statusTone={statusToneToPill(chip.tone)}
        meta={
          <bdi dir="ltr" className="rad-mono">
            {offer.slug}
          </bdi>
        }
      />
      <Card aria-label={`${u.detail.editOffer}: ${title}`}>
        <div className="px-4 py-5 sm:px-5 sm:py-6">
          <PublicOfferForm
            offer={{
              id: offer.id,
              slug: offer.slug,
              titleAr: offer.titleAr,
              titleEn: offer.titleEn,
              summaryAr: offer.summaryAr,
              summaryEn: offer.summaryEn,
              dealProposalId: offer.dealProposalId,
              productId: offer.productId,
              sortOrder: offer.sortOrder,
              status: offer.status,
            }}
            deals={deals}
            products={products}
            labels={dict.adminUi}
            locale={locale}
          />
        </div>
      </Card>
    </section>
  );
}
