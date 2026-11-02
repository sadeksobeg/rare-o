import { Suspense } from "react";
import { InboxConversationList } from "@/components/admin/inbox-conversation-list";
import type { InboxListRow } from "@/components/admin/inbox-conversation-list";
import { InboxConnectionBanner } from "@/components/admin/inbox-connection-banner";
import { InboxResizablePanes } from "@/components/admin/inbox-resizable-panes";
import { MessageSquare } from "lucide-react";
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

function linkLabelFor(
  dict: Dictionary,
  linkType: string,
  linked: boolean
): string {
  if (!linked) return dict.inbox.notLinked;
  if (linkType === "retail_request") return dict.inbox.typeRetail;
  if (linkType === "deal_proposal") return dict.inbox.typeDeal;
  if (linkType === "wholesale_request") return dict.inbox.typeWholesale;
  if (linkType === "brokerage_request") return dict.inbox.typeBrokerage;
  return dict.inbox.notLinked;
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
    const linked = c.link.linked;
    const linkType = linked ? c.link.linkType : "none";
    return {
      id: c.id,
      displayLabel: c.displayLabel,
      preview: c.lastMessagePreview || "—",
      whenLabel: formatWhen(c.lastMessageAt, locale),
      linkLabel: linkLabelFor(dict, linkType, linked),
      linked,
      hasUnread: c.hasUnread,
      unreadCount: c.unreadCount,
      searchText: c.displayLabel.toLowerCase(),
    };
  });

  return (
    <>
      <InboxConnectionBanner health={health} dict={dict} />
      <WhatsAppLinkAccount health={health} dict={dict} />
      <InboxResizablePanes
        className="min-h-0 flex-1"
        list={<InboxConversationList rows={rows} dict={dict} />}
        main={
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            {children}
          </div>
        }
      />
    </>
  );
}

/**
 * OPS-01 inbox shell: banner + resizable list | thread (+ context inside thread route).
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
      className="flex h-[calc(100dvh-4.25rem)] min-h-[28rem] flex-col gap-2 overflow-hidden"
    >
      <PageHeader
        title={dict.inbox.title}
        description={dict.inbox.subtitle}
        icon={<MessageSquare className="size-5" strokeWidth={2} />}
        className="shrink-0 !mb-0"
      />
      <Suspense
        fallback={
          <div className="flex min-h-0 flex-1 flex-col gap-2" aria-busy="true">
            <Skeleton className="h-10 w-full shrink-0" />
            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
              <Skeleton className="min-h-[240px] w-full" />
              <div className="flex min-h-0 min-w-0 flex-col">{children}</div>
            </div>
          </div>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <InboxListShell locale={locale} dict={dict}>
            {children}
          </InboxListShell>
        </div>
      </Suspense>
    </section>
  );
}
