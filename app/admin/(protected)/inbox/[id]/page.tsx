import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InboxContextShell } from "@/components/admin/inbox-context-shell";
import { InboxThreadContextSplit } from "@/components/admin/inbox-split";
import { LinkedRecordPanel } from "@/components/admin/linked-record-panel";
import { MessageThread } from "@/components/admin/message-thread";
import { getRequestDictionary } from "@/lib/i18n/server";
import {
  getInboxConversation,
  getInboxHealthView,
  markConversationRead,
} from "@/lib/whatsapp/messaging/inbox";
import {
  getBusinessContextForConversation,
  listRecentLinkAudits,
  suggestCrmPartiesForConversation,
} from "@/lib/whatsapp/messaging/linking";
import { notFound } from "next/navigation";

export default async function AdminWhatsAppConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const [conversation, health, context, audits, suggestions] = await Promise.all([
    getInboxConversation(id),
    getInboxHealthView(),
    getBusinessContextForConversation(id),
    listRecentLinkAudits(id, 5),
    suggestCrmPartiesForConversation(id),
  ]);
  if (!conversation) notFound();

  if (conversation.unreadCount > 0) {
    await markConversationRead(conversation.id);
  }

  const panelProps = {
    conversationId: conversation.id,
    link: conversation.link,
    context,
    crm: conversation.crm,
    suggestions,
    audits,
    dict,
    locale,
  } as const;

  const thread = (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="mb-2 lg:hidden">
        <Link
          href="/admin/inbox"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ro-plum hover:underline"
        >
          <ArrowLeft
            className="size-4 rtl:-scale-x-100"
            strokeWidth={1.5}
            aria-hidden
          />
          {dict.inbox.backToList}
        </Link>
      </div>
      <MessageThread
        conversationId={conversation.id}
        displayLabel={conversation.displayLabel}
        phoneHint={
          conversation.participantE164
            ? `+${conversation.participantE164}`
            : null
        }
        messages={conversation.messages.filter((m) => {
          if (m.messageType !== "unsupported") return true;
          const body = (m.body || "").trim();
          return (
            body !== "" &&
            body !== "[unsupported:unknown]" &&
            body !== "[unsupported]"
          );
        })}
        health={health}
        dict={dict}
        locale={locale}
        headerExtra={
          <div className="flex items-center gap-2 xl:hidden">
            <InboxContextShell dict={dict}>
              <LinkedRecordPanel {...panelProps} />
            </InboxContextShell>
          </div>
        }
      />
    </div>
  );

  return (
    <InboxThreadContextSplit
      thread={thread}
      context={<LinkedRecordPanel {...panelProps} />}
    />
  );
}
