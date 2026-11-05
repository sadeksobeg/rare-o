import Link from "next/link";
import { LogOut, MessageSquare, UserRound } from "lucide-react";
import { adminLogoutAction } from "@/app/admin-logout-action";
import { AdminCommandSearchMount } from "@/components/admin/command-search-mount";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import { AdminMainEnter } from "@/components/admin/main-enter";
import {
  AdminMobileNav,
  AdminSidebar,
  type AdminNavGroup,
} from "@/components/admin/nav";
import { Emblem } from "@/components/brand";
import { ChromeBadge } from "@/components/portal/chrome-badge";
import {
  ChromeActionCluster,
  ChromeIconButton,
} from "@/components/portal/chrome-icon-button";
import { NotificationBell } from "@/components/portal/notification-bell";
import { PortalShellFrame } from "@/components/portal/portal-shell-frame";
import { PortalThemeToggle } from "@/components/portal/portal-theme";
import { OfflineBanner } from "@/components/system/offline-banner";
import { SonnerToaster } from "@/components/ui/sonner-toaster";
import { getAdminSessionChrome } from "@/lib/auth/admin-session";
import { isPromoFeaturesEnabled } from "@/lib/config/feature-flags";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { redirect } from "next/navigation";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await getAdminSessionChrome();
  if (!session) redirect("/admin/login");

  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const promoFeatures = isPromoFeaturesEnabled();
  const unreadInbox = await prisma.whatsAppConversation.count({
    where: { unreadCount: { gt: 0 } },
  });

  const groups: AdminNavGroup[] = [
    {
      title: dict.common.navOps,
      items: [
        { href: "/admin", label: a.dashboard },
        { href: "/admin/inbox", label: a.inbox, badge: unreadInbox },
        { href: "/admin/requests", label: a.requests },
        { href: "/admin/deals", label: a.deals },
        { href: "/admin/wholesale", label: a.wholesale },
        { href: "/admin/brokerage", label: a.brokerage },
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
        {
          href: "/admin/team",
          label: a.team,
        },
        {
          href: "/admin/notifications",
          label: dict.adminUi.notificationsTitle,
        },
        { href: "/admin/settings", label: dict.adminUi.settingsHubTitle },
      ],
    },
  ];

  const brand = `RARE OUD · ${a.dashboard}`;
  const commandLabels = {
    search: a.commandSearch,
    placeholder: a.commandPlaceholder,
    empty: a.commandEmpty,
    searching: a.commandSearching,
    close: dict.common.close,
    pages: {
      "/admin": a.dashboard,
      "/admin/inbox": a.inbox,
      "/admin/requests": a.requests,
      "/admin/deals": a.deals,
      "/admin/wholesale": a.wholesale,
      "/admin/brokerage": a.brokerage,
      "/admin/products": a.products,
      "/admin/categories": a.categories,
      "/admin/offers": a.offers,
      "/admin/promos": a.promos,
      "/admin/customers": a.customers,
      "/admin/traders": a.traders,
      "/admin/team":
        groups
          .flatMap((g) => g.items)
          .find((i) => i.href === "/admin/team")?.label ?? a.dashboard,
      "/admin/settings": dict.adminUi.settingsHubTitle,
      "/admin/settings/security": dict.adminUi.settingsSecurity,
      "/admin/notifications": dict.adminUi.notificationsTitle,
    },
  };

  return (
    <>
      <SonnerToaster />
      <PortalShellFrame
        surface="admin"
        className="ro-portal ro-portal-admin relative h-dvh max-h-dvh overflow-hidden"
      >
        <div className="ro-portal-atmosphere" aria-hidden />
        <div className="ro-portal-shell relative z-10">
          <AdminSidebar
            groups={groups}
            brand={brand}
            navLabel={dict.common.navLabelAdmin}
            collapseLabel={dict.common.menu}
            expandLabel={dict.common.close}
          />
          <div className="ro-portal-main-col">
            <OfflineBanner />
            <header className="ro-portal-header z-30 flex h-14 shrink-0 items-center gap-2 border-b border-[color:var(--border)] px-3 backdrop-blur-md sm:h-16 sm:gap-3 sm:px-4 lg:px-5">
              <div className="ro-portal-header-start">
                <AdminMobileNav
                  groups={groups}
                  menuLabel={dict.common.menu}
                  closeLabel={dict.common.close}
                  navLabel={dict.common.navLabelAdmin}
                />
                <Link
                  href="/admin"
                  className="flex shrink-0 items-center gap-2 lg:hidden"
                >
                  <Emblem variant="small" className="size-7" />
                  <span className="font-display text-sm font-bold text-[color:var(--text)]">
                    <bdi dir="ltr">RARE OUD</bdi>
                  </span>
                </Link>
                <div className="ro-portal-header-search">
                  <AdminCommandSearchMount labels={commandLabels} />
                </div>
              </div>
              <div className="ro-portal-header-actions flex shrink-0 items-center gap-1.5 sm:gap-2">
                <ChromeActionCluster>
                  <ChromeIconButton
                    href="/admin/inbox"
                    aria-label={a.inbox}
                    wrapGlyph={false}
                  >
                    <span className="ro-chrome-icon-glyph">
                      <MessageSquare
                        className="size-[1.05rem]"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </span>
                    <ChromeBadge
                      value={unreadInbox}
                      className="absolute end-0.5 top-0.5 flex min-w-[1.05rem] items-center justify-center rounded-full bg-[var(--ro-plum-900)] px-1 text-[0.6rem] font-bold text-[var(--ro-sand-50)]"
                    />
                  </ChromeIconButton>
                  <NotificationBell
                    chrome
                    ariaLabel={dict.adminUi.notificationsTitle}
                    unread={0}
                    items={[]}
                    viewAllHref="/admin/notifications"
                    viewAllLabel={a.viewAll}
                    emptyLabel={dict.adminUi.notificationsEmpty}
                  />
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
                  <ChromeIconButton
                    href="/admin/profile"
                    aria-label={dict.auth.profileTitle}
                  >
                    <UserRound
                      className="size-[1.05rem]"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <span className="sr-only">
                      <bdi dir="ltr">{session.email}</bdi>
                    </span>
                  </ChromeIconButton>
                  <form action={adminLogoutAction}>
                    <ChromeIconButton type="submit" aria-label={a.logout}>
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
              className="ro-portal-main-enter ro-portal-main"
            >
              <AdminMainEnter>{children}</AdminMainEnter>
            </main>
          </div>
        </div>
      </PortalShellFrame>
    </>
  );
}
