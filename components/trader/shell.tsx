import { Suspense } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { traderLogoutAction } from "@/app/deal-actions";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import { BrandWallpaper, Emblem } from "@/components/brand";
import { PortalRouteProgress } from "@/components/portal/route-progress";
import { OfflineBanner } from "@/components/system/offline-banner";
import { AppToast } from "@/components/system/app-toast";
import { Button } from "@/components/ui/button";
import {
  TraderBottomTabs,
  TraderDesktopNav,
  type TraderTab,
} from "@/components/trader/nav";
import { getTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { countUnreadTraderNotifications } from "@/lib/trader/notifications";
import { redirect } from "next/navigation";

export async function TraderShell({ children }: { children: React.ReactNode }) {
  const session = await getTraderSession();
  if (!session) redirect("/trader/login");

  const { locale, dict } = await getRequestDictionary();
  const unreadNotifications = await countUnreadTraderNotifications(session.sub);

  const tabs: TraderTab[] = [
    {
      href: "/trader",
      label: dict.trader.overview,
      match: "exact",
      icon: "home",
    },
    {
      href: "/trader/deals",
      label: dict.trader.deals,
      match: "prefix",
      icon: "deals",
    },
    {
      href: "/trader/wholesale",
      label: dict.trader.wholesale,
      match: "prefix",
      icon: "wholesale",
    },
    {
      href: "/trader/offers",
      label: dict.trader.offers,
      match: "prefix",
      icon: "offers",
    },
    {
      href: "/trader/profile",
      label: dict.trader.profile,
      match: "prefix",
      icon: "profile",
    },
  ];

  return (
    <AppToast dismissLabel={dict.common.toastDismiss}>
      <div className="ro-portal ro-portal-trader relative min-h-screen overflow-x-clip text-ro-ink">
        <BrandWallpaper
          tone="cream"
          patternId="ro-trader-wallpaper"
          className="z-0 opacity-[0.72]"
        />
        <div className="ro-portal-atmosphere" aria-hidden />
        <Suspense fallback={null}>
          <PortalRouteProgress />
        </Suspense>
        <div className="relative z-10">
          <OfflineBanner />
          <header className="sticky top-0 z-30 border-b border-[color-mix(in_srgb,var(--ro-sand-100)_12%,transparent)] bg-[linear-gradient(105deg,var(--ro-plum-900)_0%,var(--ro-ink-950)_58%,var(--ro-ink-900)_100%)] text-[var(--ro-sand-100)] shadow-[0_16px_40px_-28px_rgba(11,8,13,0.45)]">
            <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6">
              <Link
                href="/trader"
                className="group flex items-center gap-3 transition-opacity hover:opacity-95"
              >
                <Emblem
                  variant="small"
                  className="size-8 brightness-110 transition-transform duration-[var(--ro-dur-fast)] group-hover:scale-105"
                />
                <span className="font-display text-sm font-semibold tracking-[0.24em] text-[var(--ro-sand-50)]">
                  RARE OUD
                  <span className="mt-0.5 block text-[0.65rem] tracking-[0.18em] text-[var(--ro-plum-300)]">
                    {dict.trader.brand}
                  </span>
                </span>
              </Link>
              <TraderDesktopNav tabs={tabs} tone="on-dark" />
              <div className="flex items-center gap-2.5 text-sm">
                <Link
                  href="/trader/notifications"
                  className="relative inline-flex size-10 items-center justify-center rounded-[var(--ro-r-sm)] text-[var(--ro-sand-100)] transition-colors hover:bg-[color-mix(in_srgb,var(--ro-sand-100)_12%,transparent)]"
                  aria-label={dict.trader.notifications}
                >
                  <Bell className="size-5" strokeWidth={1.75} aria-hidden />
                  {unreadNotifications > 0 ? (
                    <span className="absolute end-1.5 top-1.5 flex min-w-[1.1rem] items-center justify-center rounded-full bg-[var(--ro-plum-300)] px-1 text-[0.65rem] font-bold text-[var(--ro-ink-950)]">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  ) : null}
                </Link>
                <AdminLocaleToggle
                  locale={locale}
                  label={dict.common.language}
                  tone="on-dark"
                />
                <span className="hidden max-w-[9rem] truncate text-[color-mix(in_srgb,var(--ro-sand-100)_70%,transparent)] lg:inline">
                  {session.displayName}
                </span>
                <form action={traderLogoutAction}>
                  <Button type="submit" variant="inverse-secondary" size="sm">
                    {dict.trader.logout}
                  </Button>
                </form>
              </div>
            </div>
          </header>
          <main
            id="main-content"
            className="ro-portal-main-enter mx-auto max-w-[1180px] px-4 py-6 pb-28 sm:px-6 md:pb-12"
          >
            {children}
          </main>
          <TraderBottomTabs tabs={tabs} />
        </div>
      </div>
    </AppToast>
  );
}
