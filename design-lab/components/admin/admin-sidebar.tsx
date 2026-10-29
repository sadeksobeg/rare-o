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

const mainNav = [
  { href: "/admin", label: "لوحة التحكم", icon: Home },
  { href: "/admin/inbox", label: "صندوق واتساب", icon: Inbox },
  { href: "/admin/requests", label: "طلبات التجزئة", icon: ShoppingBag },
  { href: "/admin/deals", label: "الصفقات", icon: Handshake },
  { href: "/admin/wholesale", label: "الجملة", icon: Package },
  { href: "/admin/brokerage", label: "الوساطة", icon: Compass },
  { href: "/admin/products", label: "المنتجات", icon: Guitar },
];

const peopleNav = [
  { href: "/admin/traders", label: "التجّار", icon: Users },
  { href: "/admin/customers", label: "العملاء", icon: User },
  { href: "/admin/team", label: "الفريق", icon: ShieldCheck },
];

const systemNav = [
  { href: "/admin/audit-log", label: "سجلّ الأمان", icon: ShieldCheck },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

function NavGroup({ label, items, pathname }: { label: string; items: typeof mainNav; pathname: string }) {
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
                  <span>{item.label}</span>
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
  return (
    <Sidebar className="border-sidebar-border" collapsible="offcanvas" side="right">
      <SidebarHeader className="px-4 py-5">
        <Link href="/admin" className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-h3 font-semibold">
          <img src="/brand/logo-mark-small.svg" alt="" className="h-6 w-6 invert" />
          RARE OUD
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="العمليات" items={mainNav} pathname={pathname} />
        <NavGroup label="الأشخاص" items={peopleNav} pathname={pathname} />
        <NavGroup label="النظام" items={systemNav} pathname={pathname} />
      </SidebarContent>
    </Sidebar>
  );
}
