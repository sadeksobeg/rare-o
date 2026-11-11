import { LinkedRecordPanel } from "@/components/admin/linked-record-panel";
import type { InboxConversationDetail } from "@/lib/whatsapp/messaging/inbox";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatMaskedPhone } from "@/lib/whatsapp/messaging/phone-format";
import { RadAvatar } from "@/components/admin/rad/inbox/rad-avatar";
import { RadNotesSection } from "@/components/admin/rad/inbox/notes-section";
import { RadTagsSection } from "@/components/admin/rad/inbox/tags-section";
import type { BusinessContextView, CrmPartySuggestion, LinkAuditEntry } from "@/lib/whatsapp/messaging/linking";

/**
 * Profile header + notes + tags + linked-record panel (visual skin only on
 * the latter — link/unlink/CRM actions unchanged).
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
        <RadAvatar id={conversation.id} name={conversation.name} size="lg" />
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
        <RadTagsSection
          conversationId={conversation.id}
          tags={conversation.tags}
          ib={ib}
          inbox={dict.inbox}
        />
      </section>

      <section>
        <h3>{ib.linkedRecordsHeading}</h3>
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
