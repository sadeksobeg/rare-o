"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock,
  Copy,
  EyeOff,
  Info,
  LoaderCircle,
  MessageSquareText,
  OctagonX,
  Reply,
  Search,
  Send,
  ShieldCheck,
  StickyNote,
  UserRound,
  WifiOff,
  Zap,
} from "lucide-react";
import type {
  InboxConversationDetail,
  InboxHealthView,
  InboxMessageItem,
} from "@/lib/whatsapp/messaging/inbox";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatDate, formatDayKey } from "@/lib/i18n/format";
import { plural } from "@/lib/i18n/plural";
import { humanizeMessageBody } from "@/lib/whatsapp/messaging/preview-label";
import { inboxPreviewLabels } from "@/lib/whatsapp/messaging/preview-labels-from-dict";
import { RadAvatar } from "@/components/admin/rad/inbox/rad-avatar";
import { useInboxUi } from "@/components/admin/rad/inbox/inbox-shell";
import { useInboxEvents } from "@/components/admin/rad/inbox/use-inbox-events";
import { KillSwitchBannerText } from "@/components/admin/rad/inbox/kill-switch-banner-text";
import { ThreadOverflowMenu } from "@/components/admin/rad/inbox/thread-overflow-menu";
import {
  ThreadSearch,
  useThreadSearchHotkey,
} from "@/components/admin/rad/inbox/thread-search";
import { AttachMenu } from "@/components/admin/rad/inbox/attach-menu";
import { EmojiPicker } from "@/components/admin/rad/inbox/emoji-picker";
import {
  MediaPreviewDialog,
  validateOutboundMedia,
  type PendingMedia,
} from "@/components/admin/rad/inbox/media-preview-dialog";
import { VoiceRecorder } from "@/components/admin/rad/inbox/voice-recorder";
import { QuickRepliesPanel } from "@/components/admin/rad/inbox/quick-replies-panel";
import {
  MediaBubbleBody,
  isRenderableMediaType,
} from "@/components/admin/rad/inbox/media-bubble-body";
import {
  adminAddInboxNoteAction,
  adminGetComposerDraftAction,
  adminHideInboxMessageAction,
  adminRetryWhatsAppMessageAction,
  adminSaveComposerDraftAction,
  adminSendWhatsAppMediaAction,
  adminSendWhatsAppTextAction,
} from "@/app/whatsapp-actions";
import { cn } from "@/lib/utils";

type Mode = "reply" | "note";

function newClientRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function timeOf(m: InboxMessageItem, locale: Locale): string {
  const iso = m.waTimestamp ?? m.createdAt;
  return formatDate(iso, locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function emptyMediaFields(): Pick<
  InboxMessageItem,
  | "mediaSize"
  | "mediaDurationSec"
  | "thumbnailUrl"
  | "isPtt"
  | "replyTo"
> {
  return {
    mediaSize: null,
    mediaDurationSec: null,
    thumbnailUrl: null,
    isPtt: false,
    replyTo: null,
  };
}

export function RadThread({
  conversation,
  health,
  dict,
  locale,
}: {
  conversation: InboxConversationDetail;
  health: InboxHealthView;
  dict: Dictionary;
  locale: Locale;
}) {
  const ib = dict.ib;
  const router = useRouter();
  const { setCtxOpen } = useInboxUi();
  const [mode, setMode] = useState<Mode>("reply");
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [qrOpen, setQrOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<InboxMessageItem | null>(null);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [mediaSending, setMediaSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [optimistic, setOptimistic] = useState<InboxMessageItem[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>(
    {}
  );
  const [draftReady, setDraftReady] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const draftTimer = useRef<number | null>(null);
  const stickToBottom = useRef(true);

  const title =
    conversation.name ||
    conversation.participantE164 ||
    conversation.displayLabel;
  const maskedPhone = conversation.participantE164;

  const sendingPaused = health.state === "CONNECTED" && !health.outboundEnabled;
  const whatsappDown =
    health.state === "DISCONNECTED" ||
    health.state === "ERROR" ||
    health.state === "AUTHENTICATION_REQUIRED" ||
    health.state === "CONNECTING" ||
    health.state === "RECONNECTING";
  const mediaBlocked =
    sendingPaused ||
    whatsappDown ||
    conversation.blocked ||
    conversation.archived;

  const openSearch = useCallback(() => setSearchOpen(true), []);
  useThreadSearchHotkey(openSearch, true);

  useEffect(() => {
    const known = new Set(
      conversation.messages
        .map((m) => m.clientRequestId)
        .filter((v): v is string => Boolean(v))
    );
    setOptimistic((prev) =>
      prev.filter((m) => !m.clientRequestId || !known.has(m.clientRequestId))
    );
  }, [conversation.messages]);

  useEffect(() => {
    setOptimistic([]);
    setStatusOverrides({});
    setReplyTo(null);
    setText("");
    setDraftReady(false);
    setQrOpen(false);
    setSearchOpen(false);
    stickToBottom.current = true;
  }, [conversation.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await adminGetComposerDraftAction(conversation.id);
      if (cancelled || !res.ok) {
        setDraftReady(true);
        return;
      }
      const draft = res.data;
      if (draft?.body) setText(draft.body);
      if (draft?.replyToMessageId) {
        const hit = conversation.messages.find(
          (m) => m.id === draft.replyToMessageId
        );
        if (hit) setReplyTo(hit);
      }
      setDraftReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [conversation.id, conversation.messages]);

  useEffect(() => {
    if (!draftReady) return;
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      const fd = new FormData();
      fd.set("conversationId", conversation.id);
      fd.set("body", text);
      if (replyTo) fd.set("replyToMessageId", replyTo.id);
      void adminSaveComposerDraftAction(fd);
    }, 600);
    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
  }, [text, replyTo, conversation.id, draftReady]);

  useEffect(() => {
    const el = msgsRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [conversation.id, conversation.messages.length, optimistic.length]);

  useInboxEvents({
    onMessageStatus: (p) => {
      if (p.conversationId && p.conversationId !== conversation.id) return;
      if (p.messageId && p.status) {
        setStatusOverrides((prev) => ({ ...prev, [p.messageId!]: p.status! }));
      }
      if (p.clientRequestId && p.status) {
        setOptimistic((prev) =>
          prev.map((m) =>
            m.clientRequestId === p.clientRequestId
              ? { ...m, status: p.status!, id: p.messageId || m.id }
              : m
          )
        );
      }
    },
    onMessageNew: (p) => {
      if (p.conversationId === conversation.id) {
        router.refresh();
      }
    },
  });

  const mergedMessages = useMemo(() => {
    const byId = new Map<string, InboxMessageItem>();
    for (const m of conversation.messages) {
      const status = statusOverrides[m.id] ?? m.status;
      byId.set(m.id, { ...m, status });
    }
    for (const m of optimistic) {
      if (m.clientRequestId) {
        const serverHit = conversation.messages.find(
          (s) => s.clientRequestId === m.clientRequestId
        );
        if (serverHit) continue;
      }
      byId.set(m.id, m);
    }
    return Array.from(byId.values()).sort((a, b) => {
      const ta = new Date(a.waTimestamp ?? a.createdAt).getTime();
      const tb = new Date(b.waTimestamp ?? b.createdAt).getTime();
      return ta - tb;
    });
  }, [conversation.messages, optimistic, statusOverrides]);

  function onMsgsScroll() {
    const el = msgsRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = dist < 80;
    setShowJump(dist > 240);
  }

  function jumpLatest() {
    const el = msgsRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    stickToBottom.current = true;
    setShowJump(false);
  }

  function queueFile(file: File) {
    const check = validateOutboundMedia(file, ib);
    if (!check.ok) {
      toast.error(check.error);
      return;
    }
    if (pendingMedia?.objectUrl) URL.revokeObjectURL(pendingMedia.objectUrl);
    setPendingMedia({ file, objectUrl: URL.createObjectURL(file) });
  }

  function clearPendingMedia() {
    if (pendingMedia?.objectUrl) URL.revokeObjectURL(pendingMedia.objectUrl);
    setPendingMedia(null);
  }

  function sendMedia(caption: string, file?: File, durationSec?: number, isPtt?: boolean) {
    const f = file ?? pendingMedia?.file;
    if (!f || mediaBlocked) return;
    const clientRequestId = newClientRequestId();
    const nowIso = new Date().toISOString();
    const kindGuess = f.type.startsWith("image/")
      ? "image"
      : f.type.startsWith("video/")
        ? "video"
        : f.type.startsWith("audio/")
          ? "audio"
          : "document";
    const optimisticRow: InboxMessageItem = {
      id: `opt-${clientRequestId}`,
      direction: "outbound",
      channel: "whatsapp",
      messageType: kindGuess,
      body: caption || "",
      caption: caption || null,
      mediaMime: f.type || null,
      mediaFileName: f.name || null,
      mediaUrl: pendingMedia?.objectUrl ?? null,
      status: "sending",
      errorSafe: null,
      clientRequestId,
      waTimestamp: nowIso,
      createdAt: nowIso,
      ...emptyMediaFields(),
      mediaSize: f.size,
      mediaDurationSec: durationSec ?? null,
      isPtt: Boolean(isPtt),
      replyTo: replyTo
        ? {
            id: replyTo.id,
            body: (replyTo.caption || replyTo.body || "").slice(0, 120),
            messageType: replyTo.messageType,
            direction: replyTo.direction,
          }
        : null,
    };
    setOptimistic((prev) => [...prev, optimisticRow]);
    setMediaSending(true);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("conversationId", conversation.id);
      fd.set("clientRequestId", clientRequestId);
      fd.set("file", f);
      if (caption) fd.set("caption", caption);
      if (replyTo) fd.set("replyToMessageId", replyTo.id);
      if (isPtt) fd.set("isPtt", "true");
      if (durationSec != null) fd.set("durationSec", String(durationSec));
      const result = await adminSendWhatsAppMediaAction(fd);
      setMediaSending(false);
      clearPendingMedia();
      setReplyTo(null);
      if (!result.ok) {
        setOptimistic((prev) =>
          prev.map((m) =>
            m.clientRequestId === clientRequestId
              ? { ...m, status: "failed", errorSafe: result.error || "failed" }
              : m
          )
        );
        toast.error(
          result.error === "MEDIA_TOO_LARGE"
            ? ib.mediaTooLarge
            : result.error === "BAD_MIME"
              ? ib.mediaBadType
              : ib.mediaSendFailed
        );
        return;
      }
      router.refresh();
    });
  }

  const rows = useMemo(() => {
    const out: React.ReactNode[] = [];
    let lastDay: string | null = null;
    const unreadFrom =
      conversation.unreadCount > 0
        ? mergedMessages.length - conversation.unreadCount
        : -1;
    mergedMessages.forEach((m, i) => {
      const day = formatDayKey(new Date(m.waTimestamp ?? m.createdAt));
      if (day !== lastDay) {
        lastDay = day;
        out.push(
          <div className="rad-dsep" key={`d-${m.id}`}>
            {formatDate(m.waTimestamp ?? m.createdAt, locale, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
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
      out.push(
        <Bubble
          key={m.id}
          m={m}
          i={i}
          locale={locale}
          ib={ib}
          inbox={dict.inbox}
          onReply={() => {
            setReplyTo(m);
            setMode("reply");
            taRef.current?.focus();
          }}
          onCopy={async () => {
            const raw = (m.caption || m.body || "").trim();
            if (!raw) return;
            try {
              await navigator.clipboard.writeText(raw);
              toast.success(ib.messageCopied);
            } catch {
              toast.error(ib.actionFailed);
            }
          }}
          onHide={() => {
            startTransition(async () => {
              const fd = new FormData();
              fd.set("messageId", m.id);
              const result = await adminHideInboxMessageAction(fd);
              if (!result.ok) {
                toast.error(ib.actionFailed);
                return;
              }
              toast.success(ib.hiddenForMe);
              router.refresh();
            });
          }}
          onRetry={
            m.status === "failed" && m.direction === "outbound"
              ? () => {
                  startTransition(async () => {
                    const fd = new FormData();
                    fd.set("messageId", m.id);
                    const result = await adminRetryWhatsAppMessageAction(fd);
                    if (!result.ok) {
                      toast.error(dict.inbox.sendFailed);
                      return;
                    }
                    setStatusOverrides((prev) => ({
                      ...prev,
                      [m.id]: "pending",
                    }));
                    router.refresh();
                  });
                }
              : undefined
          }
        />
      );
    });
    return out;
  }, [
    mergedMessages,
    conversation.unreadCount,
    dict.inbox,
    ib,
    locale,
    router,
  ]);

  function sendReply() {
    const v = text.trim();
    if (!v || pending) return;
    const clientRequestId = newClientRequestId();
    const nowIso = new Date().toISOString();
    const optimisticRow: InboxMessageItem = {
      id: `opt-${clientRequestId}`,
      direction: "outbound",
      channel: "whatsapp",
      messageType: "text",
      body: v,
      caption: null,
      mediaMime: null,
      mediaFileName: null,
      mediaUrl: null,
      status: "sending",
      errorSafe: null,
      clientRequestId,
      waTimestamp: nowIso,
      createdAt: nowIso,
      ...emptyMediaFields(),
      replyTo: replyTo
        ? {
            id: replyTo.id,
            body: (replyTo.caption || replyTo.body || "").slice(0, 120),
            messageType: replyTo.messageType,
            direction: replyTo.direction,
          }
        : null,
    };
    setOptimistic((prev) => [...prev, optimisticRow]);
    setText("");
    const replyId = replyTo?.id ?? null;
    setReplyTo(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("conversationId", conversation.id);
      fd.set("text", v);
      fd.set("clientRequestId", clientRequestId);
      if (replyId) fd.set("replyToMessageId", replyId);
      const result = await adminSendWhatsAppTextAction(fd);
      if (!result.ok) {
        setOptimistic((prev) =>
          prev.map((m) =>
            m.clientRequestId === clientRequestId
              ? { ...m, status: "failed", errorSafe: result.error || "failed" }
              : m
          )
        );
        toast.error(dict.inbox.sendFailed);
        return;
      }
      const messageId = result.data?.messageId;
      if (messageId) {
        setOptimistic((prev) =>
          prev.map((m) =>
            m.clientRequestId === clientRequestId
              ? {
                  ...m,
                  id: messageId,
                  status: result.data?.status || "pending",
                }
              : m
          )
        );
      }
      const clearFd = new FormData();
      clearFd.set("conversationId", conversation.id);
      clearFd.set("body", "");
      void adminSaveComposerDraftAction(clearFd);
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
    mode === "note" ? ib.composerNotePlaceholder : ib.composerReplyPlaceholder;

  const requestRef = conversation.link.linked ? conversation.link.linkId : null;

  return (
    <>
      <section
        className={cn("rad-ct", dragOver && "rad-ct-drop")}
        aria-label={dict.inbox.title}
        onDragEnter={(e) => {
          if (mediaBlocked) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          if (mediaBlocked) return;
          e.preventDefault();
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (mediaBlocked) return;
          const file = e.dataTransfer.files?.[0];
          if (file) queueFile(file);
        }}
        onPaste={(e) => {
          if (mediaBlocked || mode !== "reply") return;
          const items = e.clipboardData?.items;
          if (!items) return;
          for (const item of items) {
            if (item.kind === "file") {
              const file = item.getAsFile();
              if (file) {
                e.preventDefault();
                queueFile(file);
                break;
              }
            }
          }
        }}
      >
        <div className="rad-th">
          <Link
            href="/admin/inbox"
            className="rad-ib rad-backb"
            aria-label={ib.backToList}
          >
            <ChevronRight
              width={20}
              height={20}
              strokeWidth={1.5}
              aria-hidden
              style={{
                transform: locale === "ar" ? "scaleX(-1)" : undefined,
              }}
            />
          </Link>
          <RadAvatar id={conversation.id} name={conversation.name} size="sm" />
          <div className="rad-tt">
            <b>
              {conversation.name ? title : <bdi dir="ltr">{title}</bdi>}
            </b>
            <small>
              <bdi dir="ltr">{maskedPhone ?? ""}</bdi>
              {conversation.link.linked ? (
                <span className="rad-chipl rad-ok">
                  {linkTypeLabel(conversation.link.linkType, dict)}{" "}
                  <bdi dir="ltr">{conversation.link.linkId}</bdi>
                </span>
              ) : (
                <span className="rad-chipl rad-no">{dict.inbox.notLinked}</span>
              )}
              {conversation.muted ? (
                <span className="rad-chipl">{ib.mute8h}</span>
              ) : null}
              {conversation.blocked ? (
                <span className="rad-chipl rad-no">{ib.blockContact}</span>
              ) : null}
            </small>
          </div>
          <div className="rad-acts">
            <button
              type="button"
              className="rad-ib"
              data-tip={ib.searchInThread}
              aria-label={ib.searchInThread}
              onClick={() => setSearchOpen((v) => !v)}
            >
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
            <ThreadOverflowMenu conversation={conversation} ib={ib} />
          </div>
        </div>

        <ThreadSearch
          open={searchOpen}
          onOpenChange={setSearchOpen}
          messages={mergedMessages}
          ib={ib}
          containerRef={msgsRef}
        />

        {health.outboundKillSwitch ? (
          <div className="rad-bn rad-err" role="alert">
            <OctagonX width={18} height={18} strokeWidth={1.5} aria-hidden />
            <KillSwitchBannerText
              ib={ib}
              locale={locale}
              by={health.outboundKillSwitchBy}
              at={health.outboundKillSwitchAt}
              reason={health.outboundKillSwitchReason}
            />
          </div>
        ) : sendingPaused && !whatsappDown ? (
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
        {health.state === "DISCONNECTED" ||
        health.state === "ERROR" ||
        health.state === "AUTHENTICATION_REQUIRED" ? (
          <div className="rad-bn rad-err" role="alert">
            <WifiOff width={18} height={18} strokeWidth={1.5} aria-hidden />
            <span>{ib.bannerDisconnected}</span>
          </div>
        ) : null}

        <div
          className="rad-msgs"
          id="msgs"
          ref={msgsRef}
          onScroll={onMsgsScroll}
        >
          {conversation.messages.length === 0 && optimistic.length === 0 ? (
            <div className="rad-ept rad-ept-thread">
              <div>
                <div className="rad-rg">
                  <svg viewBox="0 0 150 150" fill="none" stroke="currentColor">
                    <circle cx="75" cy="75" r="26" />
                    <circle cx="75" cy="75" r="46" />
                    <circle cx="75" cy="75" r="68" />
                  </svg>
                  <i>
                    <MessageSquareText
                      width={30}
                      height={30}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </i>
                </div>
                <b>{ib.threadEmptyTitle}</b>
                <p>{ib.threadEmptyBody}</p>
              </div>
            </div>
          ) : (
            rows
          )}
          {dragOver ? (
            <div className="rad-drop-hint" aria-hidden>
              {ib.dropToAttach}
            </div>
          ) : null}
        </div>

        {showJump ? (
          <button
            type="button"
            className="rad-jump"
            onClick={jumpLatest}
            aria-label={ib.jumpToLatest}
          >
            <ChevronDown width={16} height={16} strokeWidth={1.5} aria-hidden />
            {ib.jumpToLatest}
          </button>
        ) : null}

        <div className="rad-cmp">
          {replyTo && mode === "reply" ? (
            <div className="rad-quote-strip">
              <Reply width={14} height={14} strokeWidth={1.5} aria-hidden />
              <div>
                <b>{ib.replyToMessage}</b>
                <span>
                  {(replyTo.caption || replyTo.body || replyTo.messageType).slice(
                    0,
                    120
                  )}
                </span>
              </div>
              <button
                type="button"
                className="rad-ib"
                aria-label={ib.cancelReply}
                onClick={() => setReplyTo(null)}
              >
                ×
              </button>
            </div>
          ) : null}
          <div className={cn("rad-cbx", mode === "note" && "rad-isnote")}>
            <div className="rad-ctabs">
              <button
                type="button"
                className={cn(mode === "reply" && "rad-on")}
                onClick={() => setMode("reply")}
              >
                <Send width={14} height={14} strokeWidth={1.5} aria-hidden />
                {ib.composerReplyTab}
              </button>
              <button
                type="button"
                className={cn(mode === "note" && "rad-on")}
                onClick={() => setMode("note")}
              >
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
                if (e.key === "/" && !text && mode === "reply") {
                  e.preventDefault();
                  setQrOpen(true);
                  return;
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (mode === "reply") sendReply();
                  else saveNote();
                }
              }}
            />
            <div className="rad-cbr">
              {mode === "reply" ? (
                <AttachMenu
                  ib={ib}
                  disabled={mediaBlocked || pending}
                  onPick={queueFile}
                />
              ) : null}
              {mode === "reply" ? (
                <EmojiPicker
                  ib={ib}
                  disabled={pending}
                  onPick={(emoji) => {
                    const el = taRef.current;
                    if (!el) {
                      setText((t) => t + emoji);
                      return;
                    }
                    const start = el.selectionStart ?? text.length;
                    const end = el.selectionEnd ?? text.length;
                    const next = text.slice(0, start) + emoji + text.slice(end);
                    setText(next);
                    requestAnimationFrame(() => {
                      el.focus();
                      const caret = start + emoji.length;
                      el.setSelectionRange(caret, caret);
                    });
                  }}
                />
              ) : null}
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
              {mode === "reply" ? (
                <VoiceRecorder
                  ib={ib}
                  disabled={mediaBlocked || pending}
                  onRecorded={(file, durationSec) => {
                    sendMedia("", file, durationSec, true);
                  }}
                />
              ) : null}
              <span className="sp" />
              <span className="rad-hint">{ib.composerSendHint}</span>
              <button
                type="button"
                className={cn(
                  "rad-sendb",
                  text.trim() && !pending && "rad-sendb-ready"
                )}
                disabled={!text.trim() || pending}
                onClick={mode === "reply" ? sendReply : saveNote}
              >
                {mode === "note" ? ib.saveNoteButton : ib.sendButton}
                <Send width={16} height={16} strokeWidth={1.5} aria-hidden />
              </button>
            </div>
          </div>
          {qrOpen && mode === "reply" ? (
            <QuickRepliesPanel
              open={qrOpen}
              onClose={() => setQrOpen(false)}
              locale={locale}
              ib={ib}
              name={conversation.name}
              requestRef={requestRef}
              onInsert={(body) => {
                setText(body);
                taRef.current?.focus();
              }}
            />
          ) : null}
        </div>
      </section>

      <MediaPreviewDialog
        pending={pendingMedia}
        ib={ib}
        sending={mediaSending || pending}
        onCancel={clearPendingMedia}
        onSend={(caption) => sendMedia(caption)}
      />
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

function DeliveryTick({
  status,
  inbox,
}: {
  status: string;
  inbox: Dictionary["inbox"];
}) {
  const props = { width: 14, height: 14, strokeWidth: 1.5 as const };
  switch (status) {
    case "pending":
      return <Clock {...props} aria-label={inbox.statusPending} />;
    case "sending":
      return <LoaderCircle {...props} aria-label={inbox.statusSending} />;
    case "sent":
      return <Check {...props} aria-label={inbox.statusSent} />;
    case "delivered":
      return <CheckCheck {...props} aria-label={inbox.statusDelivered} />;
    case "read":
      return (
        <CheckCheck
          {...props}
          aria-label={inbox.statusRead}
          className="rad-rd"
        />
      );
    case "failed":
      return <CircleAlert {...props} aria-label={inbox.statusFailed} />;
    default:
      return null;
  }
}

function Bubble({
  m,
  i,
  locale,
  ib,
  inbox,
  onRetry,
  onReply,
  onCopy,
  onHide,
}: {
  m: InboxMessageItem;
  i: number;
  locale: Locale;
  ib: Dictionary["ib"];
  inbox: Dictionary["inbox"];
  onRetry?: () => void;
  onReply: () => void;
  onCopy: () => void;
  onHide: () => void;
}) {
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
  const inFlight = isOut && (m.status === "pending" || m.status === "sending");
  const showMedia = isRenderableMediaType(m.messageType);

  return (
    <div
      className={cn(
        "rad-bb",
        isOut ? "rad-out" : "rad-in",
        m.status === "failed" && "rad-bb-failed",
        inFlight && "rad-sending"
      )}
      style={{ "--rad-i": i } as React.CSSProperties}
      data-msg-id={m.id}
    >
      {m.replyTo ? (
        <div className="rad-bb-quote">
          <b>{ib.replyToMessage}</b>
          <span>{m.replyTo.body || m.replyTo.messageType}</span>
        </div>
      ) : null}
      {showMedia ? <MediaBubbleBody m={m} ib={ib} /> : null}
      {!showMedia && bodyLabel !== labels.empty ? bodyLabel : null}
      <div className="rad-bm">
        {timeOf(m, locale)}
        {isOut && m.status === "failed" && onRetry ? (
          <button
            type="button"
            className="rad-retry"
            onClick={onRetry}
            aria-label={ib.retrySend}
          >
            <CircleAlert
              width={14}
              height={14}
              strokeWidth={1.5}
              aria-hidden
              className="rad-retry-ic"
            />
            <span>{ib.retrySend}</span>
          </button>
        ) : isOut ? (
          <DeliveryTick status={m.status} inbox={inbox} />
        ) : null}
      </div>
      <div className="rad-bb-acts">
        <button
          type="button"
          className="rad-ib"
          aria-label={ib.replyToMessage}
          onClick={onReply}
        >
          <Reply width={14} height={14} strokeWidth={1.5} aria-hidden />
        </button>
        <button
          type="button"
          className="rad-ib"
          aria-label={ib.copyMessage}
          onClick={onCopy}
        >
          <Copy width={14} height={14} strokeWidth={1.5} aria-hidden />
        </button>
        <button
          type="button"
          className="rad-ib"
          aria-label={ib.hideForMe}
          onClick={onHide}
        >
          <EyeOff width={14} height={14} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
    </div>
  );
}
