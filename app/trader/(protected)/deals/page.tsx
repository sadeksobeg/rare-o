import Link from "next/link";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { listDealsForTrader } from "@/lib/deals/service";

export default async function TraderDealsPage() {
  const session = await requireTraderSession();
  const deals = await listDealsForTrader(session.sub);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl">My deal proposals</h1>
        <Link
          href="/trader/deals/new"
          className="bg-ro-purple px-4 py-2 text-sm text-ro-ivory"
        >
          Propose deal
        </Link>
      </div>
      <div className="overflow-x-auto border border-ro-line">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ro-line bg-ro-surface">
            <tr>
              <th className="p-3">Reference</th>
              <th className="p-3">Title</th>
              <th className="p-3">Kind</th>
              <th className="p-3">Status</th>
              <th className="p-3">Entries</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td className="p-4 text-ro-muted" colSpan={6}>
                  No proposals yet.
                </td>
              </tr>
            ) : (
              deals.map((d) => (
                <tr key={d.id} className="border-b border-ro-line">
                  <td className="p-3">{d.reference}</td>
                  <td className="p-3">{d.title}</td>
                  <td className="p-3">{d.dealKind}</td>
                  <td className="p-3">{d.status}</td>
                  <td className="p-3">{d._count.entries}</td>
                  <td className="p-3">
                    <Link
                      href={`/trader/deals/${d.id}`}
                      className="text-ro-purple"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
