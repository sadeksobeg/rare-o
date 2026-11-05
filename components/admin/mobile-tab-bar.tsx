"use client";

import { usePathname } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  Menu,
  MessageSquare,
  ShoppingBag,
} from "lucide-react";
import { PendingNavLink } from "@/components/ui/pending-nav-link";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", match: "exact" as const, icon: LayoutDashboard, key: "home" },
  {
    href: "/admin/inbox",
    match: "prefix" as const,
    icon: MessageSquare,
    key: "inbox",
  },
  {
    href: "/admin/requests",
    match: "prefix" as const,
    icon: ShoppingBag,
    key: "requests",
  },
  {
    href: "/admin/products",
    match: "prefix" as const,
    icon: Boxes,
    key: "products",
  },
] as const;

function active(pathname: string, href: string, match: "exact" | "prefix") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** iOS/Android-style primary rail — opens full drawer via `onMore`. */
export function AdminMobileTabBar({
  labels,
  inboxBadge = 0,
  moreLabel,
  onMore,
}: {
  labels: {
    home: string;
    inbox: string;
    requests: string;
    products: string;
  };
  inboxBadge?: number;
  moreLabel: string;
  onMore: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={moreLabel}
      className="ro-admin-mobile-tabs lg:hidden"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isOn = active(pathname, tab.href, tab.match);
        const label =
          tab.key === "home"
            ? labels.home
            : tab.key === "inbox"
              ? labels.inbox
              : tab.key === "requests"
                ? labels.requests
                : labels.products;
        return (
          <PendingNavLink
            key={tab.href}
            href={tab.href}
            className={cn(
              "ro-admin-mobile-tab",
              isOn && "ro-admin-mobile-tab--active"
            )}
            aria-current={isOn ? "page" : undefined}
          >
            <span className="relative inline-flex">
              <Icon className="size-5" strokeWidth={isOn ? 2 : 1.5} aria-hidden />
              {tab.key === "inbox" && inboxBadge > 0 ? (
                <span className="absolute -end-1.5 -top-1 flex min-w-[1rem] items-center justify-center rounded-full bg-[var(--ro-plum-700)] px-1 text-[0.58rem] font-bold leading-none text-white">
                  {inboxBadge > 99 ? "99+" : inboxBadge}
                </span>
              ) : null}
            </span>
            <span className="truncate">{label}</span>
          </PendingNavLink>
        );
      })}
      <button
        type="button"
        className="ro-admin-mobile-tab"
        aria-label={moreLabel}
        onClick={onMore}
      >
        <Menu className="size-5" strokeWidth={1.5} aria-hidden />
        <span className="truncate">{moreLabel}</span>
      </button>
    </nav>
  );
}
