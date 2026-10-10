import Link from "next/link";
import { listWholesaleRequestsForAdmin } from "@/lib/wholesale/service";

export default async function AdminWholesalePage() {
  const requests = await listWholesaleRequestsForAdmin();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl">Wholesale requests</h1>
      <p className="text-sm text-ro-muted">
        Separate from retail handoff and trader deals. Quote / confirm /
        complete only — no payment or shipping engine.
      </p>
      <div className="overflow-x-auto border border-ro-line">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ro-line bg-ro-surface">
            <tr>
              <th className="p-3">Reference</th>
              <th className="p-3">Trader</th>
              <th className="p-3">Mode</th>
              <th className="p-3">Status</th>
              <th className="p-3">Lines</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-ro-line">
                <td className="p-3">{r.reference}</td>
                <td className="p-3">
                  {r.trader.displayName}
                  <div className="text-ro-muted">{r.trader.email}</div>
                </td>
                <td className="p-3">{r.requestMode}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">{r._count.lines}</td>
                <td className="p-3">
                  <Link
                    href={`/admin/wholesale/${r.id}`}
                    className="text-ro-purple"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
