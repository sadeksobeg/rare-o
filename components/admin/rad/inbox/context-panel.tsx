import { LinkedRecordPanel } from "@/components/admin/linked-record-panel";
import type { InboxConversationDetail } from "@/lib/whatsapp/messaging/inbox";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatMaskedPhone } from "@/lib/whatsapp/messaging/inbox";
import { avatarGradientClass, avatarInitial } from "@/components/admin/rad/inbox/avatar-color";
import { RadNotesSection } from "@/components/admin/rad/inbox/notes-section";
import { RadTagsSection } from "@/components/admin/rad/inbox/tags-section";
import type { BusinessContextView, CrmPartySuggestion, LinkAuditEntry } from "@/lib/whatsapp/messaging/linking";

/**
 * New rad-styled profile header + notes + tags (round 3, real/additive
 * features — see ROUND-3-PART-B-REPORT.md). The actual linking UI (search,
 * link, unlink, CRM suggestions) is the existing LinkedRecordPanel,
 * untouched — rebuilding its internals risked the brief's explicit "don't
 * modify existing features" instruction, so it's embedded as-is rather than
 * re-skinned; it will look visually distinct from the reference's own
 * linked-records card until a follow-up visual pass the owner approves.
 */
export function RadContextPanel({
  conversation,
  context,
  suggestions,
  audits,
  dict,
  locale,
}: {
  conversation: InboxConversationDetail;
  context: BusinessContextView;
  suggestions: CrmPartySuggestion[];
  audits: LinkAuditEntry[];
  dict: Dictionary;
  locale: Locale;
}) {
  const ib = dict.ib;
  const title = conversation.name || formatMaskedPhone(conversation.participantE164) || conversation.displayLabel;
  const maskedPhone = formatMaskedPhone(conversation.participantE164);

  return (
    <aside className="rad-xp" aria-label={ib.moreInfo}>
      <section className="rad-pf2">
        <span className={`rad-avt rad-lg ${avatarGradientClass(conversation.id)}`}>{avatarInitial(title)}</span>
        <b>{conversation.name ? title : <bdi dir="ltr">{title}</bdi>}</b>
        <span>
          <bdi dir="ltr">{maskedPhone ?? ""}</bdi>
        </span>
      </section>

      <section>
        <h3>{ib.notesHeading}</h3>
        <RadNotesSection conversationId={conversation.id} notes={conversation.notes} ib={ib} locale={locale} />
      </section>

      <section>
        <h3>{ib.tagsHeading}</h3>
        <RadTagsSection conversationId={conversation.id} tags={conversation.tags} ib={ib} />
      </section>

      <section>
        <LinkedRecordPanel
          conversationId={conversation.id}
          link={conversation.link}
          context={context}
          crm={conversation.crm}
          suggestions={suggestions}
          audits={audits}
          dict={dict}
          locale={locale}
        />
      </section>
    </aside>
  );
}
