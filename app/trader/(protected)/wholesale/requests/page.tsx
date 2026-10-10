import Link from "next/link";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { listWholesaleRequestsForTrader } from "@/lib/wholesale/service";

export default async function TraderWholesaleRequestsPage() {
  const session = await requireTraderSession();
  const requests = await listWholesaleRequestsForTrader(session.sub);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl">My wholesale requests</h1>
        <Link
          href="/trader/wholesale"
          className="bg-ro-purple px-4 py-2 text-sm text-ro-ivory"
        >
          New request
        </Link>
      </div>
      <div className="overflow-x-auto border border-ro-line">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ro-line bg-ro-surface">
            <tr>
              <th className="p-3">Reference</th>
              <th className="p-3">Mode</th>
              <th className="p-3">Status</th>
              <th className="p-3">Lines</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td className="p-4 text-ro-muted" colSpan={5}>
                  No wholesale requests yet.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="border-b border-ro-line">
                  <td className="p-3">{r.reference}</td>
                  <td className="p-3">{r.requestMode}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{r._count.lines}</td>
                  <td className="p-3">
                    <Link
                      href={`/trader/wholesale/${r.id}`}
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
