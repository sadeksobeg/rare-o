"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Handshake, Package, Compass, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocaleToggle } from "@/components/brand/locale-toggle";
import { currentTrader } from "@/lib/fixtures";
import { useLocale, useDict } from "@/lib/i18n";
import { navDict, topbarDict } from "@/lib/dictionaries";

const nav = [
  { href: "/trader", labelKey: "traderHome", icon: Home },
  { href: "/trader/deals", labelKey: "myDeals", icon: Handshake },
  { href: "/trader/wholesale", labelKey: "wholesale", icon: Package },
  { href: "/trader/brokerage", labelKey: "brokerage", icon: Compass },
] as const;

export function TraderTopbar() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const tNav = useDict(navDict);
  const tTop = useDict(topbarDict);
  const name = locale === "ar" ? currentTrader.name : currentTrader.nameEn;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-sidebar-border bg-ro-ink-950 px-6 py-3 text-ro-sand-100">
      <div className="flex items-center gap-8">
        <Link href="/trader" className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-h3 font-semibold">
          <img src="/brand/logo-mark-small.svg" alt="" className="h-5 w-5 invert" />
          RARE OUD
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-small transition-colors",
                  active ? "bg-ro-sand-100/10 text-ro-sand-50" : "text-ro-ink-300 hover:text-ro-sand-100"
                )}
              >
                <item.icon className="size-4" strokeWidth={1.5} />
                {tNav(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={tTop("notifications")}
          className="relative inline-flex size-9 items-center justify-center rounded-md text-ro-ink-200 hover:bg-ro-sand-100/10 hover:text-ro-sand-100"
        >
          <Bell className="size-5" strokeWidth={1.5} />
          <span className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-ro-amber-500" />
        </button>
        <LocaleToggle className="border-ro-sand-100/30 bg-transparent text-ro-sand-100 hover:bg-ro-sand-100/10" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full" aria-label={tTop("accountMenu")}>
              <Avatar>
                <AvatarFallback className="bg-ro-plum-300/20 text-ro-sand-100">
                  {name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{name}</div>
              <div className="text-caption font-normal text-muted-foreground" dir="ltr">
                {currentTrader.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/trader/account">
                <User className="size-4" strokeWidth={1.5} /> {tTop("myAccount")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">{tTop("signOut")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
