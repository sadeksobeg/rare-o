import { CartView } from "@/components/storefront/cart-view";
import { HandoffExplainer } from "@/components/storefront/handoff-explainer";
import type { Metadata } from "next";
import { getRequestDictionary } from "@/lib/i18n/server";
import { storefrontMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getRequestDictionary();
  return storefrontMetadata({
    locale,
    title: `${dict.cart.title} — ${dict.brand}`,
    description: dict.cart.empty,
    path: "/cart",
    noIndex: true,
  });
}

export default async function CartPage() {
  const { locale, dict } = await getRequestDictionary();
  return (
    <CartView
      locale={locale}
      handoff={<HandoffExplainer dict={dict} compact />}
      labels={{
        title: dict.cart.title,
        emptyTitle: dict.cart.emptyTitle,
        emptyBody: dict.cart.emptyBody,
        catalog: dict.nav.catalog,
        continue: dict.cart.continue,
        remove: dict.cart.remove,
        listLabel: dict.cart.listLabel,
        itemsCount: dict.cart.itemsCount,
        qtyLabel: dict.cart.qtyLabel,
        removeAria: dict.cart.removeAria,
        increase: dict.cart.increase,
        decrease: dict.cart.decrease,
        unitPrice: dict.cart.unitPrice,
        lineTotal: dict.cart.lineTotal,
        summaryTitle: dict.cart.summaryTitle,
        summaryTotal: dict.cart.summaryTotal,
        summaryNote: dict.cart.summaryNote,
        priceOnRequest: dict.product.priceOnRequest,
        photoCaption: dict.catalog.photoCaption,
      }}
    />
  );
}
