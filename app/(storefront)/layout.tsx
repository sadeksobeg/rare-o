import { DeferredBrandWallpaper } from "@/components/brand/deferred-wallpaper";
import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontProviders } from "@/components/storefront/providers";
import { OfflineBanner } from "@/components/system/offline-banner";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getDiscoveryProducts } from "@/lib/catalog/homepage";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, dict } = await getRequestDictionary();
  const discoveryProducts = await getDiscoveryProducts();

  return (
    <StorefrontProviders toastDismissLabel={dict.common.toastDismiss}>
      {/* No overflow-x-clip here: it forces y-clip and crops hero instruments */}
      <div className="relative flex min-h-screen flex-col bg-[var(--ro-sand-100)] text-ro-ink">
        <DeferredBrandWallpaper
          tone="cream"
          patternId="ro-sf-wallpaper"
          className="z-0 opacity-[0.85]"
        />
        <div className="relative z-10 flex min-h-screen flex-col">
          <OfflineBanner />
          <StorefrontHeader
            dict={dict}
            locale={locale}
            discoveryProducts={discoveryProducts}
          />
          <main
            id="main-content"
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 has-[[data-page=home]]:max-w-none has-[[data-page=home]]:px-0 has-[[data-page=home]]:py-0"
          >
            {children}
          </main>
          <StorefrontFooter dict={dict} locale={locale} />
        </div>
      </div>
    </StorefrontProviders>
  );
}
