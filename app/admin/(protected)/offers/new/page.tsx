import { PublicOfferForm } from "@/components/admin/public-offer-form";
import { prisma } from "@/lib/db/prisma";

export default async function AdminNewOfferPage() {
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
      <h1 className="text-3xl">New curated offer</h1>
      <p className="text-sm text-ro-muted">
        Creates a draft. Public visibility requires an explicit publish action.
      </p>
      <PublicOfferForm deals={deals} products={products} />
    </section>
  );
}
