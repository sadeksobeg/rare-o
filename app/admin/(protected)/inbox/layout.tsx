import { Suspense } from "react";
import { InboxConversationList } from "@/components/admin/inbox-conversation-list";
import type { InboxListRow } from "@/components/admin/inbox-conversation-list";
import { InboxResizablePanes } from "@/components/admin/inbox-resizable-panes";
import { InboxWorkspaceHeader } from "@/components/admin/inbox-workspace-header";
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <InboxWorkspaceHeader
        health={health}
        dict={dict}
        title={dict.inbox.title}
      />
      <InboxResizablePanes
        className="min-h-0 flex-1"
        list={<InboxConversationList rows={rows} dict={dict} />}
        main={
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        }
      />
    </div>
  );
}

/**
 * OPS-01 inbox — Intercom/Front density: compact chrome, list | thread fill height.
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
      className="ro-inbox-workspace flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] shadow-[var(--ro-e2)]"
    >
      <Suspense
        fallback={
          <div className="flex min-h-0 flex-1 flex-col" aria-busy="true">
            <Skeleton className="h-12 w-full shrink-0 rounded-none" />
            <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[360px_minmax(0,1fr)]">
              <Skeleton className="min-h-[240px] w-full rounded-none" />
              <div className="flex min-h-0 min-w-0 flex-col">{children}</div>
            </div>
          </div>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <InboxListShell locale={locale} dict={dict}>
            {children}
          </InboxListShell>
        </div>
      </Suspense>
    </section>
  );
}
