"use client";

import {
  useEffect,
  useLayoutEffect,
  useState,
  type ComponentType,
} from "react";
import {
  BadgePercent,
  BellRing,
  Compass,
  Guitar,
  Handshake,
  LayoutDashboard,
  MessageSquareText,
  Package,
  PanelRightClose,
  Settings,
  ShoppingBag,
  Store,
  Tags,
  UserCog,
  Users,
  type LucideProps,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { PendingNavLink } from "@/components/ui/pending-nav-link";
import { cn } from "@/lib/utils";

export type RadNavItem = { href: string; label: string; badge?: number };
export type RadNavGroup = { title: string; items: RadNavItem[] };

type IconComp = ComponentType<LucideProps>;

const NAV_ICONS: Record<string, IconComp> = {
  "/admin": LayoutDashboard,
  "/admin/inbox": MessageSquareText,
  "/admin/requests": ShoppingBag,
  "/admin/deals": Handshake,
  "/admin/wholesale": Package,
  "/admin/brokerage": Compass,
  "/admin/products": Guitar,
  "/admin/categories": Tags,
  "/admin/offers": BadgePercent,
  "/admin/customers": Users,
  "/admin/traders": Store,
  "/admin/team": UserCog,
  "/admin/notifications": BellRing,
  "/admin/settings": Settings,
};

function itemActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const COLLAPSE_KEY = "rad-sidebar-collapsed";

export function RadSidebar({
  groups,
  brand,
  brandSub,
  userName,
  userRole,
  collapseLabel,
  expandLabel,
  navLabel,
  collapsed,
  onCollapsedChange,
  mobileOpen = false,
}: {
  groups: RadNavGroup[];
  brand: string;
  brandSub: string;
  userName: string;
  userRole: string;
  collapseLabel: string;
  expandLabel: string;
  navLabel: string;
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
  mobileOpen?: boolean;
}) {
  const pathname = usePathname();
  const initial = userName.trim().slice(0, 1) || "?";

  return (
    <aside
      className="rad-side"
      data-mobile-open={mobileOpen ? "true" : undefined}
    >
      <div className="rad-brand">
        {/* Cream mark — visible on the dark sidebar (reference logo_cream.png) */}
        <img
          src="/brand/mark-small.webp"
          alt=""
          width={32}
          height={32}
          className="rad-brand-mark"
          decoding="async"
          fetchPriority="high"
        />
        <div>
          <b>
            <bdi dir="ltr">{brand}</bdi>
          </b>
          <small>{brandSub}</small>
        </div>
      </div>
      <nav className="rad-scroll" aria-label={navLabel}>
        {groups.map((group) => (
          <div key={group.title}>
            <div className="rad-ngl">{group.title}</div>
            {group.items.map((item) => {
              const active = itemActive(pathname, item.href);
              const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
              return (
                <PendingNavLink
                  key={item.href}
                  href={item.href}
                  className={cn("rad-ni", active && "rad-on")}
                  data-tip={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="rad-ic" width={18} height={18} strokeWidth={1.5} aria-hidden />
                  <span className="rad-nl">{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="rad-nb rad-num">{item.badge}</span>
                  ) : null}
                </PendingNavLink>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="rad-side-foot">
        <a href="/admin/profile" className="rad-me">
          <span className="rad-av" aria-hidden>
            {initial}
          </span>
          <span className="rad-sp">
            <b>{userName}</b>
            <span>{userRole}</span>
          </span>
        </a>
        <button
          type="button"
          className="rad-colbtn"
          aria-label={collapsed ? expandLabel : collapseLabel}
          aria-pressed={collapsed}
          onClick={() => onCollapsedChange(!collapsed)}
        >
          <PanelRightClose
            className="rad-ic"
            width={18}
            height={18}
            strokeWidth={1.5}
            aria-hidden
            style={{ transform: collapsed ? "scaleX(-1)" : undefined }}
          />
          <span>{collapseLabel}</span>
        </button>
      </div>
    </aside>
  );
}

/** Persists the collapsed preference client-side; SSR always renders expanded. */
export function useRadSidebarCollapsed(): [boolean, (next: boolean) => void] {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);
  const set = (next: boolean) => {
    setCollapsed(next);
    try {
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };
  return [ready ? collapsed : false, set];
}

/** Positions a segmented control's sliding indicator under its active button. */
export function useSegmentIndicator(
  containerRef: React.RefObject<HTMLDivElement | null>,
  activeKey: string
) {
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const on = root.querySelector<HTMLElement>("button[data-on='true']");
    const ind = root.querySelector<HTMLElement>(".rad-ind");
    if (!on || !ind) return;
    ind.style.width = `${on.offsetWidth}px`;
    ind.style.transform = `translateX(${on.offsetLeft}px)`;
  }, [containerRef, activeKey]);
}

export function RadSegmentIndicator() {
  return <span className="rad-ind" aria-hidden />;
}
