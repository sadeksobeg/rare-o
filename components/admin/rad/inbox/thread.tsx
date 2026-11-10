"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  Ellipsis,
  Guitar,
  Info,
  LoaderCircle,
  MessageSquareText,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  StickyNote,
  UserRound,
  WifiOff,
  Zap,
} from "lucide-react";
import type { InboxConversationDetail, InboxHealthView, InboxMessageItem } from "@/lib/whatsapp/messaging/inbox";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatDate, formatDayKey } from "@/lib/i18n/format";
import { plural } from "@/lib/i18n/plural";
import { formatMaskedPhone } from "@/lib/whatsapp/messaging/phone-format";
import { humanizeMessageBody } from "@/lib/whatsapp/messaging/preview-label";
import { inboxPreviewLabels } from "@/lib/whatsapp/messaging/preview-labels-from-dict";
import { RadAvatar } from "@/components/admin/rad/inbox/rad-avatar";
import { useInboxUi } from "@/components/admin/rad/inbox/inbox-shell";
import { adminAddInboxNoteAction, adminSendWhatsAppTextAction } from "@/app/whatsapp-actions";
import { cn } from "@/lib/utils";

type Mode = "reply" | "note";

function timeOf(m: InboxMessageItem, locale: Locale): string {
  const iso = m.waTimestamp ?? m.createdAt;
  return formatDate(iso, locale, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function RadThread({
  conversation,
  health,
  dict,
  locale,
  quickReplies,
}: {
  conversation: InboxConversationDetail;
  health: InboxHealthView;
  dict: Dictionary;
  locale: Locale;
  quickReplies: { title: string; body: string }[];
}) {
  const ib = dict.ib;
  const router = useRouter();
  const { setCtxOpen } = useInboxUi();
  const [mode, setMode] = useState<Mode>("reply");
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [qrOpen, setQrOpen] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const title = conversation.name || formatMaskedPhone(conversation.participantE164) || conversation.displayLabel;
  const maskedPhone = formatMaskedPhone(conversation.participantE164);

  const sendingPaused = health.state === "CONNECTED" && !health.outboundEnabled;
  const whatsappDown =
    health.state === "DISCONNECTED" ||
    health.state === "ERROR" ||
    health.state === "AUTHENTICATION_REQUIRED" ||
    health.state === "CONNECTING" ||
    health.state === "RECONNECTING";
  // Media has nowhere to go without a real connection; text still works —
  // adminSendWhatsAppTextAction falls back to the internal platform channel
  // when the kill switch is off or WhatsApp is down (existing behavior,
  // preserved as-is, not reinvented here).
  const mediaBlocked = sendingPaused || whatsappDown;

  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation.id, conversation.messages.length]);

  const rows = useMemo(() => {
    const out: React.ReactNode[] = [];
    let lastDay: string | null = null;
    const unreadFrom = conversation.unreadCount > 0 ? conversation.messages.length - conversation.unreadCount : -1;
    conversation.messages.forEach((m, i) => {
      const day = formatDayKey(new Date(m.waTimestamp ?? m.createdAt));
      if (day !== lastDay) {
        lastDay = day;
        out.push(
          <div className="rad-dsep" key={`d-${m.id}`}>
            {formatDate(m.waTimestamp ?? m.createdAt, locale, { weekday: "long", day: "numeric", month: "long" })}
          </div>
        );
      }
      if (i === unreadFrom && m.direction === "inbound") {
        out.push(
          <div className="rad-nsep" key={`n-${m.id}`}>
            {plural(conversation.unreadCount, locale, {
              zero: ib.newMessagesZero,
              one: ib.newMessagesOne,
              two: ib.newMessagesTwo,
              few: ib.newMessagesFew,
              many: ib.newMessagesMany,
              other: ib.newMessagesOther,
            })}
          </div>
        );
      }
      out.push(<Bubble key={m.id} m={m} i={i} locale={locale} ib={ib} />);
    });
    return out;
  }, [conversation.messages, conversation.unreadCount, ib, locale]);

  function sendReply() {
    const v = text.trim();
    if (!v || pending) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("conversationId", conversation.id);
      fd.set("text", v);
      const result = await adminSendWhatsAppTextAction(fd);
      if (!result.ok) {
        toast.error(dict.inbox.sendFailed);
        return;
      }
      setText("");
      router.refresh();
    });
  }

  function saveNote() {
    const v = text.trim();
    if (!v || pending) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("conversationId", conversation.id);
      fd.set("body", v);
      const result = await adminAddInboxNoteAction(fd);
      if (!result.ok) {
        toast.error(dict.inbox.sendFailed);
        return;
      }
      setText("");
      router.refresh();
    });
  }

  const placeholder =
    mode === "note"
      ? ib.composerNotePlaceholder
      : ib.composerReplyPlaceholder;

  return (
    <>
      <section className="rad-ct" aria-label={dict.inbox.title}>
        <div className="rad-th">
          <Link href="/admin/inbox" className="rad-ib rad-backb" aria-label={ib.backToList}>
            <ChevronRight width={20} height={20} strokeWidth={1.5} aria-hidden style={{ transform: locale === "ar" ? "scaleX(-1)" : undefined }} />
          </Link>
          <RadAvatar id={conversation.id} name={conversation.name} size="sm" />
          <div className="rad-tt">
            <b>{conversation.name ? title : <bdi dir="ltr">{title}</bdi>}</b>
            <small>
              <bdi dir="ltr">{maskedPhone ?? ""}</bdi>
              {conversation.link.linked ? (
                <span className="rad-chipl rad-ok">
                  {linkTypeLabel(conversation.link.linkType, dict)} <bdi dir="ltr">{conversation.link.linkId}</bdi>
                </span>
              ) : (
                <span className="rad-chipl rad-no">{dict.inbox.notLinked}</span>
              )}
            </small>
          </div>
          <div className="rad-acts">
            <button type="button" className="rad-ib" data-tip={ib.searchInThread} aria-label={ib.searchInThread} disabled>
              <Search width={18} height={18} strokeWidth={1.5} aria-hidden />
            </button>
            <button
              type="button"
              className="rad-ib rad-ctxbtn"
              id="ctxb"
              data-tip={ib.moreInfo}
              aria-label={ib.moreInfo}
              onClick={() => setCtxOpen((v) => !v)}
            >
              <UserRound width={18} height={18} strokeWidth={1.5} aria-hidden />
            </button>
            <button type="button" className="rad-ib" data-tip={ib.moreActions} aria-label={ib.moreActions} disabled>
              <Ellipsis width={18} height={18} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>

        {sendingPaused && !whatsappDown ? (
          <div className="rad-bn rad-warn" role="status">
            <Info width={18} height={18} strokeWidth={1.5} aria-hidden />
            <span>{ib.bannerOutboundOff}</span>
          </div>
        ) : null}
        {health.state === "RECONNECTING" || health.state === "CONNECTING" ? (
          <div className="rad-bn rad-warn" role="status">
            <span className="rad-spin">
              <LoaderCircle width={18} height={18} strokeWidth={1.5} aria-hidden />
            </span>
            <span>{ib.bannerReconnecting}</span>
          </div>
        ) : null}
        {health.state === "DISCONNECTED" || health.state === "ERROR" || health.state === "AUTHENTICATION_REQUIRED" ? (
          <div className="rad-bn rad-err" role="alert">
            <WifiOff width={18} height={18} strokeWidth={1.5} aria-hidden />
            <span>{ib.bannerDisconnected}</span>
          </div>
        ) : null}

        <div className="rad-msgs" id="msgs" ref={msgsRef}>
          {conversation.messages.length === 0 ? (
            <div className="rad-ept rad-ept-thread">
              <div>
                <div className="rad-rg">
                  <svg viewBox="0 0 150 150" fill="none" stroke="currentColor">
                    <circle cx="75" cy="75" r="26" />
                    <circle cx="75" cy="75" r="46" />
                    <circle cx="75" cy="75" r="68" />
                  </svg>
                  <i>
                    <MessageSquareText width={30} height={30} strokeWidth={1.5} aria-hidden />
                  </i>
                </div>
                <b>{ib.threadEmptyTitle}</b>
                <p>{ib.threadEmptyBody}</p>
              </div>
            </div>
          ) : (
            rows
          )}
        </div>

        <div className="rad-cmp">
          <div className={cn("rad-cbx", mode === "note" && "rad-isnote")}>
            <div className="rad-ctabs">
              <button type="button" className={cn(mode === "reply" && "rad-on")} onClick={() => setMode("reply")}>
                <Send width={14} height={14} strokeWidth={1.5} aria-hidden />
                {ib.composerReplyTab}
              </button>
              <button type="button" className={cn(mode === "note" && "rad-on")} onClick={() => setMode("note")}>
                <StickyNote width={14} height={14} strokeWidth={1.5} aria-hidden />
                {ib.composerNoteTab}
              </button>
              <span className="sp" />
            </div>
            <textarea
              ref={taRef}
              rows={1}
              placeholder={placeholder}
              value={text}
              disabled={pending}
              aria-label={placeholder}
              onChange={(e) => {
                setText(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${Math.min(140, el.scrollHeight)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (mode === "reply") sendReply();
                  else saveNote();
                }
              }}
            />
            <div className="rad-cbr">
              <button type="button" className="rad-ib" data-tip={ib.attachLabel} aria-label={ib.attachLabel} disabled={mediaBlocked}>
                <Paperclip width={18} height={18} strokeWidth={1.5} aria-hidden />
              </button>
              {mode === "reply" ? (
                <button
                  type="button"
                  className="rad-ib"
                  data-tip={ib.quickRepliesLabel}
                  aria-label={ib.quickRepliesLabel}
                  onClick={() => setQrOpen((v) => !v)}
                >
                  <Zap width={18} height={18} strokeWidth={1.5} aria-hidden />
                </button>
              ) : null}
              <span className="sp" />
              <span className="rad-hint">{ib.composerSendHint}</span>
              <button
                type="button"
                className="rad-sendb"
                disabled={!text.trim() || pending}
                onClick={mode === "reply" ? sendReply : saveNote}
              >
                {mode === "note" ? ib.saveNoteButton : ib.sendButton}
                <Send width={16} height={16} strokeWidth={1.5} aria-hidden />
              </button>
            </div>
          </div>
          {qrOpen && mode === "reply" ? (
            <div className="rad-qm rad-on" style={{ position: "static", marginTop: 8 }}>
              {quickReplies.map((qr) => (
                <button
                  key={qr.title}
                  type="button"
                  onClick={() => {
                    setText(qr.body);
                    setQrOpen(false);
                    taRef.current?.focus();
                  }}
                >
                  <b>{qr.title}</b>
                  {qr.body}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

function linkTypeLabel(linkType: string, dict: Dictionary): string {
  if (linkType === "retail_request") return dict.inbox.typeRetail;
  if (linkType === "deal_proposal") return dict.inbox.typeDeal;
  if (linkType === "wholesale_request") return dict.inbox.typeWholesale;
  if (linkType === "brokerage_request") return dict.inbox.typeBrokerage;
  return dict.inbox.notLinked;
}

function Bubble({ m, i, locale, ib }: { m: InboxMessageItem; i: number; locale: Locale; ib: Dictionary["ib"] }) {
  const labels = inboxPreviewLabels(ib);
  if (m.messageType === "system") {
    return (
      <div className="rad-sysm" key={m.id}>
        <ShieldCheck width={14} height={14} strokeWidth={1.5} aria-hidden />
        {humanizeMessageBody(m.body, m.messageType, m.caption, labels)}
      </div>
    );
  }
  const isOut = m.direction === "outbound";
  const bodyLabel = humanizeMessageBody(m.body, m.messageType, m.caption, labels);
  const tick =
    !isOut
      ? null
      : m.status === "sent"
        ? <Check width={14} height={14} strokeWidth={1.5} aria-label={ib.readSent} />
        : m.status === "failed"
          ? null
          : (
              <span className="rad-spin">
                <LoaderCircle width={14} height={14} strokeWidth={1.5} aria-label={ib.readSent} />
              </span>
            );
  return (
    <div className={cn("rad-bb", isOut ? "rad-out" : "rad-in", m.status === "failed" && "rad-bb-failed")} style={{ "--rad-i": i } as React.CSSProperties}>
      {bodyLabel !== labels.empty ? bodyLabel : null}
      {m.mediaUrl ? (
        <div className="rad-pc">
          <div className="rad-im">
            <Guitar width={24} height={24} strokeWidth={1.5} aria-hidden />
          </div>
          <div>
            <b>{m.mediaFileName || m.mediaMime || bodyLabel}</b>
          </div>
        </div>
      ) : null}
      <div className="rad-bm">
        {timeOf(m, locale)}
        {tick}
      </div>
    </div>
  );
}
