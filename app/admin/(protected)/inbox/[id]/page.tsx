import { notFound } from "next/navigation";
import { RadContextPanel } from "@/components/admin/rad/inbox/context-panel";
import { RadThread } from "@/components/admin/rad/inbox/thread";
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

  const ib = dict.ib;
  const quickReplies = [
    { title: ib.qr1Title, body: ib.qr1Body },
    { title: ib.qr2Title, body: ib.qr2Body },
    { title: ib.qr3Title, body: ib.qr3Body },
  ];

  return (
    <>
      <RadThread
        key="thread"
        conversation={conversation}
        health={health}
        dict={dict}
        locale={locale}
        quickReplies={quickReplies}
      />
      <RadContextPanel
        key="context"
        conversation={conversation}
        context={context}
        suggestions={suggestions}
        audits={audits}
        dict={dict}
        locale={locale}
      />
    </>
  );
}
