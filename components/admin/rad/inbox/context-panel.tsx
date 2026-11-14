import { LinkedRecordPanel } from "@/components/admin/linked-record-panel";
import type { InboxConversationDetail } from "@/lib/whatsapp/messaging/inbox";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatMaskedPhone } from "@/lib/whatsapp/messaging/phone-format";
import { RadAvatar } from "@/components/admin/rad/inbox/rad-avatar";
import { RadNotesSection } from "@/components/admin/rad/inbox/notes-section";
import { RadTagsSection } from "@/components/admin/rad/inbox/tags-section";
import { ContextCloseButton } from "@/components/admin/rad/inbox/context-close-btn";
import type {
  BusinessContextView,
  CrmPartySuggestResult,
  LinkAuditEntry,
} from "@/lib/whatsapp/messaging/linking";

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
  suggestions: CrmPartySuggestResult;
  audits: LinkAuditEntry[];
  dict: Dictionary;
  locale: Locale;
}) {
  const ib = dict.ib;
  const title =
    conversation.name ||
    formatMaskedPhone(conversation.participantE164) ||
    conversation.displayLabel;
  const maskedPhone = formatMaskedPhone(conversation.participantE164);

  return (
    <aside className="rad-xp" aria-label={ib.moreInfo}>
      <section className="rad-pf2">
        <div className="rad-pf2-top">
          <ContextCloseButton label={dict.common.close} />
        </div>
        <div className="rad-pf2-av">
          <RadAvatar id={conversation.id} name={conversation.name} size="lg" />
        </div>
        <b>{conversation.name ? title : <bdi dir="ltr">{title}</bdi>}</b>
        <span>
          <bdi dir="ltr">{maskedPhone ?? ""}</bdi>
        </span>
        <div className="rad-pf2-chips">
          {conversation.crm.trader ? (
            <span className="rad-chipl rad-ok">
              {dict.inbox.linkedTraderChip}
            </span>
          ) : null}
          {conversation.link.linked ? (
            <span className="rad-chipl">
              {conversation.link.linkType === "retail_request"
                ? dict.inbox.typeRetail
                : conversation.link.linkType === "deal_proposal"
                  ? dict.inbox.typeDeal
                  : conversation.link.linkType === "wholesale_request"
                    ? dict.inbox.typeWholesale
                    : conversation.link.linkType === "brokerage_request"
                      ? dict.inbox.typeBrokerage
                      : ib.filterLinked}
            </span>
          ) : null}
          {conversation.muted ? (
            <span className="rad-chipl">{ib.mute8h}</span>
          ) : null}
          {conversation.blocked ? (
            <span className="rad-chipl rad-no">{ib.blockContact}</span>
          ) : null}
        </div>
      </section>

      <section className="rad-xp-card">
        <h3>{ib.linkedRecordsHeading}</h3>
        <LinkedRecordPanel
          conversationId={conversation.id}
          link={conversation.link}
          context={context}
          crm={conversation.crm}
          suggestions={suggestions.suggestions}
          sharedTraderPhone={suggestions.sharedTraderPhone}
          audits={audits}
          dict={dict}
          locale={locale}
        />
      </section>

      <section className="rad-xp-card">
        <h3>
          {ib.notesHeading}
          {conversation.notes.length > 0 ? (
            <em className="rad-num">{conversation.notes.length}</em>
          ) : null}
        </h3>
        <RadNotesSection
          conversationId={conversation.id}
          notes={conversation.notes}
          ib={ib}
          locale={locale}
        />
      </section>

      <section className="rad-xp-card">
        <h3>
          {ib.tagsHeading}
          {conversation.tags.length > 0 ? (
            <em className="rad-num">{conversation.tags.length}</em>
          ) : null}
        </h3>
        <RadTagsSection
          conversationId={conversation.id}
          tags={conversation.tags}
          ib={ib}
          inbox={dict.inbox}
        />
      </section>
    </aside>
  );
}
