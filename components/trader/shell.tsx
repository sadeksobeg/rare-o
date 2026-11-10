import { Suspense } from "react";
import Link from "next/link";
import { Bell, LogOut, MessageCircle } from "lucide-react";
import { traderLogoutAction } from "@/app/deal-actions";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
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

  const initial = session.displayName.trim().slice(0, 1) || "ت";

  return (
    <>
      <SonnerToaster />
      <PortalShellFrame
        surface="trader"
        defaultTheme="dark"
        className="ro-portal ro-portal-trader rad-tapp relative min-h-dvh overflow-x-clip"
      >
        <Suspense fallback={null}>
          <PortalRouteProgressMount />
        </Suspense>
        <div className="relative z-10 flex min-h-dvh flex-col">
          <OfflineBanner />
          <header className="rad-th2">
            <Link
              href="/trader"
              className="rad-th2-logo"
              aria-label="RARE OUD"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/mark-small.webp"
                alt=""
                width={30}
                height={30}
                className="rad-th2-mark"
              />
              <b aria-hidden="true">
                <bdi dir="ltr">RARE OUD</bdi>
              </b>
            </Link>

            <TraderDesktopNav tabs={tabs} navLabel={dict.common.navLabelTrader} />

            <span className="rad-th2-sp" aria-hidden />

            <div className="rad-th2-tools">
              <Link
                href="/trader/messages"
                className="rad-ib"
                aria-label={dict.trader.messagesTitle}
              >
                <MessageCircle width={18} height={18} strokeWidth={1.5} aria-hidden />
                {unreadMessages > 0 ? (
                  <i className="rad-ib-dot">{unreadMessages > 99 ? "99+" : unreadMessages}</i>
                ) : null}
              </Link>
              <Link
                href="/trader/notifications"
                className="rad-ib"
                aria-label={dict.trader.notifications}
              >
                <Bell width={18} height={18} strokeWidth={1.5} aria-hidden />
                {unreadNotifications > 0 ? (
                  <i className="rad-ib-dot">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </i>
                ) : null}
              </Link>
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
              <Link href="/trader/profile" className="rad-tme" aria-label={dict.trader.profile}>
                <span className="rad-tme-av" aria-hidden>
                  {initial}
                </span>
                <span className="rad-tme-name">{session.displayName}</span>
              </Link>
              <form action={traderLogoutAction} className="contents">
                <button type="submit" className="rad-ib" aria-label={dict.trader.logout}>
                  <LogOut width={18} height={18} strokeWidth={1.5} aria-hidden />
                </button>
              </form>
            </div>
          </header>

          <main id="main-content" className="rad-tpage flex-1">
            {children}
          </main>

          <TraderBottomTabs tabs={tabs} navLabel={dict.common.navLabelTrader} />
        </div>
      </PortalShellFrame>
    </>
  );
}

export default TraderShell;
