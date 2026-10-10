import { NegotiationForm } from "@/components/deals/negotiation-form";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getDealForTrader } from "@/lib/deals/service";
import { isOpenDealStatus, isDealStatus } from "@/lib/deals/constants";
import { notFound } from "next/navigation";

export default async function TraderDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireTraderSession();
  const { id } = await params;

  let deal;
  try {
    // Ownership enforced: traderId from session, not from URL alone
    deal = await getDealForTrader(id, session.sub);
  } catch {
    notFound();
  }

  const open =
    isDealStatus(deal.status) && isOpenDealStatus(deal.status);

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm text-ro-muted">{deal.reference}</p>
        <h1 className="text-3xl">{deal.title}</h1>
        <p className="mt-2 text-sm">
          {deal.dealKind} · <span className="text-ro-muted">{deal.status}</span>
        </p>
      </div>

      <dl className="grid gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="text-ro-muted">Product</dt>
          <dd>
            {deal.product
              ? `${deal.product.nameEn || deal.product.nameAr} (${deal.product.slug})`
              : "Non-catalog (no product link)"}
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
        <div className="md:col-span-2">
          <dt className="text-ro-muted">Conditions / notes</dt>
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
              {e.conditionsNotes ? (
                <p className="text-ro-muted">{e.conditionsNotes}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {open ? <NegotiationForm dealId={deal.id} mode="trader" /> : (
        <p className="text-sm text-ro-muted">
          This deal is {deal.status}. Negotiation is closed.
        </p>
      )}
    </section>
  );
}
