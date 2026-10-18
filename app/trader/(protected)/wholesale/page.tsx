import { TraderPageHeader } from "@/components/trader/page-header";
import { WholesaleRequestForm } from "@/components/trader/wholesale-request-form";
import { ButtonLink } from "@/components/ui/button";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { listWholesaleEligibleProducts } from "@/lib/wholesale/service";

export default async function TraderWholesaleCatalogPage() {
  await requireTraderSession();
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;
  const products = await listWholesaleEligibleProducts();

  return (
    <section className="space-y-6 p-5 sm:p-8 md:p-10">
      <TraderPageHeader
        title={t.wsTitle}
        description={t.wsLead}
        action={
          <ButtonLink
            href="/trader/wholesale/requests"
            variant="secondary"
            size="sm"
          >
            {t.wsMyRequests}
          </ButtonLink>
        }
      />
      <div className="ro-portal-card border p-4 sm:p-6">
        <WholesaleRequestForm
          labels={t}
          locale={locale}
          products={products.map((p) => ({
            id: p.id,
            slug: p.slug,
            nameEn: p.nameEn,
            nameAr: p.nameAr,
            currency: p.currency ?? "",
            retailPrice:
              p.retailPrice != null ? Number(p.retailPrice) : undefined,
            categorySlug: p.category?.slug ?? null,
            categoryNameEn: p.category?.nameEn ?? null,
            categoryNameAr: p.category?.nameAr ?? null,
          }))}
        />
      </div>
    </section>
  );
}
