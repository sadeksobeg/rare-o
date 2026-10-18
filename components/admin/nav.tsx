"use client";

import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  Handshake,
  Package,
  Boxes,
  Tags,
  Percent,
  Users,
  Store,
  Menu,
  X,
  type LucideProps,
} from "lucide-react";
import { Emblem } from "@/components/brand";
import { PendingNavLink } from "@/components/ui/pending-nav-link";
import { cn } from "@/lib/utils";

export type AdminNavItem = { href: string; label: string };
export type AdminNavGroup = { title: string; items: AdminNavItem[] };

type IconComp = ComponentType<LucideProps>;

const NAV_ICONS: Record<string, IconComp> = {
  "/admin": LayoutDashboard,
  "/admin/inbox": MessageSquare,
  "/admin/requests": ShoppingBag,
  "/admin/deals": Handshake,
  "/admin/wholesale": Package,
  "/admin/products": Boxes,
  "/admin/categories": Tags,
  "/admin/offers": Percent,
  "/admin/promos": Percent,
  "/admin/customers": Users,
  "/admin/traders": Store,
};

function iconFor(href: string): IconComp {
  return NAV_ICONS[href] ?? LayoutDashboard;
}

function itemActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  groups,
  onNavigate,
  collapsed = false,
}: {
  groups: AdminNavGroup[];
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  return (
    <div className={cn(collapsed ? "space-y-1" : "space-y-6")}>
      {groups.map((group) => (
        <div key={group.title}>
          {!collapsed ? (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ro-ink-300)]">
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
                      collapsed
                        ? "mx-auto size-10 justify-center rounded-[var(--ro-r-sm)]"
                        : "gap-2.5 rounded-[var(--ro-r-sm)] px-3 py-2 text-sm",
                      active
                        ? "font-semibold"
                        : "text-[var(--ro-ink-300)] hover:bg-white/8 hover:text-[var(--ro-sand-100)]",
                      collapsed &&
                        active &&
                        "bg-[color-mix(in_srgb,var(--ro-sand-100)_16%,transparent)] text-[var(--ro-sand-50)]"
                    )}
                  >
                    {active && !collapsed ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-[var(--ro-plum-300)] shadow-[0_0_12px_color-mix(in_srgb,var(--ro-plum-300)_55%,transparent)]"
                      />
                    ) : null}
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-[var(--ro-dur-fast)]",
                        active && "scale-110"
                      )}
                      strokeWidth={active ? 2 : 1.5}
                      aria-hidden
                    />
                    {!collapsed ? <span>{item.label}</span> : null}
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
}: {
  groups: AdminNavGroup[];
  brand: string;
}) {
  const pathname = usePathname();
  /** AD-03: sidebar auto-collapses to 72px on the inbox route. */
  const collapsed =
    pathname === "/admin/inbox" || pathname.startsWith("/admin/inbox/");

  return (
    <aside
      data-admin-sidebar={collapsed ? "collapsed" : "expanded"}
      className={cn(
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
          <span className="text-[0.7rem] font-semibold tracking-[0.2em] text-[var(--ro-ink-950)]">
            {brand}
          </span>
        ) : null}
      </div>
      <nav
        aria-label="Admin"
        className={cn(
          "flex-1 overflow-y-auto py-4",
          collapsed ? "px-1" : "px-2"
        )}
      >
        <NavList groups={groups} collapsed={collapsed} />
      </nav>
    </aside>
  );
}

export function AdminMobileNav({
  groups,
  menuLabel,
  closeLabel,
}: {
  groups: AdminNavGroup[];
  menuLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex size-10 items-center justify-center border border-ro-line bg-ro-paper/80"
        aria-label={menuLabel}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
          />
          <div className="ro-portal-sidebar relative z-10 flex h-full w-[min(18rem,85vw)] flex-col text-[var(--ro-sand-100)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <span className="text-xs tracking-[0.2em]">{menuLabel}</span>
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center"
                aria-label={closeLabel}
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-4">
              <NavList groups={groups} onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
