import { prisma } from "@/lib/db/prisma";
import { RelinkButton } from "@/components/admin/rad/inbox/relink-button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { normalizePhoneDigits } from "@/lib/validation/customer-identity";
import { getStatusLabel } from "@/lib/ui/status-labels";

type Item = {
  type: "retail_request" | "wholesale_request" | "deal_proposal" | "brokerage_request";
  id: string;
  reference: string;
  status: string;
  at: Date;
};

/**
 * «الطلبات السابقة» — every other record of the same person so the admin can jump the
 * conversation's work context back to an earlier request with one click.
 */
export async function RelatedRecords({
  conversationId,
  dict,
}: {
  conversationId: string;
  dict: Dictionary;
}) {
  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { traderId: true, customerId: true, participantE164: true, linkType: true, linkId: true },
  });
  if (!conv) return null;
  const tail = normalizePhoneDigits(conv.participantE164 ?? "").slice(-9);
  const items: Item[] = [];

  if (conv.customerId || tail.length >= 8) {
    const rows = await prisma.retailRequest.findMany({
      where: {
        status: { not: "draft" },
        OR: [
          ...(conv.customerId ? [{ customerId: conv.customerId }] : []),
          ...(tail.length >= 8 ? [{ customerPhone: { endsWith: tail } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, reference: true, status: true, createdAt: true },
    });
    for (const r of rows) items.push({ type: "retail_request", id: r.id, reference: r.reference, status: r.status, at: r.createdAt });
  }
  if (conv.traderId) {
    const [wh, dl, bk] = await Promise.all([
      prisma.wholesaleRequest.findMany({ where: { traderId: conv.traderId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, reference: true, status: true, createdAt: true } }),
      prisma.dealProposal.findMany({ where: { traderId: conv.traderId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, reference: true, status: true, createdAt: true } }),
      prisma.brokerageRequest.findMany({ where: { traderId: conv.traderId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, reference: true, status: true, createdAt: true } }),
    ]);
    for (const r of wh) items.push({ type: "wholesale_request", id: r.id, reference: r.reference, status: r.status, at: r.createdAt });
    for (const r of dl) items.push({ type: "deal_proposal", id: r.id, reference: r.reference, status: r.status, at: r.createdAt });
    for (const r of bk) items.push({ type: "brokerage_request", id: r.id, reference: r.reference, status: r.status, at: r.createdAt });
  }
  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  const list = items.slice(0, 10);
  if (list.length === 0) return null;

  const typeLabel: Record<Item["type"], string> = {
    retail_request: dict.inbox.typeRetail,
    wholesale_request: dict.inbox.typeWholesale,
    deal_proposal: dict.inbox.typeDeal,
    brokerage_request: dict.inbox.typeBrokerage,
  };
  const domain: Record<Item["type"], "retail" | "wholesale" | "deal" | null> = {
    retail_request: "retail",
    wholesale_request: "wholesale",
    deal_proposal: "deal",
    brokerage_request: null,
  };

  return (
    <section className="rad-xp-card">
      <h3>
        الطلبات السابقة
        <em className="rad-num">{list.length}</em>
      </h3>
      <ul className="space-y-2">
        {list.map((it) => {
          const current = conv.linkType === it.type && conv.linkId === it.id;
          return (
            <li
              key={`${it.type}-${it.id}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--rad-bd)] p-2.5 text-sm"
              style={current ? { borderColor: "var(--rad-ac, #a678d8)", background: "color-mix(in srgb, var(--rad-ac, #a678d8) 10%, transparent)" } : undefined}
            >
              <span className="min-w-0">
                <b className="block truncate" dir="ltr" style={{ textAlign: "start" }}>
                  {it.reference}
                </b>
                <span className="text-xs opacity-70">
                  {typeLabel[it.type]} · {domain[it.type] ? getStatusLabel(dict, domain[it.type]!, it.status) : it.status}
                </span>
              </span>
              {current ? (
                <span className="rad-chipl rad-ok shrink-0">المرتبط</span>
              ) : (
                <RelinkButton conversationId={conversationId} linkType={it.type} linkId={it.id} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
