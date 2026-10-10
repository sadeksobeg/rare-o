import { AdminRequestControls } from "@/components/admin/request-controls";
import { prisma } from "@/lib/db/prisma";
import {
  RETAIL_REQUEST_TRANSITIONS,
  isRetailRequestStatus,
  type RetailRequestStatus,
} from "@/lib/retail-request/constants";
import { notFound } from "next/navigation";

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await prisma.retailRequest.findUnique({
    where: { id },
    include: {
      lines: true,
      handoffEvents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!request) notFound();

  let payload: unknown = null;
  try {
    payload = JSON.parse(request.handoffPayloadJson);
  } catch {
    payload = request.handoffPayloadJson;
  }

  const current = isRetailRequestStatus(request.status)
    ? request.status
    : null;
  const nextStatuses: RetailRequestStatus[] = current
    ? [...RETAIL_REQUEST_TRANSITIONS[current]]
    : [];

  return (
    <section className="space-y-6">
      <h1 className="text-3xl">{request.reference}</h1>
      <dl className="grid gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="text-ro-muted">Status</dt>
          <dd>{request.status}</dd>
        </div>
        <div>
          <dt className="text-ro-muted">Locale</dt>
          <dd>{request.locale}</dd>
        </div>
        <div>
          <dt className="text-ro-muted">Customer</dt>
          <dd>
            {request.customerName} · {request.customerPhone}
          </dd>
        </div>
        <div>
          <dt className="text-ro-muted">Destination</dt>
          <dd>{request.destinationCountry}</dd>
        </div>
        <div>
          <dt className="text-ro-muted">Shipping method</dt>
          <dd>{request.shippingMethodCode ?? "null (confirm with team)"}</dd>
        </div>
        <div>
          <dt className="text-ro-muted">Subtotal</dt>
          <dd>
            {Number(request.subtotal)} {request.currency}
          </dd>
        </div>
        <div>
          <dt className="text-ro-muted">Handoff prepared</dt>
          <dd>
            {request.handoffPreparedAt
              ? request.handoffPreparedAt.toISOString()
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-ro-muted">Handoff opened</dt>
          <dd>
            {request.handoffOpenedAt
              ? request.handoffOpenedAt.toISOString()
              : "—"}
          </dd>
        </div>
      </dl>

      <AdminRequestControls
        requestId={request.id}
        nextStatuses={nextStatuses}
        whatsAppDeepLink={request.whatsAppDeepLink}
        canRetrigger={
          request.status !== "draft" &&
          request.status !== "completed" &&
          request.status !== "cancelled"
        }
      />

      <div>
        <h2 className="mb-2 text-lg">Lines</h2>
        <ul className="space-y-2 border border-ro-line p-4 text-sm">
          {request.lines.map((l) => (
            <li key={l.id}>
              {l.productNameEn || l.productNameAr} × {l.quantity} —{" "}
              {Number(l.lineTotal)} {l.currency}
            </li>
          ))}
        </ul>
      </div>

      {request.handoffMessageText ? (
        <div>
          <h2 className="mb-2 text-lg">Stored WhatsApp message</h2>
          <pre className="overflow-x-auto whitespace-pre-wrap border border-ro-line bg-ro-surface p-4 text-xs">
            {request.handoffMessageText}
          </pre>
        </div>
      ) : null}

      <div>
        <h2 className="mb-2 text-lg">Structured handoff payload</h2>
        <pre className="overflow-x-auto border border-ro-line bg-ro-surface p-4 text-xs">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="mb-2 text-lg">Audit events</h2>
        {request.handoffEvents.length === 0 ? (
          <p className="text-sm text-ro-muted">No events yet.</p>
        ) : (
          <ul className="divide-y divide-ro-line border border-ro-line text-sm">
            {request.handoffEvents.map((e) => (
              <li key={e.id} className="space-y-1 p-3">
                <div className="flex flex-wrap gap-3">
                  <span>{e.eventType}</span>
                  <span className="text-ro-muted">
                    {e.fromStatus ?? "—"} → {e.toStatus ?? "—"}
                  </span>
                  <span className="text-ro-muted">{e.actor}</span>
                  <span className="text-ro-muted">
                    {e.createdAt.toISOString()}
                  </span>
                </div>
                {e.note ? <p className="text-ro-muted">{e.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
