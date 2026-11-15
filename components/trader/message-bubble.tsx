"use client";

import { Check, CheckCheck, CircleAlert, Clock, FileText, Loader, MapPin, MessageCircle } from "lucide-react";
import type { TraderDict } from "@/lib/ui/trader-labels";
import type { InboxMessageItem } from "@/lib/whatsapp/messaging/inbox";
import { cn } from "@/lib/utils";
import { LinkifiedText } from "@/components/ui/linkified-text";

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

function linkCls(isMine: boolean): string {
  return cn(
    "break-all font-semibold underline decoration-[1.5px] underline-offset-[3px] hover:opacity-80",
    isMine ? "text-[#fff3d6] decoration-[#f4d9a6]/70" : "text-[color:var(--rad-ac,#6d3aa6)] decoration-current/50"
  );
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
        {caption ? <p dir="auto" className="whitespace-pre-wrap break-words"><LinkifiedText text={caption} linkClassName={linkCls(isMine)} /></p> : null}
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
    <p dir="auto" className="whitespace-pre-wrap break-words">
      <LinkifiedText text={message.body} linkClassName={linkCls(isMine)} />
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
  // A team reply still queued for WhatsApp has only reached the trader here,
  // on the platform — never label it "via WhatsApp" before it was delivered.
  const waDelivered = ["sent", "delivered", "read", "received"].includes(
    message.status
  );
  const isPlatform =
    message.channel === "platform" || (!isMine && !waDelivered);
  const isAr = /\p{Script=Arabic}/u.test(t.messagesTitle);

  return (
    <article
      className={cn(
        "group relative max-w-[min(30rem,88%)] px-4 py-2.5 text-[14px] leading-[1.75]",
        isMine
          ? // Explicit light-on-plum — portal themes remap --ro-sand-50 to dark surfaces.
            "rad-tmsg-mine ms-auto rounded-[20px] rounded-ee-[6px] bg-gradient-to-br from-[#8a52c4] to-[#5f3390] text-[#fffcf8] shadow-[0_6px_18px_-8px_rgba(60,25,100,0.55)]"
          : "me-auto rounded-[20px] rounded-es-[6px] border border-[color-mix(in_srgb,#c8963e_28%,var(--ro-border))] bg-ro-paper text-ro-ink shadow-[0_4px_14px_-8px_rgba(40,20,70,0.25)]"
      )}
    >
      {!isMine ? (
        <div className="mb-1 flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-cream.png" alt="" className="size-5 shrink-0 rounded-full bg-[var(--ro-plum-900)] p-[3px]" />
          <span className="text-[11.5px] font-semibold text-[var(--ro-plum-700)]">
            {isAr ? "فريق RARE OUD" : "RARE OUD team"}
          </span>
        </div>
      ) : null}

      <MediaBody message={message} isMine={isMine} t={t} />

      <footer
        className={cn(
          "mt-1 flex flex-wrap items-center justify-end gap-1 text-[10.5px] tabular-nums",
          isMine
            ? "text-[color-mix(in_srgb,#fffcf8_78%,transparent)]"
            : "text-ro-muted"
        )}
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-1.5 py-px text-[10px]">
          {isPlatform ? (
            <MessageCircle className="size-2.5" strokeWidth={1.75} aria-hidden />
          ) : null}
          {isPlatform ? t.messagesChannelPlatform : t.messagesChannelWhatsapp}
        </span>
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
