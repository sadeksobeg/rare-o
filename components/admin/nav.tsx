"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { ChromeBadge } from "@/components/portal/chrome-badge";
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  Handshake,
  Package,
  Compass,
  Boxes,
  Tags,
  Percent,
  Users,
  Store,
  Megaphone,
  ShieldCheck,
  UsersRound,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideProps,
} from "lucide-react";
import { Emblem } from "@/components/brand";
import { PendingNavLink } from "@/components/ui/pending-nav-link";
import { cn } from "@/lib/utils";

const SIDEBAR_PREF_KEY = "ro-admin-sidebar-collapsed";

export type AdminNavItem = { href: string; label: string; badge?: number };
export type AdminNavGroup = { title: string; items: AdminNavItem[] };

type IconComp = ComponentType<LucideProps>;

const NAV_ICONS: Record<string, IconComp> = {
  "/admin": LayoutDashboard,
  "/admin/inbox": MessageSquare,
  "/admin/requests": ShoppingBag,
  "/admin/deals": Handshake,
  "/admin/wholesale": Package,
  "/admin/brokerage": Compass,
  "/admin/products": Boxes,
  "/admin/categories": Tags,
  "/admin/offers": Percent,
  "/admin/promos": Megaphone,
  "/admin/customers": Users,
  "/admin/traders": Store,
  "/admin/team": UsersRound,
  "/admin/settings/security": ShieldCheck,
};

function iconFor(href: string): IconComp {
  return NAV_ICONS[href] ?? LayoutDashboard;
}

function itemActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavList({
  groups,
  onNavigate,
  collapsed = false,
  surface = "sidebar",
}: {
  groups: AdminNavGroup[];
  onNavigate?: () => void;
  collapsed?: boolean;
  /** `sheet` = light/dark portal sheet (mobile drawer); `sidebar` = plum rail */
  surface?: "sidebar" | "sheet";
}) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [rail, setRail] = useState<{ top: number; height: number } | null>(
    null
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || collapsed) {
      setRail(null);
      return;
    }
    const activeEl = root.querySelector("[data-active='true']");
    if (!(activeEl instanceof HTMLElement)) {
      setRail(null);
      return;
    }
    const rootBox = root.getBoundingClientRect();
    const elBox = activeEl.getBoundingClientRect();
    setRail({
      top: elBox.top - rootBox.top,
      height: elBox.height,
    });
  }, [pathname, collapsed, groups]);

  return (
    <div
      ref={rootRef}
      className={cn("relative", collapsed ? "space-y-1" : "space-y-6")}
    >
      {!collapsed && rail ? (
        <span
          aria-hidden
          className="ro-nav-rail"
          style={{ top: rail.top + 6, height: Math.max(rail.height - 12, 8) }}
        />
      ) : null}
      {groups.map((group) => (
        <div key={group.title}>
          {!collapsed ? (
            <p
              className={cn(
                "px-3 text-[11px] font-bold",
                surface === "sheet"
                  ? "text-[color:var(--pilot-text-muted,var(--ro-text-muted))]"
                  : "text-[var(--ro-ink-200)]"
              )}
            >
              {group.title}
            </p>
          ) : null}
          <ul
            className={cn(
              !collapsed && "mt-2 space-y-0.5",
              collapsed && "space-y-1"
            )}
          >
            {group.items.map((item) => {
              const active = itemActive(pathname, item.href);
              const Icon = iconFor(item.href);
              return (
                <li key={item.href}>
                  <PendingNavLink
                    href={item.href}
                    onClick={onNavigate}
                    aria-label={item.label}
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                    data-active={active ? "true" : undefined}
                    className={cn(
                      "relative flex items-center transition-[color,background-color,transform,box-shadow] duration-[var(--ro-dur-fast)]",
                      "ro-portal-nav-link",
                      collapsed
                        ? "mx-auto size-10 justify-center rounded-[var(--ro-r-sm)]"
                        : "gap-2.5 rounded-[var(--ro-r-sm)] px-3 py-2.5 text-sm font-semibold",
                      active ? "font-bold" : null,
                      surface === "sheet"
                        ? active
                          ? "bg-[color-mix(in_srgb,var(--pilot-plum-700,var(--ro-plum-700))_12%,transparent)] text-[color:var(--pilot-plum-800,var(--ro-plum-800))]"
                          : "text-[color:var(--pilot-text-2,var(--ro-text-2))] hover:bg-[color-mix(in_srgb,var(--pilot-plum-700,var(--ro-plum-700))_8%,transparent)] hover:text-[color:var(--pilot-text,var(--ro-text))]"
                        : active
                          ? null
                          : "text-[var(--ro-ink-300)] hover:bg-white/8 hover:text-[var(--ro-sand-100)]",
                      collapsed &&
                        active &&
                        surface === "sidebar" &&
                        "bg-[color-mix(in_srgb,var(--ro-sand-100)_16%,transparent)] text-[var(--pilot-cream-50,var(--ro-sand-50))]"
                    )}
                  >
                    {active && !collapsed ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-transparent"
                      />
                    ) : null}
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-[var(--ro-dur-fast)]",
                        active && "scale-110"
                      )}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    {!collapsed ? (
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span className="truncate">{item.label}</span>
                        {item.badge && item.badge > 0 ? (
                          <ChromeBadge
                            value={item.badge}
                            className="inline-flex min-w-[1.15rem] shrink-0 items-center justify-center rounded-full bg-[var(--pilot-plum-300,var(--ro-plum-300))] px-1.5 text-[0.65rem] font-bold text-[var(--ro-ink-950)]"
                          />
                        ) : null}
                      </span>
                    ) : item.badge && item.badge > 0 ? (
                      <span className="absolute end-1 top-1 size-1.5 rounded-full bg-[var(--pilot-plum-300,var(--ro-plum-300))]" />
                    ) : null}
                  </PendingNavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function AdminSidebar({
  groups,
  brand,
  navLabel,
  collapseLabel,
  expandLabel,
}: {
  groups: AdminNavGroup[];
  brand: string;
  navLabel: string;
  collapseLabel: string;
  expandLabel: string;
}) {
  const pathname = usePathname();
  const inboxForce =
    pathname === "/admin/inbox" || pathname.startsWith("/admin/inbox/");
  /** Pref only after mount — keeps SSR HTML identical to first client paint. */
  const [prefCollapsed, setPrefCollapsed] = useState(false);
  const [prefReady, setPrefReady] = useState(false);

  useEffect(() => {
    try {
      setPrefCollapsed(window.localStorage.getItem(SIDEBAR_PREF_KEY) === "1");
    } catch {
      /* ignore */
    }
    setPrefReady(true);
  }, []);

  const collapsed = inboxForce || (prefReady && prefCollapsed);

  function toggleUserCollapse() {
    if (inboxForce) return;
    const next = !prefCollapsed;
    setPrefCollapsed(next);
    try {
      window.localStorage.setItem(SIDEBAR_PREF_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  return (
    <aside
      data-admin-sidebar={collapsed ? "collapsed" : "expanded"}
      className={cn(
        /* Height comes from .ro-portal-admin .ro-portal-sidebar CSS — avoid h-full hydration drift */
        "ro-portal-sidebar hidden shrink-0 flex-col text-[var(--ro-sand-100)] lg:flex",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div
        className={cn(
          "ro-portal-sidebar-brand flex items-center gap-3 py-5",
          collapsed ? "justify-center px-2" : "px-4"
        )}
        title={brand}
      >
        <Emblem variant="small" className="size-8" />
        {!collapsed ? (
          <span className="text-[0.7rem] font-semibold text-[var(--ro-sand-100)]">
            <bdi dir="ltr">RARE OUD</bdi>
          </span>
        ) : null}
      </div>
      <nav
        aria-label={navLabel}
        className={cn(
          "flex-1 overflow-y-auto py-4",
          collapsed ? "px-1" : "px-2"
        )}
      >
        <NavList groups={groups} collapsed={collapsed} />
      </nav>
      {!inboxForce ? (
        <div className={cn("border-t border-white/10 p-2", collapsed && "px-1")}>
          <button
            type="button"
            className="ro-icon-btn w-full min-h-11 justify-center gap-2"
            data-tone="on-dark"
            aria-label={collapsed ? expandLabel : collapseLabel}
            aria-pressed={collapsed}
            onClick={toggleUserCollapse}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" strokeWidth={1.5} aria-hidden />
            ) : (
              <PanelLeftClose className="size-4" strokeWidth={1.5} aria-hidden />
            )}
            {!collapsed ? (
              <span className="text-xs font-semibold">{collapseLabel}</span>
            ) : null}
          </button>
        </div>
      ) : null}
    </aside>
  );
}

