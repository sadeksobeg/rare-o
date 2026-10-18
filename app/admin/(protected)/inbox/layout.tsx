import { Suspense } from "react";
import { InboxConversationList } from "@/components/admin/inbox-conversation-list";
import type { InboxListRow } from "@/components/admin/inbox-conversation-list";
import { InboxConnectionBanner } from "@/components/admin/inbox-connection-banner";
import { PageHeader } from "@/components/admin/page-header";
import { WhatsAppLinkAccount } from "@/components/admin/whatsapp-link-account";
import { Skeleton } from "@/components/ui/skeleton";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
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

async function InboxListShell({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const [conversations, health] = await Promise.all([
    listInboxConversations(),
    getInboxHealthView(),
  ]);

  const rows: InboxListRow[] = conversations.map((c) => {
    const linkLabel = c.link.linked
      ? c.link.linkType === "retail_request"
        ? dict.inbox.typeRetail
        : c.link.linkType === "deal_proposal"
          ? dict.inbox.typeDeal
          : dict.inbox.typeWholesale
      : dict.inbox.notLinked;
    return {
      id: c.id,
      displayLabel: c.displayLabel,
      preview: c.lastMessagePreview || "—",
      whenLabel: formatWhen(c.lastMessageAt, locale),
      linkLabel,
      linked: c.link.linked,
      hasUnread: c.hasUnread,
      unreadCount: c.unreadCount,
      searchText: c.displayLabel.toLowerCase(),
    };
  });

  return (
    <>
      <InboxConnectionBanner health={health} dict={dict} />
      <WhatsAppLinkAccount health={health} dict={dict} />
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[340px_minmax(0,1fr)]">
        <InboxConversationList rows={rows} dict={dict} />
        <div className="flex min-h-0 min-w-0 flex-col">{children}</div>
      </div>
    </>
  );
}

/**
 * AD-03 inbox shell: banner + list | thread.
 * Header paints immediately; list/health stream so thread children can show sooner.
 */
export default async function AdminInboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, dict } = await getRequestDictionary();

  return (
    <section
      data-admin-inbox
      className="flex min-h-[calc(100vh-5.5rem)] flex-col gap-3"
    >
      <PageHeader title={dict.inbox.title} description={dict.inbox.subtitle} />
      <Suspense
        fallback={
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-10 w-full" />
            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[340px_minmax(0,1fr)]">
              <Skeleton className="min-h-[320px] w-full" />
              <div className="flex min-h-0 min-w-0 flex-col">{children}</div>
            </div>
          </div>
        }
      >
        <InboxListShell locale={locale} dict={dict}>
          {children}
        </InboxListShell>
      </Suspense>
    </section>
  );
}
