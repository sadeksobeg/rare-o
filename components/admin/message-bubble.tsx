"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCheck,
  CircleAlert,
  Clock,
  Loader,
} from "lucide-react";
import { adminRetryWhatsAppMessageAction } from "@/app/whatsapp-actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { InboxMessageItem } from "@/lib/whatsapp/messaging/inbox";
import { cn } from "@/lib/utils";

function DeliveryIcon({ status }: { status: string }) {
  const cls = "size-3.5 shrink-0";
  switch (status) {
    case "pending":
      return <Clock className={cls} aria-hidden />;
    case "sending":
      return <Loader className={cn(cls, "animate-spin")} aria-hidden />;
    case "sent":
      return <Check className={cls} aria-hidden />;
    case "delivered":
      return <CheckCheck className={cls} aria-hidden />;
    case "failed":
      return <CircleAlert className={cn(cls, "text-[var(--ro-danger-700)]")} aria-hidden />;
    default:
      return null;
  }
}

/** A14 — MessageBubble (RTL-correct start/end alignment). */
export function MessageBubble({
  message,
  dict,
  timeLabel,
}: {
  message: InboxMessageItem;
  dict: Dictionary;
  timeLabel: string;
}) {
  const isOut = message.direction === "outbound";
  const failed = message.status === "failed";
  const nonText = message.messageType === "unsupported";
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function retry() {
    if (pending || !failed) return;
    const fd = new FormData();
    fd.set("messageId", message.id);
    startTransition(async () => {
      await adminRetryWhatsAppMessageAction(fd);
      router.refresh();
    });
  }

  return (
    <article
      data-bubble={isOut ? "out" : "in"}
      className={cn(
        "max-w-[70%] space-y-1 rounded-[var(--ro-r-sm)] px-3 py-2 text-sm",
        isOut
          ? "ms-auto bg-[var(--ro-plum-900)] text-[var(--ro-sand-100)]"
          : "me-auto border border-ro-border bg-[var(--ro-sand-50)] text-ro-ink",
        failed && "ring-1 ring-[var(--ro-danger-700)]"
      )}
    >
      {nonText ? (
        <p className={cn(isOut ? "text-[var(--ro-sand-200)]" : "text-ro-muted")}>
          {dict.inbox.nonText}
        </p>
      ) : (
        <p className="whitespace-pre-wrap break-words">
          <bdi>{message.body}</bdi>
        </p>
      )}
      <footer
        className={cn(
          "flex flex-wrap items-center gap-1.5 text-[11px]",
          isOut ? "text-[var(--ro-sand-200)]" : "text-ro-muted"
        )}
      >
        <time dateTime={message.waTimestamp ?? message.createdAt}>
          {timeLabel}
        </time>
        {isOut ? <DeliveryIcon status={message.status} /> : null}
        {failed ? (
          <button
            type="button"
            onClick={retry}
            disabled={pending}
            className="font-semibold text-[var(--ro-danger-700)] underline-offset-2 hover:underline disabled:opacity-60"
          >
            {dict.inbox.retry}
          </button>
        ) : null}
      </footer>
    </article>
  );
}

/** Day separator between calendar days. */
export function MessageDaySeparator({ label }: { label: string }) {
  return (
    <div
      role="separator"
      className="flex items-center gap-3 py-2 text-center text-xs text-ro-muted"
    >
      <span className="h-px flex-1 bg-ro-border" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-ro-border" />
    </div>
  );
}
