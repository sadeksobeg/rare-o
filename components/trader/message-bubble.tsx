"use client";

import { Check, CheckCheck, CircleAlert, Clock, FileText, Loader, MapPin, MessageCircle, UserRound } from "lucide-react";
import type { TraderDict } from "@/lib/ui/trader-labels";
import type { InboxMessageItem } from "@/lib/whatsapp/messaging/inbox";
import { cn } from "@/lib/utils";

function DeliveryIcon({ status }: { status: string }) {
  const cls = "size-3 shrink-0 opacity-70";
  switch (status) {
    case "pending":
      return <Clock className={cls} aria-hidden />;
    case "sending":
      return <Loader className={cn(cls, "animate-spin")} aria-hidden />;
    case "sent":
      return <Check className={cls} aria-hidden />;
    case "delivered":
      return <CheckCheck className={cls} aria-hidden />;
    case "read":
      return <CheckCheck className="size-3 shrink-0 opacity-100" aria-hidden />;
    case "failed":
      return (
        <CircleAlert
          className="size-3 shrink-0 text-[color:var(--ro-danger-700)]"
          aria-hidden
        />
      );
    default:
      return null;
  }
}

function MediaBody({
  message,
  isMine,
  t,
}: {
  message: InboxMessageItem;
  isMine: boolean;
  t: TraderDict;
}) {
  const muted = isMine
    ? "text-[color-mix(in_srgb,#fffcf8_78%,transparent)]"
    : "text-ro-muted";
  const caption = message.caption?.trim() || null;

  if (message.whatsappMediaUnavailable) {
    return (
      <p className={cn("inline-flex items-center gap-1.5 font-medium", muted)}>
        <FileText className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        {t.messagesWhatsappMediaUnavailable}
      </p>
    );
  }

  if (message.messageType === "image" || message.messageType === "sticker") {
    return (
      <div className="space-y-1.5">
        {message.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- private trader-scoped media URL
          <img
            src={message.mediaUrl}
            alt=""
            className="max-h-64 max-w-full rounded-[12px] object-contain"
          />
        ) : (
          <p className={muted}>{t.messagesChannelPlatform}</p>
        )}
        {caption ? <p className="whitespace-pre-wrap break-words"><bdi>{caption}</bdi></p> : null}
      </div>
    );
  }

  if (message.messageType === "video") {
    return message.mediaUrl ? (
      <video
        controls
        preload="metadata"
        className="max-h-64 max-w-full rounded-[12px]"
        src={message.mediaUrl}
      />
    ) : null;
  }

  if (message.messageType === "audio") {
    return message.mediaUrl ? (
      <audio
        controls
        preload="metadata"
        className="my-0.5 max-w-full min-w-[12rem]"
        src={message.mediaUrl}
      />
    ) : null;
  }

  if (message.messageType === "document") {
    return message.mediaUrl ? (
      <a
        href={message.mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-2 font-semibold underline-offset-2 hover:underline",
          isMine ? "text-[#fffcf8]" : "text-ro-plum"
        )}
      >
        <FileText className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        <bdi>{message.mediaFileName || "—"}</bdi>
      </a>
    ) : null;
  }

  if (message.messageType === "location") {
    return (
      <p className={cn("inline-flex items-center gap-1.5", muted)}>
        <MapPin className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        <bdi dir="ltr">Location</bdi>
      </p>
    );
  }

  return (
    <p className="whitespace-pre-wrap break-words">
      <bdi>{message.body}</bdi>
    </p>
  );
}

/** Trader-portal message bubble — direction flipped vs. the admin inbox:
 * "inbound" (trader → admin) is the self/plum bubble here. */
export function TraderMessageBubble({
  message,
  timeLabel,
  t,
}: {
  message: InboxMessageItem;
  timeLabel: string;
  t: TraderDict;
}) {
  const isMine = message.direction === "inbound";
  const isPlatform = message.channel === "platform";

  return (
    <article
      className={cn(
        "group max-w-[min(28rem,85%)] px-3.5 py-2 text-[13.5px] leading-relaxed",
        isMine
          ? // Explicit light-on-plum — portal themes remap --ro-sand-50 to dark surfaces.
            "rad-tmsg-mine ms-auto rounded-[18px] rounded-ee-[6px] bg-[#7a44b3] text-[#fffcf8] shadow-[0_1px_2px_rgba(20,8,40,0.18)]"
          : "me-auto rounded-[18px] rounded-es-[6px] border border-ro-border bg-ro-paper text-ro-ink shadow-sm"
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
            isMine ? "bg-[color-mix(in_srgb,var(--ro-sand-50)_18%,transparent)]" : "bg-ro-sunken"
          )}
          aria-hidden
        >
          {isMine ? (
            <UserRound className="size-3" strokeWidth={1.5} />
          ) : (
            <MessageCircle className="size-3" strokeWidth={1.5} />
          )}
        </span>
        <span
          className={cn(
            "text-[10px] font-medium",
            isMine
              ? "text-[color-mix(in_srgb,#fffcf8_78%,transparent)]"
              : "text-ro-muted"
          )}
        >
          {isPlatform ? t.messagesChannelPlatform : t.messagesChannelWhatsapp}
        </span>
      </div>

      <MediaBody message={message} isMine={isMine} t={t} />

      <footer
        className={cn(
          "mt-1 flex flex-wrap items-center justify-end gap-1 text-[10.5px] tabular-nums",
          isMine
            ? "text-[color-mix(in_srgb,#fffcf8_78%,transparent)]"
            : "text-ro-muted"
        )}
      >
        <time dateTime={message.waTimestamp ?? message.createdAt}>{timeLabel}</time>
        {isMine ? <DeliveryIcon status={message.status} /> : null}
      </footer>
    </article>
  );
}

export function TraderMessageDaySeparator({ label }: { label: string }) {
  return (
    <div role="separator" className="flex justify-center py-3">
      <span className="rounded-full border border-ro-border bg-ro-paper px-3 py-1 text-[11px] font-medium text-ro-muted shadow-sm">
        {label}
      </span>
    </div>
  );
}
