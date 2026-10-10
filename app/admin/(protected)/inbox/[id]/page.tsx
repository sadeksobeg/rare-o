import Link from "next/link";
import { BusinessContextPanel } from "@/components/admin/business-context-panel";
import { InboxComposer } from "@/components/admin/inbox-composer";
import { InboxHealthBanner } from "@/components/admin/inbox-health";
import { InboxLinkControls } from "@/components/admin/inbox-link-controls";
import { getRequestDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  getInboxConversation,
  getInboxHealthView,
  markConversationRead,
} from "@/lib/whatsapp/messaging/inbox";
import { getBusinessContextForConversation } from "@/lib/whatsapp/messaging/linking";
import { notFound } from "next/navigation";

function formatWhen(iso: string | null, locale: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusLabel(dict: Dictionary, status: string): string {
  switch (status) {
    case "pending":
      return dict.inbox.statusPending;
    case "sending":
      return dict.inbox.statusSending;
    case "sent":
      return dict.inbox.statusSent;
    case "failed":
      return dict.inbox.statusFailed;
    case "received":
      return dict.inbox.statusReceived;
    default:
      return status;
  }
}

function linkTypeLabel(dict: Dictionary, linkType: string): string {
  switch (linkType) {
    case "retail_request":
      return dict.inbox.typeRetail;
    case "deal_proposal":
      return dict.inbox.typeDeal;
    case "wholesale_request":
      return dict.inbox.typeWholesale;
    default:
      return dict.inbox.notLinked;
  }
}

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

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/admin/inbox"
          className="text-sm text-ro-purple hover:underline"
        >
          ← {dict.inbox.backToList}
        </Link>
        <h1 className="text-3xl">{conversation.displayLabel}</h1>
        <p className="text-sm text-ro-muted">
          {conversation.link.linked
            ? `${dict.inbox.linkedAs}: ${linkTypeLabel(dict, conversation.link.linkType)}`
            : dict.inbox.notLinked}
          <span className="mx-2 text-ro-line">·</span>
          <span className="font-mono text-xs">{conversation.waChatId}</span>
        </p>
      </div>

      <InboxHealthBanner health={health} dict={dict} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <div className="space-y-4">
          <div className="space-y-3 border border-ro-line p-4">
            {conversation.messages.length === 0 ? (
              <p className="text-sm text-ro-muted">{dict.inbox.noMessages}</p>
            ) : (
              conversation.messages.map((m) => {
                const isOut = m.direction === "outbound";
                const failed = m.status === "failed";
                const when = formatWhen(m.waTimestamp ?? m.createdAt, locale);
                return (
                  <article
                    key={m.id}
                    className={`max-w-[min(100%,36rem)] space-y-1 border border-ro-line p-3 text-sm ${
                      isOut ? "ms-auto bg-ro-surface" : "me-auto bg-transparent"
                    } ${failed ? "border-ro-purple" : ""}`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ro-muted">
                      <span>
                        {isOut ? dict.inbox.outbound : dict.inbox.inbound}
                      </span>
                      <span>·</span>
                      <span>{statusLabel(dict, m.status)}</span>
                      <span>·</span>
                      <span>{when}</span>
                    </div>
                    {m.messageType === "unsupported" ? (
                      <p className="text-ro-muted">{dict.inbox.unsupported}</p>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    )}
                    {failed && m.errorSafe ? (
                      <p className="text-xs text-ro-purple">{m.errorSafe}</p>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>

          <InboxComposer
            conversationId={conversation.id}
            outboundEnabled={health.outboundEnabled}
            dict={dict}
          />
        </div>

        <div className="space-y-4">
          <BusinessContextPanel
            context={context}
            dict={dict}
            locale={locale}
          />
          <InboxLinkControls
            conversationId={conversation.id}
            link={conversation.link}
            dict={dict}
          />
        </div>
      </div>
    </section>
  );
}
