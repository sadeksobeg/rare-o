import Link from "next/link";
import { adminLogoutAction } from "@/app/actions";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import {
  AdminMobileNav,
  AdminSidebar,
  type AdminNavGroup,
} from "@/components/admin/nav";
import { OfflineBanner } from "@/components/system/offline-banner";
import { AppToast } from "@/components/system/app-toast";
import { getAdminSession } from "@/lib/auth/admin-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { redirect } from "next/navigation";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;

  const groups: AdminNavGroup[] = [
    {
      title: dict.common.navOps,
      items: [
        { href: "/admin", label: a.dashboard },
        { href: "/admin/inbox", label: a.inbox },
        { href: "/admin/requests", label: a.requests },
        { href: "/admin/deals", label: a.deals },
        { href: "/admin/wholesale", label: a.wholesale },
      ],
    },
    {
      title: dict.common.navCatalog,
      items: [
        { href: "/admin/products", label: a.products },
        { href: "/admin/categories", label: a.categories },
        { href: "/admin/offers", label: a.offers },
        { href: "/admin/promos", label: a.promos },
      ],
    },
    {
      title: dict.common.navPeople,
      items: [
        { href: "/admin/customers", label: a.customers },
        { href: "/admin/traders", label: a.traders },
      ],
    },
  ];

  const brand = `RARE OUD · ${a.dashboard}`;

  return (
    <AppToast dismissLabel={dict.common.toastDismiss}>
      <div className="flex min-h-screen bg-ro-canvas text-ro-ink">
        <AdminSidebar groups={groups} brand={brand} />
        <div className="flex min-w-0 flex-1 flex-col">
          <OfflineBanner />
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-ro-line bg-ro-paper/95 px-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <AdminMobileNav
                groups={groups}
                menuLabel={dict.common.menu}
                closeLabel={dict.common.close}
              />
              <Link href="/admin" className="text-sm font-semibold lg:hidden">
                {brand}
              </Link>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <AdminLocaleToggle locale={locale} label={dict.common.language} />
              <span className="hidden text-ro-muted sm:inline">
                {session.email}
              </span>
              <form action={adminLogoutAction}>
                <button
                  type="submit"
                  className="rounded-[var(--ro-r-sm)] border border-ro-line px-3 py-1.5 text-xs"
                >
                  {a.logout}
                </button>
              </form>
            </div>
          </header>
          <main
            id="main-content"
            className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8"
          >
            {children}
          </main>
        </div>
      </div>
    </AppToast>
  );
}
