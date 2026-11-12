import { redirect } from "next/navigation";
import { RadShellClient } from "@/components/admin/rad/shell-client";
import type { RadNavGroup } from "@/components/admin/rad/sidebar";
import { PortalThemeProvider } from "@/components/portal/portal-theme";
import { OfflineBanner } from "@/components/system/offline-banner";
import { SonnerToaster } from "@/components/ui/sonner-toaster";
import { getAdminSessionChrome } from "@/lib/auth/admin-session";
import { isPromoFeaturesEnabled } from "@/lib/config/feature-flags";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { countActiveBrokerage } from "@/lib/brokerage/service";
import { statusesAwaitingAdmin } from "@/lib/ui/status";
import {
  uiVisibleRetailRequestWhere,
} from "@/lib/admin/ui-hidden";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await getAdminSessionChrome();
  if (!session) redirect("/admin/login");

  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const ad2 = dict.ad2;
  const promoFeatures = isPromoFeaturesEnabled();

  const [unreadInbox, retailAwaiting, activeBrokerage, opsAlerts] =
    await Promise.all([
      prisma.whatsAppConversation.count({ where: { unreadCount: { gt: 0 } } }),
      prisma.retailRequest.count({
        where: {
          AND: [
            uiVisibleRetailRequestWhere(),
            { status: { in: statusesAwaitingAdmin("retail") } },
          ],
        },
      }),
      countActiveBrokerage(),
      import("@/lib/whatsapp/messaging/ops-alerts")
        .then((m) => m.listOpsAlertItems())
        .catch(() => []),
    ]);
  const opsUnread = opsAlerts.filter((o) => o.unread).length;

  const groups: RadNavGroup[] = [
    {
      title: dict.common.navOps,
      items: [
        { href: "/admin", label: a.dashboard },
        { href: "/admin/inbox", label: a.inbox, badge: unreadInbox },
        { href: "/admin/requests", label: a.requests, badge: retailAwaiting },
        { href: "/admin/deals", label: a.deals },
        { href: "/admin/wholesale", label: a.wholesale },
        { href: "/admin/brokerage", label: a.brokerage, badge: activeBrokerage },
      ],
    },
    {
      title: dict.common.navCatalog,
      items: [
        { href: "/admin/products", label: a.products },
        { href: "/admin/categories", label: a.categories },
        { href: "/admin/offers", label: a.offers },
        ...(promoFeatures ? [{ href: "/admin/promos", label: a.promos }] : []),
      ],
    },
    {
      title: dict.common.navPeople,
      items: [
        { href: "/admin/customers", label: a.customers },
        { href: "/admin/traders", label: a.traders },
        { href: "/admin/team", label: a.team },
      ],
    },
    {
      title: dict.common.navSystem,
      items: [
        { href: "/admin/shipping", label: a.shipping },
        { href: "/admin/notifications", label: dict.adminUi.notificationsTitle },
        { href: "/admin/settings", label: dict.adminUi.settingsHubTitle },
      ],
    },
  ];

  const pageLabels: Record<string, string> = {
    "/admin": a.dashboard,
    "/admin/inbox": a.inbox,
    "/admin/requests": a.requests,
    "/admin/deals": a.deals,
    "/admin/wholesale": a.wholesale,
    "/admin/brokerage": a.brokerage,
    "/admin/products": a.products,
    "/admin/categories": a.categories,
    "/admin/offers": a.offers,
    "/admin/customers": a.customers,
    "/admin/traders": a.traders,
    "/admin/team": a.team,
    "/admin/shipping": a.shipping,
    "/admin/settings": dict.adminUi.settingsHubTitle,
    "/admin/notifications": dict.adminUi.notificationsTitle,
  };

  const actions = [
    { href: "/admin/products/new", title: ad2.newProduct },
    { href: "/admin/offers/new", title: ad2.newOffer },
    { href: "/admin/traders", title: ad2.newTrader },
  ];

  return (
    <PortalThemeProvider defaultTheme="dark" dataPortal="admin" className="contents ro-portal">
      <SonnerToaster />
      <RadShellClient
        groups={groups}
        brand="RARE OUD"
        brandSub={dict.common.adminBrandSub}
        userName={session.name}
        userRole={ad2.userRole}
        navLabel={dict.common.navLabelAdmin}
        collapseLabel={ad2.collapseMenu}
        expandLabel={ad2.expandMenu}
        breadcrumbRoot={ad2.breadcrumbAdmin}
        pageTitle={a.dashboard}
        searchPlaceholder={ad2.searchPlaceholder}
        searchLabel={dict.admin.commandSearch}
        notificationsLabel={ad2.notifications}
        notificationsCount={opsUnread + (unreadInbox > 0 ? 1 : 0)}
        inboxLabel={a.inbox}
        inboxCount={unreadInbox}
        themeLabel={dict.common.themeLight}
        languageLabel={dict.common.language}
        locale={locale}
        menuLabel={ad2.menuLabel}
        paletteProps={{
          placeholder: ad2.paletteSearchPlaceholder,
          emptyTemplate: ad2.paletteEmpty,
          navGroupLabel: ad2.paletteNavGroup,
          actionsGroupLabel: ad2.paletteActionsGroup,
          navHint: ad2.paletteNav,
          openHint: ad2.paletteOpen,
          closeHint: ad2.paletteClose,
          pageLabels,
          actions,
        }}
        mobileTabLabels={{
          dashboard: a.dashboard,
          inbox: a.inbox,
          requests: a.requests,
          deals: a.deals,
          more: ad2.moreTab,
        }}
        mobileRequestsCount={retailAwaiting}
      >
        <OfflineBanner />
        {children}
      </RadShellClient>
    </PortalThemeProvider>
  );
}
