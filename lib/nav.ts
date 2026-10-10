import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/href";

export type NavItem = {
  key: string;
  href: string;
};

export function storefrontNav(locale: Locale): NavItem[] {
  return [
    { key: "catalog", href: href("/catalog", locale) },
    { key: "offers", href: href("/offers", locale) },
    { key: "story", href: href("/#story", locale) },
    { key: "traders", href: href("/trader/login", locale) },
  ];
}

export const adminNavGroups = [
  {
    key: "ops",
    items: [
      { key: "dashboard", href: "/admin" },
      { key: "inbox", href: "/admin/inbox" },
      { key: "requests", href: "/admin/requests" },
      { key: "deals", href: "/admin/deals" },
      { key: "wholesale", href: "/admin/wholesale" },
    ],
  },
  {
    key: "catalog",
    items: [
      { key: "products", href: "/admin/products" },
      { key: "categories", href: "/admin/categories" },
      { key: "offers", href: "/admin/offers" },
    ],
  },
  {
    key: "people",
    items: [
      { key: "customers", href: "/admin/customers" },
      { key: "traders", href: "/admin/traders" },
    ],
  },
] as const;

export const traderTabs = [
  { key: "home", href: "/trader" },
  { key: "deals", href: "/trader/deals" },
  { key: "wholesale", href: "/trader/wholesale" },
  { key: "offers", href: "/trader/offers" },
  { key: "profile", href: "/trader/profile" },
] as const;
