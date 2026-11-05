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
  const cls = "size-3 shrink-0 opacity-80";
  switch (status) {
    case "pending":
      return <Clock className={cls} aria-hidden />;
    case "sending":
      return <Loader className={cn(cls, "animate-spin")} aria-hidden />;
    case "sent":
      return <Check className={cls} aria-hidden />;
    case "delivered":
    case "read":
      return <CheckCheck className={cls} aria-hidden />;
    case "failed":
      return (
        <CircleAlert
          className={cn(cls, "text-[color:var(--ro-danger-700)] opacity-100")}
          aria-hidden
        />
      );
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
  const muted = isOut
    ? "text-[color-mix(in_srgb,var(--ro-sand-100)_72%,transparent)]"
    : "text-[color:var(--ro-text-muted)]";
  const caption = message.caption?.trim() || null;

  if (message.messageType === "image" || message.messageType === "sticker") {
    return (
      <div className="space-y-1.5">
        {message.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- private admin media URL
          <img
            src={message.mediaUrl}
            alt=""
            className="max-h-64 max-w-full rounded-[12px] object-contain"
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
      <div className="space-y-1.5">
        {message.mediaUrl ? (
          <video
            controls
            preload="metadata"
            className="max-h-64 max-w-full rounded-[12px]"
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
      <audio
        controls
        preload="metadata"
        className="my-0.5 max-w-full min-w-[12rem] accent-[var(--ro-plum-700)]"
        src={message.mediaUrl}
      />
    ) : (
      <p className={muted}>{dict.inbox.nonText}</p>
    );
  }

  if (message.messageType === "document") {
    return (
      <div className="space-y-1.5">
        {message.mediaUrl ? (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 font-semibold underline-offset-2 hover:underline",
              isOut
                ? "text-[var(--ro-sand-50)]"
                : "text-[color:var(--ro-accent-fg,var(--ro-plum-700))]"
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

/** A14 — MessageBubble: WhatsApp/Intercom density, theme-aware. */
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
        "group max-w-[min(28rem,85%)] px-3.5 py-2 text-[13.5px] leading-relaxed",
        isOut
          ? "ms-auto rounded-[18px] rounded-ee-[6px] bg-[color:var(--ro-plum-700)] text-[var(--ro-sand-50)] shadow-[0_1px_2px_rgba(20,8,40,0.18)]"
          : "me-auto rounded-[18px] rounded-es-[6px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel,var(--ro-bg-elevated))] text-[color:var(--ro-text)] shadow-[var(--ro-e2)]",
        failed && "ring-1 ring-[color:var(--ro-danger-700)]"
      )}
    >
      <MediaBody message={message} isOut={isOut} dict={dict} />
      <footer
        className={cn(
          "mt-1 flex flex-wrap items-center justify-end gap-1 text-[10.5px] tabular-nums",
          isOut
            ? "text-[color-mix(in_srgb,var(--ro-sand-100)_70%,transparent)]"
            : "text-[color:var(--ro-text-muted)]"
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
            className="ms-1 font-semibold text-[color:var(--ro-danger-700)] underline-offset-2 hover:underline disabled:opacity-60"
          >
            {dict.inbox.retry}
          </button>
        ) : null}
      </footer>
    </article>
  );
}

/** Day separator — compact chip. */
export function MessageDaySeparator({ label }: { label: string }) {
  return (
    <div role="separator" className="flex justify-center py-3">
      <span className="rounded-full border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel,var(--ro-bg-elevated))] px-3 py-1 text-[11px] font-medium text-[color:var(--ro-text-muted)] shadow-[var(--ro-e2)]">
        {label}
      </span>
    </div>
  );
}
