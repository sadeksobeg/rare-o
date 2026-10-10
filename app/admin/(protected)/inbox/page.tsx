import { getRequestDictionary } from "@/lib/i18n/server";

/**
 * Index route: the list lives in the inbox layout. On desktop this fills the
 * thread pane with a prompt; on small screens only the list is shown.
 */
export default async function AdminWhatsAppInboxPage() {
  const { dict } = await getRequestDictionary();

  return (
    <div className="hidden min-h-64 flex-col items-center justify-center gap-2 border border-dashed border-ro-line p-8 text-center lg:flex">
      <h2 className="text-lg font-semibold">{dict.inbox.selectConversation}</h2>
      <p className="max-w-sm text-sm text-ro-muted">
        {dict.inbox.selectConversationHint}
      </p>
    </div>
  );
}
