"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Inbox,
  ShoppingBag,
  Handshake,
  Package,
  Compass,
  Guitar,
  Users,
  User,
  Settings,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLocale, useDict } from "@/lib/i18n";
import { navDict } from "@/lib/dictionaries";

const mainNav = [
  { href: "/admin", labelKey: "home", icon: Home },
  { href: "/admin/inbox", labelKey: "inbox", icon: Inbox },
  { href: "/admin/requests", labelKey: "retailRequests", icon: ShoppingBag },
  { href: "/admin/deals", labelKey: "deals", icon: Handshake },
  { href: "/admin/wholesale", labelKey: "wholesale", icon: Package },
  { href: "/admin/brokerage", labelKey: "brokerage", icon: Compass },
  { href: "/admin/products", labelKey: "products", icon: Guitar },
] as const;

const peopleNav = [
  { href: "/admin/traders", labelKey: "traders", icon: Users },
  { href: "/admin/customers", labelKey: "customers", icon: User },
  { href: "/admin/team", labelKey: "team", icon: ShieldCheck },
] as const;

const systemNav = [
  { href: "/admin/audit-log", labelKey: "auditLog", icon: ShieldCheck },
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
] as const;

function NavGroup({
  label,
  items,
  pathname,
  t,
}: {
  label: string;
  items: readonly { href: string; labelKey: keyof typeof navDict; icon: typeof Home }[];
  pathname: string;
  t: (key: keyof typeof navDict) => string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href}>
                  <item.icon className="size-5" strokeWidth={1.5} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const t = useDict(navDict);
  return (
    <Sidebar className="border-sidebar-border" collapsible="offcanvas" side={locale === "ar" ? "right" : "left"}>
      <SidebarHeader className="px-4 py-5">
        <Link href="/admin" className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-h3 font-semibold">
          <img src="/brand/logo-mark-small.svg" alt="" className="h-6 w-6 invert" />
          RARE OUD
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label={t("operationsGroup")} items={mainNav} pathname={pathname} t={t} />
        <NavGroup label={t("peopleGroup")} items={peopleNav} pathname={pathname} t={t} />
        <NavGroup label={t("systemGroup")} items={systemNav} pathname={pathname} t={t} />
      </SidebarContent>
    </Sidebar>
  );
}
