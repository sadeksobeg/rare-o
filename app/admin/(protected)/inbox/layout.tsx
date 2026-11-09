import { Suspense } from "react";
import { RadConversationList } from "@/components/admin/rad/inbox/conversation-list";
import { RadInboxShell } from "@/components/admin/rad/inbox/inbox-shell";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getInboxHealthView, listInboxConversations } from "@/lib/whatsapp/messaging/inbox";

/**
 * Round 3, Part B — rebuilt list column + shell, reference-driven. The
 * actual data functions (listInboxConversations, getInboxHealthView) are
 * untouched (Part A only added the heartbeat staleness check inside
 * getInboxHealthView) — this only changes presentation.
 */
async function InboxListShell({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getRequestDictionary();
  const [rows, health] = await Promise.all([listInboxConversations(), getInboxHealthView()]);

  return (
    <RadInboxShell
      rows={rows}
      list={<RadConversationList rows={rows} health={health} dict={dict} locale={locale} />}
    >
      {children}
    </RadInboxShell>
  );
}

export default function AdminInboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="rad-ibx" aria-busy="true" />}>
      <InboxListShell>{children}</InboxListShell>
    </Suspense>
  );
}
