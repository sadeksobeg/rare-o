import Link from "next/link";
import { Package } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { TraderPageHeader } from "@/components/trader/page-header";
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
      <TraderPageHeader
        title={t.wsTitle}
        description={t.wsLead}
        icon={<Package className="size-5" strokeWidth={2} />}
        action={
          <Link
            href="/trader/wholesale/requests"
            className="rad-btn rad-gh rad-sm"
          >
            {t.wsMyRequests}
          </Link>
        }
      />
      <Reveal>
      <div className="rad-card p-4 sm:p-6">
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
            imagePath: p.images[0]?.path ?? null,
          }))}
        />
      </div>
      </Reveal>
    </section>
  );
}
