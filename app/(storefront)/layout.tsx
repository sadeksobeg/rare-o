import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontProviders } from "@/components/storefront/providers";
import { OfflineBanner } from "@/components/system/offline-banner";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, dict } = await getRequestDictionary();

  return (
    <StorefrontProviders toastDismissLabel={dict.common.toastDismiss}>
      <div className="flex min-h-screen flex-col bg-ro-cream text-ro-black">
        <OfflineBanner />
        <StorefrontHeader dict={dict} locale={locale} />
        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 has-[[data-page=home]]:max-w-none has-[[data-page=home]]:px-0 has-[[data-page=home]]:py-0"
        >
          {children}
        </main>
        <StorefrontFooter dict={dict} locale={locale} />
      </div>
    </StorefrontProviders>
  );
}
