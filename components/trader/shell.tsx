import { Suspense } from "react";
import Link from "next/link";
import { Bell, LogOut, UserRound } from "lucide-react";
import { traderLogoutAction } from "@/app/deal-actions";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import { Emblem } from "@/components/brand";
import { ChromeBadge } from "@/components/portal/chrome-badge";
import { PortalRouteProgressMount } from "@/components/portal/route-progress-mount";
import { OfflineBanner } from "@/components/system/offline-banner";
import { AppToast } from "@/components/system/app-toast";
import { SonnerToaster } from "@/components/ui/sonner-toaster";
import {
  TraderBottomTabs,
  TraderDesktopNav,
  type TraderTab,
} from "@/components/trader/nav";
import { getTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { countUnreadTraderNotifications } from "@/lib/trader/notifications";
import { getTraderWaitingCounts } from "@/lib/trader/waiting-counts";
import { redirect } from "next/navigation";

export async function TraderShell({ children }: { children: React.ReactNode }) {
  const session = await getTraderSession();
  if (!session) redirect("/trader/login");

  const { locale, dict } = await getRequestDictionary();
  const [unreadNotifications, waiting] = await Promise.all([
    countUnreadTraderNotifications(session.sub),
    getTraderWaitingCounts(session.sub),
  ]);

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
      waiting: waiting.deals,
    },
    {
      href: "/trader/wholesale",
      label: dict.trader.wholesale,
      match: "prefix",
      icon: "wholesale",
      waiting: waiting.wholesale,
    },
    {
      href: "/trader/brokerage",
      label: dict.trader.brokerage,
      match: "prefix",
      icon: "brokerage",
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
      <SonnerToaster />
      <div className="ro-portal ro-portal-trader relative min-h-screen overflow-x-clip text-ro-ink">
        <div className="ro-portal-atmosphere" aria-hidden />
        <Suspense fallback={null}>
          <PortalRouteProgressMount />
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
                <span className="font-display text-sm font-bold tracking-[0.24em] text-[var(--ro-sand-50)]">
                  RARE OUD
                  <span className="mt-0.5 block text-[0.65rem] font-semibold tracking-[0.18em] text-[var(--ro-plum-300)]">
                    {dict.trader.brand}
                  </span>
                </span>
              </Link>
              <TraderDesktopNav tabs={tabs} tone="on-dark" />
              <div className="flex items-center gap-1.5 text-sm sm:gap-2.5">
                <Link
                  href="/trader/notifications"
                  className="ro-icon-btn relative size-10 min-h-0 px-0"
                  data-tone="on-dark"
                  aria-label={dict.trader.notifications}
                >
                  <Bell className="size-5" strokeWidth={1.5} aria-hidden />
                  <ChromeBadge
                    value={unreadNotifications}
                    className="absolute end-1 top-1 flex min-w-[1.1rem] items-center justify-center rounded-full bg-[var(--ro-plum-300)] px-1 text-[0.65rem] font-bold text-[var(--ro-ink-950)]"
                  />
                </Link>
                <AdminLocaleToggle
                  locale={locale}
                  label={dict.common.language}
                  tone="on-dark"
                />
                <span className="hidden max-w-[9rem] items-center gap-1.5 truncate font-semibold text-[color-mix(in_srgb,var(--ro-sand-100)_78%,transparent)] lg:inline-flex">
                  <UserRound className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  {session.displayName}
                </span>
                <form action={traderLogoutAction}>
                  <button
                    type="submit"
                    className="ro-icon-btn"
                    data-tone="on-dark"
                    aria-label={dict.trader.logout}
                  >
                    <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
                    <span className="hidden sm:inline">{dict.trader.logout}</span>
                  </button>
                </form>
              </div>
            </div>
          </header>
          <main
            id="main-content"
            className="ro-portal-main-enter mx-auto max-w-[1180px] px-4 py-6 pb-28 sm:px-6 md:pb-10"
          >
            {children}
          </main>
          <TraderBottomTabs tabs={tabs} />
        </div>
      </div>
    </AppToast>
  );
}

export default TraderShell;
