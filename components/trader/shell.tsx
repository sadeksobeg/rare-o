import Link from "next/link";
import { traderLogoutAction } from "@/app/deal-actions";
import { getTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { redirect } from "next/navigation";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";

export async function TraderShell({ children }: { children: React.ReactNode }) {
  const session = await getTraderSession();
  if (!session) redirect("/trader/login");

  const { locale, dict } = await getRequestDictionary();

  const links = [
    { href: "/trader", label: dict.trader.overview },
    { href: "/trader/deals", label: dict.trader.deals },
    { href: "/trader/deals/new", label: dict.trader.newDeal },
    { href: "/trader/wholesale", label: dict.trader.wholesale },
    { href: "/trader/wholesale/requests", label: dict.trader.wholesaleRequests },
    { href: "/trader/offers", label: dict.trader.offers },
    { href: "/trader/profile", label: dict.trader.profile },
  ];

  return (
    <div className="min-h-screen bg-ro-canvas text-ro-ink">
      <header className="border-b border-ro-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/trader" className="tracking-[0.18em]">
              RARE OUD · {dict.trader.brand}
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm text-ro-muted">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-ro-ink">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <AdminLocaleToggle locale={locale} label={dict.common.language} />
            <span className="text-ro-muted">{session.displayName}</span>
            <form action={traderLogoutAction}>
              <button
                type="submit"
                className="rounded-[var(--ro-r-sm)] border border-ro-border px-3 py-1"
              >
                {dict.trader.logout}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
