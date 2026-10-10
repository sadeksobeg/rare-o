import Link from "next/link";
import { getDashboardCounts } from "@/lib/retail-request/service";

export default async function AdminDashboardPage() {
  const counts = await getDashboardCounts();

  const cards = [
    { label: "Published products", value: counts.published },
    { label: "Draft products", value: counts.draft },
    { label: "Unavailable products", value: counts.unavailable },
    { label: "Retail requests", value: counts.requests },
    { label: "Draft requests", value: counts.draftRequests },
    { label: "Ready for handoff", value: counts.readyRequests },
    { label: "Handoff opened", value: counts.handoffOpenedRequests },
    { label: "In follow-up", value: counts.inFollowUpRequests },
  ];

  return (
    <section className="space-y-8">
      <h1 className="text-3xl">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="border border-ro-line p-4">
            <p className="text-sm text-ro-muted">{c.label}</p>
            <p className="mt-2 text-3xl">{c.value}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl">WhatsApp inbox</h2>
          <Link href="/admin/inbox" className="text-sm text-ro-purple">
            Open inbox
          </Link>
        </div>
        <p className="mb-8 text-sm text-ro-muted">
          Real conversations from WhatsApp persistence — not the Week 3 wa.me
          handoff.
        </p>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl">Recent retail requests</h2>
          <Link href="/admin/requests" className="text-sm text-ro-purple">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-ro-line border border-ro-line">
          {counts.recentRequests.length === 0 ? (
            <li className="p-4 text-sm text-ro-muted">No requests yet.</li>
          ) : (
            counts.recentRequests.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 p-4 text-sm">
                <span>{r.reference}</span>
                <span>{r.customerName}</span>
                <span>{r.status}</span>
                <span>
                  {Number(r.subtotal)} {r.currency}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
