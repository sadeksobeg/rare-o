import { MessageCircle } from "lucide-react";
import { TraderMessageThread } from "@/components/trader/message-thread";
import { TraderPageHeader } from "@/components/trader/page-header";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import {
  getTraderConversationCached,
  markTraderMessagesRead,
} from "@/lib/whatsapp/messaging/trader-channel";

export const dynamic = "force-dynamic";

export default async function TraderMessagesPage() {
  const session = await requireTraderSession();
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;

  const conversation = await getTraderConversationCached(session.sub);
  await markTraderMessagesRead(session.sub);

  return (
    <section className="ro-portal-stagger space-y-5 sm:space-y-6">
      <TraderPageHeader
        title={t.messagesTitle}
        description={t.messagesLead}
        icon={<MessageCircle className="size-5" strokeWidth={1.5} />}
      />

      <TraderMessageThread
        messages={conversation?.messages ?? []}
        locale={locale}
        t={t}
      />
    </section>
  );
}
