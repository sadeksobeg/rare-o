/**
 * Auto-link a WhatsApp conversation to a retail request when the customer
 * sends the prepared handoff message (it carries «المرجع: RO-YYYY-NNNN»).
 *
 * Conservative on purpose — links only when ALL hold:
 *  - the conversation is not linked to any business record yet and has no trader
 *  - the text contains exactly one distinct RO- reference
 *  - exactly one retail request has that reference
 *  - phones don't contradict (when both sides expose enough digits)
 * Every automatic link writes the same audit row as a manual one, with the
 * actor "system:reference", so an admin can see and undo it.
 */
import { prisma as defaultPrisma } from "@/lib/db/prisma";
import { linkConversationToBusinessRecord } from "@/lib/whatsapp/messaging/linking";
import { publishInboxEvent } from "@/lib/whatsapp/messaging/inbox-events";

export const RETAIL_REFERENCE_ACTOR = "system:reference";

const REF_RE = /\bRO-\d{4}-\d{4}\b/gi;

export function extractRetailReferences(text: string | null | undefined): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const m of text.matchAll(REF_RE)) found.add(m[0].toUpperCase());
  return [...found];
}

function digits(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

/** true when both numbers are long enough to compare and clearly differ. */
export function phonesContradict(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = digits(a);
  const db = digits(b);
  if (da.length < 8 || db.length < 8) return false;
  return da.slice(-9) !== db.slice(-9);
}

export type AutoLinkResult =
  | { linked: true; requestId: string; reference: string }
  | { linked: false; reason: string };

type Db = typeof defaultPrisma;

export async function autoLinkConversationByRetailReference(
  input: { conversationId: string; text: string },
  db: Db = defaultPrisma
): Promise<AutoLinkResult> {
  const refs = extractRetailReferences(input.text);
  if (refs.length === 0) return { linked: false, reason: "NO_REFERENCE" };
  if (refs.length > 1) return { linked: false, reason: "AMBIGUOUS_REFERENCES" };

  const conversation = await db.whatsAppConversation.findUnique({
    where: { id: input.conversationId },
    select: {
      id: true,
      linkType: true,
      linkId: true,
      traderId: true,
      customerId: true,
      participantE164: true,
    },
  });
  if (!conversation) return { linked: false, reason: "NO_CONVERSATION" };
  if (conversation.traderId) return { linked: false, reason: "TRADER_CONVERSATION" };
  if (conversation.linkType !== "none" || conversation.linkId) {
    return { linked: false, reason: "ALREADY_LINKED" };
  }

  const matches = await db.retailRequest.findMany({
    where: { reference: refs[0]! },
    select: { id: true, reference: true, customerPhone: true, customerId: true },
    take: 2,
  });
  if (matches.length !== 1) return { linked: false, reason: "NO_UNIQUE_REQUEST" };
  const request = matches[0]!;

  if (phonesContradict(conversation.participantE164, request.customerPhone)) {
    return { linked: false, reason: "PHONE_MISMATCH" };
  }

  const res = await linkConversationToBusinessRecord(
    {
      conversationId: conversation.id,
      linkType: "retail_request",
      linkId: request.id,
      adminId: RETAIL_REFERENCE_ACTOR,
    },
    db
  );
  if (!res.ok) return { linked: false, reason: res.code };

  // Also attach the customer record so the panel shows the customer, not just a request.
  if (request.customerId && !conversation.customerId) {
    await db.whatsAppConversation
      .update({
        where: { id: conversation.id },
        data: { customerId: request.customerId },
      })
      .catch(() => undefined);
  }

  void publishInboxEvent("conversation.updated", {
    conversationId: conversation.id,
  });
  return { linked: true, requestId: request.id, reference: request.reference };
}
