import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export default async function AdminRequestsPage() {
  const requests = await prisma.retailRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <section className="space-y-6">
      <h1 className="text-3xl">Retail requests</h1>
      <p className="text-sm text-ro-muted">
        Lifecycle: draft → ready_for_handoff → handoff_opened → in_follow_up →
        completed | cancelled. WhatsApp via wa.me only (no Business API / inbox).
      </p>
      <div className="overflow-x-auto border border-ro-line">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ro-line bg-ro-surface">
            <tr>
              <th className="p-3">Reference</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Country</th>
              <th className="p-3">Status</th>
              <th className="p-3">Total</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-ro-line">
                <td className="p-3">{r.reference}</td>
                <td className="p-3">
                  {r.customerName}
                  <div className="text-ro-muted">{r.customerPhone}</div>
                </td>
                <td className="p-3">{r.destinationCountry}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">
                  {Number(r.subtotal)} {r.currency}
                </td>
                <td className="p-3">
                  <Link href={`/admin/requests/${r.id}`} className="text-ro-purple">
                    View
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
