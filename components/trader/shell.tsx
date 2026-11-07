import { Suspense } from "react";
import Link from "next/link";
import { Bell, LogOut, MessageCircle, UserRound } from "lucide-react";
import { traderLogoutAction } from "@/app/deal-actions";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import { Emblem } from "@/components/brand";
import { ChromeBadge } from "@/components/portal/chrome-badge";
import {
  ChromeActionCluster,
  ChromeIconButton,
} from "@/components/portal/chrome-icon-button";
import { PortalRouteProgressMount } from "@/components/portal/route-progress-mount";
import { PortalShellFrame } from "@/components/portal/portal-shell-frame";
import { PortalThemeToggle } from "@/components/portal/portal-theme";
import { OfflineBanner } from "@/components/system/offline-banner";
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
import { getTraderUnreadCount } from "@/lib/whatsapp/messaging/trader-channel";
import { redirect } from "next/navigation";

export async function TraderShell({ children }: { children: React.ReactNode }) {
  const session = await getTraderSession();
  if (!session) redirect("/trader/login");

  const { locale, dict } = await getRequestDictionary();
  const [unreadNotifications, waiting, unreadMessages] = await Promise.all([
    countUnreadTraderNotifications(session.sub),
    getTraderWaitingCounts(session.sub),
    getTraderUnreadCount(session.sub),
  ]);

  /** VISION program: 5 tabs — Home · Deals · Wholesale · Brokerage · Account */
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
      waiting: waiting.brokerage,
    },
    {
      href: "/trader/profile",
      label: dict.trader.profile,
      match: "prefix",
      icon: "profile",
    },
  ];

  return (
    <>
      <SonnerToaster />
      <PortalShellFrame
        surface="trader"
        defaultTheme="light"
        className="ro-portal ro-portal-trader relative min-h-dvh overflow-x-clip"
      >
        <div className="ro-portal-atmosphere" aria-hidden />
        <Suspense fallback={null}>
          <PortalRouteProgressMount />
        </Suspense>
        <div className="relative z-10 flex min-h-dvh flex-col">
          <OfflineBanner />
          <header className="ro-portal-header sticky top-0 z-30 border-b border-[color:var(--ro-border-subtle)] backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-3 sm:h-16 sm:px-5 lg:px-6">
              <Link
                href="/trader"
                className="group flex min-w-0 shrink-0 items-center gap-2.5"
              >
                <Emblem
                  variant="small"
                  className="size-8 transition-transform duration-[var(--ro-dur-fast)] group-hover:scale-105"
                />
                <span className="min-w-0 font-display text-sm font-bold text-[color:var(--ro-text)]">
                  <bdi dir="ltr">RARE OUD</bdi>
                  <span className="mt-0.5 block truncate text-[0.65rem] font-semibold text-[color:var(--ro-accent-fg,var(--ro-plum-800))]">
                    {dict.trader.brand}
                  </span>
                </span>
              </Link>

              <TraderDesktopNav
                tabs={tabs}
                tone="on-light"
                navLabel={dict.common.navLabelTrader}
              />

              <ChromeActionCluster className="shrink-0">
                <ChromeIconButton
                  href="/trader/messages"
                  aria-label={dict.trader.messagesTitle}
                  wrapGlyph={false}
                >
                  <span className="ro-chrome-icon-glyph">
                    <MessageCircle
                      className="size-[1.05rem]"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </span>
                  <ChromeBadge
                    value={unreadMessages}
                    className="absolute end-0.5 top-0.5 flex min-w-[1.05rem] items-center justify-center rounded-full bg-[var(--ro-plum-900)] px-1 text-[0.6rem] font-bold text-[var(--ro-sand-50)]"
                  />
                </ChromeIconButton>
                <ChromeIconButton
                  href="/trader/notifications"
                  aria-label={dict.trader.notifications}
                  wrapGlyph={false}
                >
                  <span className="ro-chrome-icon-glyph">
                    <Bell
                      className="size-[1.05rem]"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </span>
                  <ChromeBadge
                    value={unreadNotifications}
                    className="absolute end-0.5 top-0.5 flex min-w-[1.05rem] items-center justify-center rounded-full bg-[var(--ro-plum-900)] px-1 text-[0.6rem] font-bold text-[var(--ro-sand-50)]"
                  />
                </ChromeIconButton>
                <span className="hidden sm:contents">
                  <PortalThemeToggle
                    lightLabel={dict.common.themeLight}
                    darkLabel={dict.common.themeDark}
                    chrome
                  />
                  <AdminLocaleToggle
                    locale={locale}
                    label={dict.common.language}
                    tone="auto"
                    chrome
                  />
                </span>
                <ChromeIconButton
                  href="/trader/profile"
                  aria-label={dict.trader.profile}
                  className="hidden lg:inline-flex"
                >
                  <UserRound
                    className="size-[1.05rem]"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span className="sr-only">{session.displayName}</span>
                </ChromeIconButton>
                <form action={traderLogoutAction} className="contents">
                  <ChromeIconButton type="submit" aria-label={dict.trader.logout}>
                    <LogOut
                      className="size-[1.05rem]"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </ChromeIconButton>
                </form>
              </ChromeActionCluster>
            </div>
          </header>

          <main
            id="main-content"
            className="ro-portal-main-enter ro-trader-main mx-auto w-full max-w-[1200px] flex-1 px-4 py-5 sm:px-6 sm:py-6"
          >
            {children}
          </main>

          <TraderBottomTabs tabs={tabs} navLabel={dict.common.navLabelTrader} />
        </div>
      </PortalShellFrame>
    </>
  );
}

export default TraderShell;
