"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCheck,
  CircleAlert,
  Clock,
  FileText,
  Loader,
  MapPin,
  UserRound,
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

function MediaBody({
  message,
  isOut,
  dict,
}: {
  message: InboxMessageItem;
  isOut: boolean;
  dict: Dictionary;
}) {
  const muted = isOut ? "text-[var(--ro-sand-200)]" : "text-ro-muted";
  const caption = message.caption?.trim() || null;

  if (message.messageType === "image" || message.messageType === "sticker") {
    return (
      <div className="space-y-1">
        {message.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- private admin media URL
          <img
            src={message.mediaUrl}
            alt=""
            className="max-h-64 max-w-full rounded-[var(--ro-r-sm)] object-contain"
          />
        ) : (
          <p className={muted}>{dict.inbox.nonText}</p>
        )}
        {caption ? (
          <p className="whitespace-pre-wrap break-words">
            <bdi>{caption}</bdi>
          </p>
        ) : null}
      </div>
    );
  }

  if (message.messageType === "video") {
    return (
      <div className="space-y-1">
        {message.mediaUrl ? (
          <video
            controls
            preload="metadata"
            className="max-h-64 max-w-full rounded-[var(--ro-r-sm)]"
            src={message.mediaUrl}
          />
        ) : (
          <p className={muted}>{dict.inbox.nonText}</p>
        )}
        {caption ? (
          <p className="whitespace-pre-wrap break-words">
            <bdi>{caption}</bdi>
          </p>
        ) : null}
      </div>
    );
  }

  if (message.messageType === "audio") {
    return message.mediaUrl ? (
      <audio controls preload="metadata" className="max-w-full" src={message.mediaUrl} />
    ) : (
      <p className={muted}>{dict.inbox.nonText}</p>
    );
  }

  if (message.messageType === "document") {
    return (
      <div className="space-y-1">
        {message.mediaUrl ? (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 font-semibold underline-offset-2 hover:underline",
              isOut ? "text-[var(--ro-sand-100)]" : "text-ro-plum"
            )}
          >
            <FileText className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
            <bdi>{message.mediaFileName || dict.inbox.nonText}</bdi>
          </a>
        ) : (
          <p className={muted}>{dict.inbox.nonText}</p>
        )}
        {caption ? (
          <p className="whitespace-pre-wrap break-words">
            <bdi>{caption}</bdi>
          </p>
        ) : null}
      </div>
    );
  }

  if (message.messageType === "location") {
    return (
      <p className={cn("inline-flex items-center gap-1.5", muted)}>
        <MapPin className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        {dict.inbox.msgLocation}
      </p>
    );
  }

  if (message.messageType === "contact") {
    return (
      <p className={cn("inline-flex items-center gap-1.5", muted)}>
        <UserRound className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        {dict.inbox.msgContact}
      </p>
    );
  }

  if (message.messageType === "unsupported") {
    return <p className={muted}>{dict.inbox.nonText}</p>;
  }

  return (
    <p className="whitespace-pre-wrap break-words">
      <bdi>{message.body}</bdi>
    </p>
  );
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
        "max-w-[min(34rem,92%)] space-y-1.5 rounded-[var(--ro-r-sm)] px-4 py-2.5 text-[0.9375rem] leading-relaxed shadow-[0_1px_0_color-mix(in_srgb,var(--ro-ink-950)_6%,transparent)]",
        isOut
          ? "ms-auto bg-[var(--ro-plum-900)] text-[var(--ro-sand-100)]"
          : "me-auto border border-ro-border bg-[var(--ro-sand-50)] text-ro-ink",
        failed && "ring-1 ring-[var(--ro-danger-700)]"
      )}
    >
      <MediaBody message={message} isOut={isOut} dict={dict} />
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
