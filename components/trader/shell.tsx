import Link from "next/link";
import { traderLogoutAction } from "@/app/deal-actions";
import { getTraderSession } from "@/lib/auth/trader-session";
import { redirect } from "next/navigation";

export async function TraderShell({ children }: { children: React.ReactNode }) {
  const session = await getTraderSession();
  if (!session) redirect("/trader/login");

  const links = [
    { href: "/trader", label: "Overview" },
    { href: "/trader/deals", label: "My deals" },
    { href: "/trader/deals/new", label: "Propose deal" },
    { href: "/trader/wholesale", label: "Wholesale" },
    { href: "/trader/wholesale/requests", label: "Wholesale requests" },
    { href: "/trader/offers", label: "Public offers" },
    { href: "/trader/profile", label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-ro-ivory text-ro-black">
      <header className="border-b border-ro-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/trader" className="tracking-[0.18em]">
              RARE OUD Trader
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
            <span className="text-ro-muted">{session.displayName}</span>
            <form action={traderLogoutAction}>
              <button type="submit" className="border border-ro-line px-3 py-1">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
