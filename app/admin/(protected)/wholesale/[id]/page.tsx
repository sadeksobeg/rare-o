import { AdminWholesaleControls } from "@/components/admin/wholesale-controls";
import { getWholesaleRequestForAdmin } from "@/lib/wholesale/service";
import { notFound } from "next/navigation";

export default async function AdminWholesaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let request;
  try {
    request = await getWholesaleRequestForAdmin(id);
  } catch {
    notFound();
  }

  const defaultCurrency =
    request.quoteCurrency ||
    request.lines.find((l) => l.currency)?.currency ||
    request.lines[0]?.catalogCurrencySnapshot ||
    "TEST";

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm text-ro-muted">{request.reference}</p>
        <h1 className="text-3xl">Wholesale request</h1>
        <p className="mt-2 text-sm">
          {request.requestMode} · {request.status}
        </p>
      </div>

      <dl className="grid gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="text-ro-muted">Trader</dt>
          <dd>
            {request.trader.displayName} · {request.trader.email}
            {request.trader.companyName ? (
              <div className="text-ro-muted">{request.trader.companyName}</div>
            ) : null}
            {request.trader.phone ? (
              <div className="text-ro-muted">{request.trader.phone}</div>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-ro-muted">Trader notes</dt>
          <dd className="whitespace-pre-wrap">
            {request.traderNotes || "—"}
          </dd>
        </div>
      </dl>

      <div>
        <h2 className="mb-3 text-lg">Lines (historical snapshots)</h2>
        <ul className="divide-y divide-ro-line border border-ro-line text-sm">
          {request.lines.map((l) => (
            <li key={l.id} className="space-y-1 p-4">
              <div>
                {l.productNameEn || l.productNameAr} ({l.productSlugSnapshot})
              </div>
              <div>Qty: {l.quantity}</div>
              {l.proposedUnitPrice != null ? (
                <div>
                  Proposed: {Number(l.proposedUnitPrice)} {l.currency}
                </div>
              ) : (
                <div className="text-ro-muted">No proposed price (quote mode)</div>
              )}
              {l.quotedUnitPrice != null ? (
                <div>
                  Quoted unit: {Number(l.quotedUnitPrice)}{" "}
                  {request.quoteCurrency || l.currency}
                </div>
              ) : null}
              <div className="text-ro-muted">
                Catalog retail ref.: {Number(l.catalogRetailPriceSnapshot)}{" "}
                {l.catalogCurrencySnapshot}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <AdminWholesaleControls
        requestId={request.id}
        status={request.status}
        requestMode={request.requestMode}
        lines={request.lines.map((l) => ({
          id: l.id,
          productNameEn: l.productNameEn || l.productNameAr,
          quantity: l.quantity,
        }))}
        quoteCurrencyDefault={defaultCurrency}
      />

      <div>
        <h2 className="mb-3 text-lg">Audit events</h2>
        <ul className="divide-y divide-ro-line border border-ro-line text-sm">
          {request.events.map((e) => (
            <li key={e.id} className="space-y-1 p-3">
              <div className="flex flex-wrap gap-3">
                <strong>{e.eventType}</strong>
                <span className="text-ro-muted">{e.actorRole}</span>
                <span className="text-ro-muted">
                  {e.fromStatus ?? "—"} → {e.toStatus ?? "—"}
                </span>
                <span className="text-ro-muted">
                  {e.createdAt.toISOString()}
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
