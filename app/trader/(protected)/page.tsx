import Link from "next/link";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { listDealsForTrader } from "@/lib/deals/service";

export default async function TraderHomePage() {
  const session = await requireTraderSession();
  const deals = await listDealsForTrader(session.sub);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl">Welcome, {session.displayName}</h1>
      <p className="max-w-2xl text-sm text-ro-muted">
        Negotiate commercial deals and submit wholesale requests with RARE OUD.
        This portal shows only your own records — not a storefront.
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/trader/deals/new"
          className="bg-ro-purple px-4 py-2 text-ro-ivory"
        >
          Propose a deal
        </Link>
        <Link href="/trader/deals" className="border border-ro-line px-4 py-2">
          View my deals ({deals.length})
        </Link>
        <Link
          href="/trader/wholesale"
          className="border border-ro-line px-4 py-2"
        >
          Wholesale ordering
        </Link>
        <Link href="/trader/offers" className="border border-ro-line px-4 py-2">
          Public curated offers
        </Link>
      </div>
    </section>
  );
}
