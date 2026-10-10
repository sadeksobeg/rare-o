"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminNavItem = { href: string; label: string };
export type AdminNavGroup = { title: string; items: AdminNavItem[] };

function itemActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  groups,
  onNavigate,
}: {
  groups: AdminNavGroup[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ro-muted">
            {group.title}
          </p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const active = itemActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "relative flex items-center px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-white/5 font-semibold text-[var(--ro-sand-100)]"
                        : "text-[var(--ro-ink-300)] hover:bg-white/5 hover:text-[var(--ro-sand-100)]"
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-1 start-0 w-0.5 bg-[var(--ro-sand-100)]"
                      />
                    ) : null}
                    {item.label}
                  </Link>
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
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-[var(--ro-ink-900)] text-[var(--ro-sand-100)] lg:flex">
      <div className="border-b border-white/10 px-4 py-5 tracking-[0.2em] text-xs font-semibold">
        {brand}
      </div>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-2 py-4">
        <NavList groups={groups} />
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
        className="inline-flex size-10 items-center justify-center border border-ro-line"
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
          <div className="relative z-10 flex h-full w-[min(18rem,85vw)] flex-col bg-[var(--ro-ink-900)] text-[var(--ro-sand-100)]">
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
