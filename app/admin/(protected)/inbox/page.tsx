import { MessageSquare } from "lucide-react";
import { getRequestDictionary } from "@/lib/i18n/server";

/**
 * Index route: list lives in the layout. Desktop fills the thread pane with a prompt.
 */
export default async function AdminWhatsAppInboxPage() {
  const { dict } = await getRequestDictionary();

  return (
    <div
      data-inbox-pane="empty"
      className="hidden min-h-0 flex-1 flex-col items-center justify-center gap-4 bg-[color:var(--ro-bg-sunken)] px-8 py-12 text-center lg:flex"
    >
      <span
        className="inline-flex size-16 items-center justify-center rounded-full bg-[color:var(--ro-panel)] text-[color:var(--ro-accent-fg)] shadow-[var(--ro-e2)] ring-1 ring-[color:var(--ro-border-subtle)]"
        aria-hidden
      >
        <MessageSquare className="size-7" strokeWidth={1.5} />
      </span>
      <div className="max-w-sm space-y-1.5">
        <h2 className="text-base font-semibold text-[color:var(--ro-text)]">
          {dict.inbox.selectConversation}
        </h2>
        <p className="text-sm leading-relaxed text-[color:var(--ro-text-muted)]">
          {dict.inbox.selectConversationHint}
        </p>
      </div>
    </div>
  );
}
