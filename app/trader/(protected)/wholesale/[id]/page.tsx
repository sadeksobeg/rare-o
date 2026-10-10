import { TraderWholesaleActions } from "@/components/trader/wholesale-actions";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getWholesaleRequestForTrader } from "@/lib/wholesale/service";
import { notFound } from "next/navigation";

export default async function TraderWholesaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireTraderSession();
  const { id } = await params;

  let request;
  try {
    request = await getWholesaleRequestForTrader(id, session.sub);
  } catch {
    notFound();
  }

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm text-ro-muted">{request.reference}</p>
        <h1 className="text-3xl">Wholesale request</h1>
        <p className="mt-2 text-sm">
          {request.requestMode} · {request.status}
        </p>
      </div>

      {request.traderNotes ? (
        <div className="text-sm">
          <p className="text-ro-muted">Your notes</p>
          <p className="whitespace-pre-wrap">{request.traderNotes}</p>
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 text-lg">Lines (snapshots)</h2>
        <ul className="divide-y divide-ro-line border border-ro-line text-sm">
          {request.lines.map((l) => (
            <li key={l.id} className="space-y-1 p-4">
              <div>
                {l.productNameEn || l.productNameAr}{" "}
                <span className="text-ro-muted">({l.productSlugSnapshot})</span>
              </div>
              <div>Qty: {l.quantity}</div>
              {l.proposedUnitPrice != null ? (
                <div>
                  Proposed: {Number(l.proposedUnitPrice)} {l.currency}
                </div>
              ) : null}
              {l.quotedUnitPrice != null ? (
                <div>
                  Quoted: {Number(l.quotedUnitPrice)}{" "}
                  {request.quoteCurrency || l.currency}
                </div>
              ) : null}
              <div className="text-ro-muted">
                Catalog retail ref.: {Number(l.catalogRetailPriceSnapshot)}{" "}
                {l.catalogCurrencySnapshot} (not wholesale pricing)
              </div>
            </li>
          ))}
        </ul>
      </div>

      {request.quoteMessage || request.quotedAt ? (
        <div className="border border-ro-line p-4 text-sm">
          <h2 className="mb-2 text-lg">Quotation</h2>
          {request.quotedAt ? (
            <p className="text-ro-muted">
              Provided {request.quotedAt.toISOString()}
            </p>
          ) : null}
          {request.quoteMessage ? (
            <p className="mt-2 whitespace-pre-wrap">{request.quoteMessage}</p>
          ) : null}
        </div>
      ) : null}

      <TraderWholesaleActions requestId={request.id} status={request.status} />

      <div>
        <h2 className="mb-3 text-lg">History</h2>
        <ul className="divide-y divide-ro-line border border-ro-line text-sm">
          {request.events.map((e) => (
            <li key={e.id} className="space-y-1 p-3">
              <div className="flex flex-wrap gap-3">
                <strong>{e.eventType}</strong>
                <span className="text-ro-muted">{e.actorRole}</span>
                <span className="text-ro-muted">
                  {e.fromStatus ?? "—"} → {e.toStatus ?? "—"}
                </span>
              </div>
              {e.note ? <p className="text-ro-muted">{e.note}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
