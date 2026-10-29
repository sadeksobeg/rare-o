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
import { currentTrader } from "@/lib/fixtures";

const nav = [
  { href: "/trader", label: "الرئيسية", icon: Home },
  { href: "/trader/deals", label: "صفقاتي", icon: Handshake },
  { href: "/trader/wholesale", label: "الجملة", icon: Package },
  { href: "/trader/brokerage", label: "الوساطة", icon: Compass },
];

export function TraderTopbar() {
  const pathname = usePathname();
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
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="الإشعارات"
          className="relative inline-flex size-9 items-center justify-center rounded-md text-ro-ink-200 hover:bg-ro-sand-100/10 hover:text-ro-sand-100"
        >
          <Bell className="size-5" strokeWidth={1.5} />
          <span className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-ro-amber-500" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full" aria-label="قائمة الحساب">
              <Avatar>
                <AvatarFallback className="bg-ro-plum-300/20 text-ro-sand-100">
                  {currentTrader.avatarInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{currentTrader.name}</div>
              <div className="text-caption font-normal text-muted-foreground" dir="ltr">
                {currentTrader.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/trader/account">
                <User className="size-4" strokeWidth={1.5} /> حسابي
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">تسجيل الخروج</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
