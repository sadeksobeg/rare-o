import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontProviders } from "@/components/storefront/providers";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, dict } = await getRequestDictionary();

  return (
    <StorefrontProviders>
      <div className="min-h-screen bg-ro-cream text-ro-black">
        <StorefrontHeader dict={dict} locale={locale} />
        <main
          id="main-content"
          className="mx-auto max-w-6xl px-4 py-10 has-[[data-page=home]]:max-w-none has-[[data-page=home]]:px-0 has-[[data-page=home]]:py-0"
        >
          {children}
        </main>
      </div>
    </StorefrontProviders>
  );
}
