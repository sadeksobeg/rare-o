import Link from "next/link";
import { WholesaleRequestForm } from "@/components/trader/wholesale-request-form";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { listWholesaleEligibleProducts } from "@/lib/wholesale/service";

export default async function TraderWholesaleCatalogPage() {
  await requireTraderSession();
  const products = await listWholesaleEligibleProducts();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Wholesale ordering</h1>
          <p className="mt-2 max-w-2xl text-sm text-ro-muted">
            Request wholesale quantities from RARE OUD’s catalog. This is not a
            trader storefront and does not create deals or retail requests.
          </p>
        </div>
        <Link
          href="/trader/wholesale/requests"
          className="border border-ro-line px-4 py-2 text-sm"
        >
          My wholesale requests
        </Link>
      </div>
      <WholesaleRequestForm
        products={products.map((p) => ({
          id: p.id,
          slug: p.slug,
          nameEn: p.nameEn,
          nameAr: p.nameAr,
          currency: p.currency,
          retailPrice: Number(p.retailPrice),
        }))}
      />
    </section>
  );
}
