import { CartView } from "@/components/storefront/cart-view";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function CartPage() {
  const { dict } = await getRequestDictionary();
  return (
    <CartView
      title={dict.cart.title}
      empty={dict.cart.empty}
      continueLabel={dict.cart.continue}
      removeLabel={dict.cart.remove}
    />
  );
}
