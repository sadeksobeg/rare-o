import { InboxConversationList } from "@/components/admin/inbox-conversation-list";
import type { InboxListRow } from "@/components/admin/inbox-conversation-list";
import { InboxHealthBanner } from "@/components/admin/inbox-health";
import { PageHeader } from "@/components/admin/page-header";
import { getRequestDictionary } from "@/lib/i18n/server";
import {
  getInboxHealthView,
  listInboxConversations,
} from "@/lib/whatsapp/messaging/inbox";

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

/**
 * Inbox shell: header + health banner, then list | thread panes.
 * The thread page adds a third (business context) pane on wide screens.
 */
export default async function AdminInboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, dict } = await getRequestDictionary();
  const [conversations, health] = await Promise.all([
    listInboxConversations(),
    getInboxHealthView(),
  ]);

  const rows: InboxListRow[] = conversations.map((c) => ({
    id: c.id,
    displayLabel: c.displayLabel,
    preview: c.lastMessagePreview || "—",
    whenLabel: formatWhen(c.lastMessageAt, locale),
    linkLabel: c.link.linked
      ? `${dict.inbox.linkedAs}: ${
          c.link.linkType === "retail_request"
            ? dict.inbox.typeRetail
            : c.link.linkType === "deal_proposal"
              ? dict.inbox.typeDeal
              : dict.inbox.typeWholesale
        }`
      : dict.inbox.notLinked,
    hasUnread: c.hasUnread,
    unreadCount: c.unreadCount,
  }));

  return (
    <section className="space-y-4">
      <PageHeader title={dict.inbox.title} description={dict.inbox.subtitle} />
      <InboxHealthBanner health={health} dict={dict} />
      <div className="grid gap-4 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <InboxConversationList
          rows={rows}
          heading={dict.inbox.conversations}
          unreadLabel={dict.inbox.unread}
          emptyLabel={dict.inbox.empty}
        />
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
