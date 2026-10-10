import { CartView } from "@/components/storefront/cart-view";
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
      title={dict.cart.title}
      empty={dict.cart.empty}
      continueLabel={dict.cart.continue}
      removeLabel={dict.cart.remove}
      catalogLabel={dict.nav.catalog}
    />
  );
}
