import Link from "next/link";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getAdminHomeData } from "@/lib/admin/dashboard";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** SYS-01 — admin alerts hub from live queues (no separate notification table). */
export default async function AdminNotificationsPage() {
  const { dict } = await getRequestDictionary();
  const u = dict.adminUi;
  const data = await getAdminHomeData();

  const items = [
    ...data.actionQueue.slice(0, 12).map((row) => ({
      id: row.id,
      href: row.href,
      title: row.reference,
      body: row.title,
      badge: u.notificationsAwaiting,
    })),
    ...(data.kpis.unreadConversations > 0
      ? [
          {
            id: "inbox-unread",
            href: "/admin/inbox?tab=unread",
            title: u.notificationsUnreadInbox,
            body: String(data.kpis.unreadConversations),
            badge: dict.inbox.tabUnread,
          },
        ]
      : []),
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title={u.notificationsTitle}
        description={u.notificationsLead}
        icon={<Bell className="size-5" strokeWidth={2} />}
      />
      {items.length === 0 ? (
        <EmptyState
          variant="first-use"
          title={u.notificationsEmpty}
          actionHref="/admin/inbox"
          actionLabel={dict.admin.openInbox}
        />
      ) : (
        <ul className="divide-y divide-[color-mix(in_srgb,var(--ro-plum-900)_10%,transparent)] rounded-[var(--ro-r-sm)] border border-ro-line bg-ro-surface">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-opacity hover:opacity-90"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ro-ink">{item.title}</p>
                  <p className="truncate text-sm text-ro-muted">{item.body}</p>
                </div>
                <span className="rounded-full bg-[var(--ro-amber-100)] px-2.5 py-1 text-xs font-semibold text-[var(--ro-amber-800)]">
                  {item.badge}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
