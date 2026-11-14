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

// RO-YYYY-XXXXXX (new, unguessable) and legacy RO-YYYY-NNNN (4 digits, guessable)
const REF_RE = /\bRO-\d{4}-[A-Z0-9]{4,8}\b/gi;
const LEGACY_REF_RE = /^RO-\d{4}-\d{4}$/;

/** Legacy 4-digit references can be guessed, so they never link without a phone match. */
export function isLegacyReference(ref: string): boolean {
  return LEGACY_REF_RE.test(ref);
}

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
  const alreadyLinked = conversation.linkType !== "none" || Boolean(conversation.linkId);

  const matches = await db.retailRequest.findMany({
    where: { reference: refs[0]! },
    select: {
      id: true,
      reference: true,
      customerPhone: true,
      customerId: true,
      createdAt: true,
    },
    take: 2,
  });
  if (matches.length !== 1) return { linked: false, reason: "NO_UNIQUE_REQUEST" };
  const request = matches[0]!;

  if (phonesContradict(conversation.participantE164, request.customerPhone)) {
    return { linked: false, reason: "PHONE_MISMATCH" };
  }
  const phoneKnown = digits(conversation.participantE164).length >= 8;
  if (isLegacyReference(request.reference) && !phoneKnown) {
    return { linked: false, reason: "LEGACY_REFERENCE_NEEDS_PHONE" };
  }

  if (alreadyLinked) {
    // A returning customer sends a NEW request's reference: move the link to it,
    // but only when the current link is an older retail request of the same
    // person — never steal a chat that an admin tied to a deal/wholesale/etc.
    if (conversation.linkType !== "retail_request" || !conversation.linkId) {
      return { linked: false, reason: "ALREADY_LINKED" };
    }
    if (conversation.linkId === request.id) {
      return { linked: false, reason: "ALREADY_LINKED_SAME" };
    }
    const current = await db.retailRequest.findUnique({
      where: { id: conversation.linkId },
      select: { customerId: true, customerPhone: true, createdAt: true, status: true },
    });
    const samePerson =
      !!current &&
      ((current.customerId && current.customerId === request.customerId) ||
        !phonesContradict(current.customerPhone, request.customerPhone));
    if (!current || !samePerson || request.createdAt <= current.createdAt) {
      return { linked: false, reason: "ALREADY_LINKED" };
    }
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
