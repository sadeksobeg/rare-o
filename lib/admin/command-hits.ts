export type AdminCommandHit = {
  href: string;
  title: string;
  subtitle: string;
  kind:
    | "page"
    | "product"
    | "retail"
    | "deal"
    | "wholesale"
    | "customer"
    | "trader"
    | "brokerage";
};

const PAGE_HREFS = [
  "/admin",
  "/admin/inbox",
  "/admin/requests",
  "/admin/deals",
  "/admin/wholesale",
  "/admin/brokerage",
  "/admin/products",
  "/admin/categories",
  "/admin/offers",
  "/admin/promos",
  "/admin/customers",
  "/admin/traders",
  "/admin/team",
  "/admin/settings/security",
] as const;

export function adminCommandPages(
  labels: Record<string, string>
): AdminCommandHit[] {
  return PAGE_HREFS.filter((href) => Boolean(labels[href])).map((href) => ({
    href,
    title: labels[href],
    subtitle: "",
    kind: "page" as const,
  }));
}
