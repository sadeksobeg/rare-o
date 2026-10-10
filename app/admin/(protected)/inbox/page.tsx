import Link from "next/link";
import { InboxHealthBanner } from "@/components/admin/inbox-health";
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

export default async function AdminWhatsAppInboxPage() {
  const { locale, dict } = await getRequestDictionary();
  const [conversations, health] = await Promise.all([
    listInboxConversations(),
    getInboxHealthView(),
  ]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl">{dict.inbox.title}</h1>
        <p className="text-sm text-ro-muted">{dict.inbox.subtitle}</p>
      </div>

      <InboxHealthBanner health={health} dict={dict} />

      {conversations.length === 0 ? (
        <p className="border border-ro-line p-6 text-sm text-ro-muted">
          {dict.inbox.empty}
        </p>
      ) : (
        <ul className="divide-y divide-ro-line border border-ro-line">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/inbox/${c.id}`}
                className="flex flex-col gap-2 p-4 hover:bg-ro-surface sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{c.displayLabel}</span>
                    {c.hasUnread ? (
                      <span className="border border-ro-purple px-2 py-0.5 text-xs text-ro-purple">
                        {dict.inbox.unread}
                        {c.unreadCount > 1 ? ` (${c.unreadCount})` : ""}
                      </span>
                    ) : null}
                    <span className="text-xs text-ro-muted">
                      {c.link.linked
                        ? `${dict.inbox.linkedAs}: ${
                            c.link.linkType === "retail_request"
                              ? dict.inbox.typeRetail
                              : c.link.linkType === "deal_proposal"
                                ? dict.inbox.typeDeal
                                : dict.inbox.typeWholesale
                          }`
                        : dict.inbox.notLinked}
                    </span>
                  </div>
                  <p className="truncate text-sm text-ro-muted">
                    {c.lastMessagePreview || "—"}
                  </p>
                </div>
                <div className="shrink-0 text-xs text-ro-muted sm:text-end">
                  <div>{formatWhen(c.lastMessageAt, locale)}</div>
                  <div className="mt-1 text-ro-purple">
                    {dict.inbox.openConversation}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
