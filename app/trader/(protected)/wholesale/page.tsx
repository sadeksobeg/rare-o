import Link from "next/link";
import { WholesaleRequestForm } from "@/components/trader/wholesale-request-form";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { listWholesaleEligibleProducts } from "@/lib/wholesale/service";

export default async function TraderWholesaleCatalogPage() {
  await requireTraderSession();
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;
  const products = await listWholesaleEligibleProducts();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t.wsTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ro-muted">{t.wsLead}</p>
        </div>
        <Link
          href="/trader/wholesale/requests"
          className="inline-flex min-h-11 items-center border border-ro-line px-4 text-sm"
        >
          {t.wsMyRequests}
        </Link>
      </div>
      <WholesaleRequestForm
        labels={t}
        locale={locale}
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
