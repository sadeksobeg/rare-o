import { PageHeader } from "@/components/admin/page-header";
import { PublicOfferForm } from "@/components/admin/public-offer-form";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { notFound } from "next/navigation";

export default async function AdminOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const offer = await prisma.publicCuratedOffer.findUnique({ where: { id } });
  if (!offer) notFound();

  const [deals, products] = await Promise.all([
    prisma.dealProposal.findMany({
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

  return (
    <section className="space-y-6">
      <PageHeader
        title={`${dict.adminUi.detail.editOffer}: ${title}`}
        description={dict.adminUi.offersLead}
      />
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
    </section>
  );
}
