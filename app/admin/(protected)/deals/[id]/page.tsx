import { NegotiationForm } from "@/components/deals/negotiation-form";
import { adminCreateOfferDraftFromDealAction } from "@/app/deal-actions";
import { getDealForAdmin } from "@/lib/deals/service";
import { isDealStatus, isOpenDealStatus } from "@/lib/deals/constants";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let deal;
  try {
    deal = await getDealForAdmin(id);
  } catch {
    notFound();
  }

  const open = isDealStatus(deal.status) && isOpenDealStatus(deal.status);

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm text-ro-muted">{deal.reference}</p>
        <h1 className="text-3xl">{deal.title}</h1>
        <p className="mt-2 text-sm">
          {deal.dealKind} · {deal.status}
        </p>
      </div>

      <dl className="grid gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="text-ro-muted">Trader</dt>
          <dd>
            {deal.trader.displayName} · {deal.trader.email}
            {deal.trader.companyName ? (
              <div className="text-ro-muted">{deal.trader.companyName}</div>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-ro-muted">Product reference</dt>
          <dd>
            {deal.product
              ? `${deal.product.nameEn || deal.product.nameAr} (${deal.product.slug})`
              : "Non-catalog — no product created"}
          </dd>
        </div>
        <div>
          <dt className="text-ro-muted">Commercial snapshot</dt>
          <dd>
            {deal.proposedPrice != null
              ? `${Number(deal.proposedPrice)} ${deal.currency ?? ""}`.trim()
              : "—"}
            {deal.quantity != null ? ` · qty ${deal.quantity}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-ro-muted">Conditions</dt>
          <dd className="whitespace-pre-wrap">
            {deal.conditionsNotes || "—"}
          </dd>
        </div>
      </dl>

      <div>
        <h2 className="mb-3 text-lg">Negotiation history</h2>
        <ul className="divide-y divide-ro-line border border-ro-line">
          {deal.entries.map((e) => (
            <li key={e.id} className="space-y-1 p-4 text-sm">
              <div className="flex flex-wrap gap-3">
                <strong>{e.action}</strong>
                <span className="text-ro-muted">{e.actorRole}</span>
                <span className="text-ro-muted">
                  {e.createdAt.toISOString()}
                </span>
              </div>
              {e.message ? <p>{e.message}</p> : null}
              {e.proposedPrice != null || e.quantity != null ? (
                <p className="text-ro-muted">
                  Terms:{" "}
                  {e.proposedPrice != null
                    ? `${Number(e.proposedPrice)} ${e.currency ?? ""}`
                    : ""}
                  {e.quantity != null ? ` · qty ${e.quantity}` : ""}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {open ? <NegotiationForm dealId={deal.id} mode="admin" /> : null}

      <div className="space-y-3 border border-ro-line p-4">
        <h2 className="text-lg">Public curated offer</h2>
        <p className="text-sm text-ro-muted">
          Optional and explicit. Accepting a deal never auto-publishes an offer.
        </p>
        {deal.curatedOffers.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {deal.curatedOffers.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/offers/${o.id}`} className="text-ro-purple">
                  {o.slug}
                </Link>{" "}
                · {o.status}
              </li>
            ))}
          </ul>
        ) : null}
        <form action={adminCreateOfferDraftFromDealAction}>
          <input type="hidden" name="dealId" value={deal.id} />
          <button
            type="submit"
            className="border border-ro-line px-4 py-2 text-sm"
          >
            Create draft offer from this deal
          </button>
        </form>
      </div>
    </section>
  );
}
