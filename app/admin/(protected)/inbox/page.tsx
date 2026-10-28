import { DrawIn, RosetteMark } from "@/components/motion/draw-in";
import { getRequestDictionary } from "@/lib/i18n/server";

/**
 * Index route: list lives in the layout. Desktop fills the thread pane with a prompt;
 * on small screens only the list is shown.
 */
export default async function AdminWhatsAppInboxPage() {
  const { dict } = await getRequestDictionary();

  return (
    <div
      data-inbox-pane="empty"
      className="hidden min-h-64 flex-1 flex-col items-center justify-center gap-2 border border-dashed border-ro-border p-8 text-center lg:flex"
    >
      <DrawIn durationMs={800} className="size-16">
        <RosetteMark width={64} height={64} />
      </DrawIn>
      <h2 className="text-lg font-semibold">{dict.inbox.selectConversation}</h2>
      <p className="max-w-sm text-sm text-ro-muted">
        {dict.inbox.selectConversationHint}
      </p>
    </div>
  );
}
