// A per-id detail page genuinely can't be meaningfully prerendered without
// knowing every id in advance, so this route is intentionally dynamic
// rather than something Cache Components should try to statically optimize.
// Route segment config only works in a Server Component module, so this
// file stays a thin server wrapper that awaits params and hands the id to
// the actual (client) UI in detail-client.tsx.
export const instant = false;

import { AdminBrokerageDetail } from "./detail-client";

export default async function AdminBrokerageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminBrokerageDetail id={id} />;
}
