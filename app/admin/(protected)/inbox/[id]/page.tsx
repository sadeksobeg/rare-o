import Link from "next/link";
import { InboxContextShell } from "@/components/admin/inbox-context-shell";
import { LinkedRecordPanel } from "@/components/admin/linked-record-panel";
import { MessageThread } from "@/components/admin/message-thread";
import { getRequestDictionary } from "@/lib/i18n/server";
import {
  getInboxConversation,
  getInboxHealthView,
  markConversationRead,
} from "@/lib/whatsapp/messaging/inbox";
import { getBusinessContextForConversation } from "@/lib/whatsapp/messaging/linking";
import { notFound } from "next/navigation";

export default async function AdminWhatsAppConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const [conversation, health, context] = await Promise.all([
    getInboxConversation(id),
    getInboxHealthView(),
    getBusinessContextForConversation(id),
  ]);
  if (!conversation) notFound();

  if (conversation.unreadCount > 0) {
    await markConversationRead(conversation.id);
  }

  const panelProps = {
    conversationId: conversation.id,
    link: conversation.link,
    context,
    dict,
    locale,
  } as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 xl:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="mb-2 lg:hidden">
          <Link
            href="/admin/inbox"
            className="text-sm font-semibold text-ro-plum hover:underline"
          >
            ← {dict.inbox.backToList}
          </Link>
        </div>
        <MessageThread
          conversationId={conversation.id}
          displayLabel={conversation.displayLabel}
          phoneHint={conversation.waChatId}
          messages={conversation.messages}
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
      {/* ≥1280: fixed 320 context column */}
      <div className="hidden w-[320px] shrink-0 overflow-y-auto xl:block">
        <LinkedRecordPanel {...panelProps} />
      </div>
    </div>
  );
}
