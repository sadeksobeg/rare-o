import Link from "next/link";
import { listDealsForAdmin } from "@/lib/deals/service";

export default async function AdminDealsPage() {
  const deals = await listDealsForAdmin();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl">Deal proposals</h1>
      <p className="text-sm text-ro-muted">
        Negotiation workspace — propose / continue / counter / accept / close.
        Separate from retail requests.
      </p>
      <div className="overflow-x-auto border border-ro-line">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ro-line bg-ro-surface">
            <tr>
              <th className="p-3">Reference</th>
              <th className="p-3">Trader</th>
              <th className="p-3">Title</th>
              <th className="p-3">Kind</th>
              <th className="p-3">Status</th>
              <th className="p-3">Entries</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id} className="border-b border-ro-line">
                <td className="p-3">{d.reference}</td>
                <td className="p-3">
                  {d.trader.displayName}
                  <div className="text-ro-muted">{d.trader.email}</div>
                </td>
                <td className="p-3">{d.title}</td>
                <td className="p-3">{d.dealKind}</td>
                <td className="p-3">{d.status}</td>
                <td className="p-3">{d._count.entries}</td>
                <td className="p-3">
                  <Link href={`/admin/deals/${d.id}`} className="text-ro-purple">
                    Negotiate
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
