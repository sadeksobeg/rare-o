import { NewDealForm } from "@/components/trader/new-deal-form";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { prisma } from "@/lib/db/prisma";

export default async function NewTraderDealPage() {
  await requireTraderSession();
  const products = await prisma.product.findMany({
    where: { status: "published" },
    orderBy: { nameEn: "asc" },
    select: { id: true, nameEn: true, nameAr: true, slug: true },
  });

  return (
    <section className="space-y-6">
      <h1 className="text-3xl">Propose a deal</h1>
      <p className="max-w-xl text-sm text-ro-muted">
        Catalog deals reference an existing RARE OUD product. Non-catalog
        opportunities stay outside the catalog until an admin later chooses
        otherwise — never automatic.
      </p>
      <NewDealForm products={products} />
    </section>
  );
}
