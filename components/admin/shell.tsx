import { Suspense } from "react";
import Link from "next/link";
import { adminLogoutAction } from "@/app/actions";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import {
  AdminMobileNav,
  AdminSidebar,
  type AdminNavGroup,
} from "@/components/admin/nav";
import { BrandWallpaper, Emblem } from "@/components/brand";
import { PortalRouteProgress } from "@/components/portal/route-progress";
import { OfflineBanner } from "@/components/system/offline-banner";
import { AppToast } from "@/components/system/app-toast";
import { Button } from "@/components/ui/button";
import { getAdminSessionChrome } from "@/lib/auth/admin-session";
import { isPromoFeaturesEnabled } from "@/lib/config/feature-flags";
import { getRequestDictionary } from "@/lib/i18n/server";
import { redirect } from "next/navigation";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await getAdminSessionChrome();
  if (!session) redirect("/admin/login");

  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const promoFeatures = isPromoFeaturesEnabled();

  const groups: AdminNavGroup[] = [
    {
      title: dict.common.navOps,
      items: [
        { href: "/admin", label: a.dashboard },
        { href: "/admin/inbox", label: a.inbox },
        { href: "/admin/requests", label: a.requests },
        { href: "/admin/deals", label: a.deals },
        { href: "/admin/wholesale", label: a.wholesale },
      ],
    },
    {
      title: dict.common.navCatalog,
      items: [
        { href: "/admin/products", label: a.products },
        { href: "/admin/categories", label: a.categories },
        { href: "/admin/offers", label: a.offers },
        ...(promoFeatures
          ? [{ href: "/admin/promos", label: a.promos }]
          : []),
      ],
    },
    {
      title: dict.common.navPeople,
      items: [
        { href: "/admin/customers", label: a.customers },
        { href: "/admin/traders", label: a.traders },
      ],
    },
  ];

  const brand = `RARE OUD · ${a.dashboard}`;

  return (
    <AppToast dismissLabel={dict.common.toastDismiss}>
      <div className="ro-portal ro-portal-admin relative flex min-h-screen text-ro-ink">
        <BrandWallpaper
          tone="cream"
          patternId="ro-admin-wallpaper"
          className="z-0 opacity-[0.55]"
        />
        <div className="ro-portal-atmosphere" aria-hidden />
        <Suspense fallback={null}>
          <PortalRouteProgress />
        </Suspense>
        <div className="relative z-10 flex min-h-screen w-full">
          <AdminSidebar groups={groups} brand={brand} />
          <div className="flex min-w-0 flex-1 flex-col">
            <OfflineBanner />
            <header className="ro-portal-header sticky top-0 z-30 flex h-14 items-center justify-between gap-3 px-4">
              <div className="flex items-center gap-3">
                <AdminMobileNav
                  groups={groups}
                  menuLabel={dict.common.menu}
                  closeLabel={dict.common.close}
                />
                <Link
                  href="/admin"
                  className="flex items-center gap-2 lg:hidden"
                >
                  <Emblem variant="small" className="size-7" />
                  <span className="font-display text-sm font-semibold tracking-[0.14em] text-ro-ink">
                    {brand}
                  </span>
                </Link>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <AdminLocaleToggle
                  locale={locale}
                  label={dict.common.language}
                  tone="on-light"
                />
                <span className="hidden truncate text-ro-muted sm:inline">
                  {session.email}
                </span>
                <form action={adminLogoutAction}>
                  <Button type="submit" variant="secondary" size="sm">
                    {a.logout}
                  </Button>
                </form>
              </div>
            </header>
            <main
              id="main-content"
              className="ro-portal-main-enter mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 has-[[data-admin-inbox]]:max-w-none has-[[data-admin-inbox]]:px-3 has-[[data-admin-inbox]]:py-4 sm:px-6 lg:px-8"
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </AppToast>
  );
}
