import Link from "next/link";
import { listPublicOffersForAdmin } from "@/lib/offers/service";

export default async function AdminOffersPage() {
  const offers = await listPublicOffersForAdmin();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Public curated offers</h1>
          <p className="mt-1 text-sm text-ro-muted">
            Admin-curated presentations — not trader storefronts or seller
            listings.
          </p>
        </div>
        <Link
          href="/admin/offers/new"
          className="bg-ro-purple px-4 py-2 text-sm text-ro-ivory"
        >
          New offer
        </Link>
      </div>
      <div className="overflow-x-auto border border-ro-line">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ro-line bg-ro-surface">
            <tr>
              <th className="p-3">Slug</th>
              <th className="p-3">Title (EN)</th>
              <th className="p-3">Status</th>
              <th className="p-3">Deal</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id} className="border-b border-ro-line">
                <td className="p-3">{o.slug}</td>
                <td className="p-3">{o.titleEn || o.titleAr}</td>
                <td className="p-3">{o.status}</td>
                <td className="p-3">
                  {o.dealProposal?.reference ?? "—"}
                </td>
                <td className="p-3">
                  <Link href={`/admin/offers/${o.id}`} className="text-ro-purple">
                    Edit
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
