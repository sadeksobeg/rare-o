import { PublicOfferForm } from "@/components/admin/public-offer-form";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export default async function AdminOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      select: { id: true, slug: true, nameEn: true },
    }),
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl">Edit offer</h1>
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
      />
    </section>
  );
}
