import { CartView } from "@/components/storefront/cart-view";
import { getRequestDictionary } from "@/lib/i18n/server";

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
