import Link from "next/link";
import { adminLogoutAction } from "@/app/actions";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import { getAdminSession } from "@/lib/auth/admin-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { redirect } from "next/navigation";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { locale, dict } = await getRequestDictionary();

  const links = [
    { href: "/admin", label: dict.admin.dashboard },
    { href: "/admin/inbox", label: dict.admin.inbox },
    { href: "/admin/products", label: dict.admin.products },
    { href: "/admin/categories", label: dict.admin.categories },
    { href: "/admin/customers", label: dict.admin.customers },
    { href: "/admin/requests", label: dict.admin.requests },
    { href: "/admin/traders", label: "Traders" },
    { href: "/admin/deals", label: "Deals" },
    { href: "/admin/wholesale", label: "Wholesale" },
    { href: "/admin/offers", label: "Offers" },
  ];

  return (
    <div className="min-h-screen bg-ro-ivory text-ro-black">
      <header className="border-b border-ro-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/admin" className="tracking-[0.2em]">
              RARE OUD Admin
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm text-ro-muted">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-ro-black">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <AdminLocaleToggle locale={locale} label={dict.common.language} />
            <span className="text-ro-muted">{session.email}</span>
            <form action={adminLogoutAction}>
              <button type="submit" className="border border-ro-line px-3 py-1">
                {dict.admin.logout}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
