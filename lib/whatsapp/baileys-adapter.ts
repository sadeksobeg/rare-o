/**
 * BaileysWhatsAppAdapter — real WhatsApp Web transport (Stage A).
 *
 * WORKER-ONLY: do not import this module from Next.js route handlers or
 * client components. The web process never holds the Baileys socket.
 *
 * Pin: @whiskeysockets/baileys@6.7.24
 */

import makeWASocket, {
  DisconnectReason,
  downloadHistory,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
  getContentType,
  getHistoryMsg,
  normalizeMessageContent,
  useMultiFileAuthState as loadMultiFileAuthState,
  type WAMessage,
  type WAMessageContent,
  type WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";

import { WhatsAppContactDirectory } from "@/lib/whatsapp/contact-directory";
import { isLidJid, isPhoneUserJid, normalizeUserJid } from "@/lib/whatsapp/jid";
import { WHATSAPP_MAX_MEDIA_BYTES } from "@/lib/whatsapp/media-shared";
import { MAX_BAILEYS_RECONNECT_ATTEMPTS } from "@/lib/whatsapp/messaging/reliability";
import {
  ensureAuthDir,
  hasAuthStateFiles,
  wipeAuthState,
  type WhatsAppSessionStoreConfig,
} from "@/lib/whatsapp/session-store";
import { noteConnectionEstablished } from "@/lib/whatsapp/outbound-safety";
import {
  isOutboundEnabled,
  type WhatsAppAdapter,
  type WhatsAppAdapterEvents,
  type WhatsAppConnectionState,
  type WhatsAppHealth,
  type WhatsAppInboundMediaKind,
  type WhatsAppSendMediaInput,
  type WhatsAppSendResult,
  type WhatsAppSendTextInput,
  type WhatsAppSendTextResult,
} from "@/lib/whatsapp/types";

const MAX_TEXT_LENGTH = 4096;
const baileysLogger = pino({ level: "silent" });
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 60_000;

type Boomish = {
  output?: { statusCode?: number };
  message?: string;
};

function statusCodeFromError(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const boom = err as Boomish;
  if (typeof boom.output?.statusCode === "number") {
    return boom.output.statusCode;
  }
  if ("status" in err && typeof (err as { status?: unknown }).status === "number") {
    return (err as { status: number }).status;
  }
  return undefined;
}

function unwrapContent(message: WAMessage): WAMessageContent | undefined {
  return normalizeMessageContent(message.message) ?? undefined;
}

/** Protocol / reaction / empty stubs — never persist as inbox "مرفق". */
function isSkippableWaMessage(message: WAMessage): boolean {
  if (message.messageStubType) return true;
  const content = unwrapContent(message);
  if (!content) return true;
  if (content.protocolMessage || content.reactionMessage) return true;
  if (content.senderKeyDistributionMessage && !getContentType(content)) {
    return true;
  }
  if (content.pollUpdateMessage) return true;
  const type = getContentType(content);
  if (!type) return true;
  if (
    type === "protocolMessage" ||
    type === "reactionMessage" ||
    type === "senderKeyDistributionMessage" ||
    type === "messageContextInfo"
  ) {
    return true;
  }
  return false;
}

function extractInboundText(message: WAMessage): string | null {
  const content = unwrapContent(message);
  if (!content) return null;
  if (typeof content.conversation === "string" && content.conversation.trim()) {
    return content.conversation;
  }
  const ext = content.extendedTextMessage?.text;
  if (typeof ext === "string" && ext.trim()) return ext;
  const buttons = content.buttonsMessage?.contentText;
  if (typeof buttons === "string" && buttons.trim()) return buttons;
  const template =
    content.templateMessage?.hydratedTemplate?.hydratedContentText ||
    content.templateMessage?.hydratedFourRowTemplate?.hydratedContentText;
  if (typeof template === "string" && template.trim()) return template;
  return null;
}

function classifyInbound(message: WAMessage): {
  kind: WhatsAppInboundMediaKind | "text" | "unknown" | "skip";
  mime: string | null;
  fileName: string | null;
  caption: string | null;
  durationSec: number | null;
  structuredBody: string | null;
} {
  if (isSkippableWaMessage(message)) {
    return {
      kind: "skip",
      mime: null,
      fileName: null,
      caption: null,
      durationSec: null,
      structuredBody: null,
    };
  }
  const content = unwrapContent(message);
  if (!content) {
    return {
      kind: "skip",
      mime: null,
      fileName: null,
      caption: null,
      durationSec: null,
      structuredBody: null,
    };
  }
  if (content.imageMessage) {
    return {
      kind: "image",
      mime: content.imageMessage.mimetype ?? "image/jpeg",
      fileName: null,
      caption: content.imageMessage.caption ?? null,
      durationSec: null,
      structuredBody: null,
    };
  }
  if (content.videoMessage) {
    return {
      kind: "video",
      mime: content.videoMessage.mimetype ?? "video/mp4",
      fileName: null,
      caption: content.videoMessage.caption ?? null,
      durationSec:
        typeof content.videoMessage.seconds === "number"
          ? content.videoMessage.seconds
          : null,
      structuredBody: null,
    };
  }
  if (content.audioMessage) {
    return {
      kind: "audio",
      mime: content.audioMessage.mimetype ?? "audio/ogg",
      fileName: null,
      caption: null,
      durationSec:
        typeof content.audioMessage.seconds === "number"
          ? content.audioMessage.seconds
          : null,
      structuredBody: null,
    };
  }
  if (content.documentMessage) {
    return {
      kind: "document",
      mime: content.documentMessage.mimetype ?? "application/octet-stream",
      fileName: content.documentMessage.fileName ?? null,
      caption: content.documentMessage.caption ?? null,
      durationSec: null,
      structuredBody: null,
    };
  }
  if (content.stickerMessage) {
    return {
      kind: "sticker",
      mime: content.stickerMessage.mimetype ?? "image/webp",
      fileName: null,
      caption: null,
      durationSec: null,
      structuredBody: null,
    };
  }
  if (content.locationMessage || content.liveLocationMessage) {
    const loc = content.locationMessage ?? content.liveLocationMessage;
    return {
      kind: "location",
      mime: null,
      fileName: null,
      caption: null,
      durationSec: null,
      structuredBody: JSON.stringify({
        lat: loc?.degreesLatitude ?? null,
        lng: loc?.degreesLongitude ?? null,
        name: loc && "name" in loc ? loc.name : null,
        address: loc && "address" in loc ? loc.address : null,
      }),
    };
  }
  if (content.contactMessage) {
    return {
      kind: "contact",
      mime: null,
      fileName: null,
      caption: null,
      durationSec: null,
      structuredBody: JSON.stringify({
        displayName: content.contactMessage.displayName ?? null,
        vcard: content.contactMessage.vcard ?? null,
      }),
    };
  }
  if (content.contactsArrayMessage) {
    return {
      kind: "contact",
      mime: null,
      fileName: null,
      caption: null,
      durationSec: null,
      structuredBody: JSON.stringify({
        displayName: content.contactsArrayMessage.displayName ?? null,
        contacts: (content.contactsArrayMessage.contacts ?? []).map((c) => ({
          displayName: c.displayName ?? null,
          vcard: c.vcard ?? null,
        })),
      }),
    };
  }
  // Still unhandled interactive types — skip rather than empty «مرفق»
  return {
    kind: "skip",
    mime: null,
    fileName: null,
    caption: null,
    durationSec: null,
    structuredBody: null,
  };
}

function isIgnorableChatJid(id: string): boolean {
  if (!id || id === "status@broadcast" || id.endsWith("@g.us")) return true;
  if (id === "0@s.whatsapp.net" || id.startsWith("0@")) return true;
  return false;
}

function messageTimestampIso(msg: WAMessage): string {
  if (typeof msg.messageTimestamp === "number") {
    return new Date(msg.messageTimestamp * 1000).toISOString();
  }
  if (
    typeof msg.messageTimestamp === "object" &&
    msg.messageTimestamp !== null &&
    "toNumber" in msg.messageTimestamp
  ) {
    return new Date(
      (msg.messageTimestamp as { toNumber: () => number }).toNumber() * 1000
    ).toISOString();
  }
  return nowIso();
}

function nowIso(): string {
  return new Date().toISOString();
}

export type BaileysWhatsAppAdapterOptions = {
  session: WhatsAppSessionStoreConfig;
  events?: WhatsAppAdapterEvents;
  /**
   * When false (default for local safety), start() prepares session dir and
   * health only — it does not open a Baileys socket until requestAuthentication()
   * or connect() is called. Production worker sets true via env.
   */
  connectOnStart?: boolean;
};

/**
 * Production WhatsApp adapter backed by Baileys multi-device.
 */

/** Build the minimal WAMessage Baileys needs to render a real quote. */
function buildQuotedOptions(
  jid: string,
  quoted?: { waMessageId: string; fromMe: boolean; text: string } | null
) {
  if (!quoted?.waMessageId) return undefined;
  return {
    quoted: {
      key: {
        remoteJid: jid,
        fromMe: quoted.fromMe,
        id: quoted.waMessageId,
      },
      message: { conversation: quoted.text || "" },
    },
  } as const;
}

export class BaileysWhatsAppAdapter implements WhatsAppAdapter {
  private readonly session: WhatsAppSessionStoreConfig;
  private readonly events: WhatsAppAdapterEvents;
  private readonly connectOnStart: boolean;

  private sock: WASocket | null = null;
  private state: WhatsAppConnectionState = "DISCONNECTED";
  private detail: string | undefined;
  private lastConnectedAt: string | null = null;
  private connectedPhone: string | null = null;
  private updatedAt: string = nowIso();
  private starting = false;
  private stopped = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /** In-process outbound idempotency (Phase B persists this). */
  private readonly seenClientRequestIds = new Set<string>();
  /** In-process inbound dedupe for the current process lifetime. */
  private readonly seenWaMessageIds = new Set<string>();
  /** LID ↔ phone + address-book names (WhatsApp Web style identity). */
  private readonly contacts = new WhatsAppContactDirectory();

  constructor(options: BaileysWhatsAppAdapterOptions) {
    this.session = options.session;
    this.events = options.events ?? {};
    this.connectOnStart = options.connectOnStart ?? false;
  }

  /**
   * Shows a real "typing…"/"recording…" presence to the recipient and holds
   * briefly before the actual send — a cheap, low-risk anti-ban signal:
   * research on unofficial-client detection consistently flags
   * instantaneous, inhuman-looking sends as a risk factor, and a visible
   * composing indicator is exactly what a human typing a reply produces.
   * This is deliberately short (hundreds of ms to a couple of seconds) —
   * the real pacing/jitter already happens upstream in
   * `acquireOutboundSendSlot` before this is ever called; this only adds
   * the *visible* cue, not another long wait on top of that gap.
   * Best-effort: presence failures must never block the actual send.
   */
  private async simulateTyping(
    jid: string,
    kind: "composing" | "recording",
    contentLength: number
  ): Promise<void> {
    if (!this.sock) return;
    try {
      await this.sock.sendPresenceUpdate(kind, jid);
    } catch {
      /* presence is cosmetic — never fail the send over it */
    }
    // Short "typing…" beat (cosmetic anti-spam realism) — kept brief so a
    // reply leaves in about a second, not several.
    const base = kind === "recording" ? 300 : 200;
    const perUnit = kind === "recording" ? 40 : 8;
    const duration = Math.min(1_000, base + contentLength * perUnit);
    await new Promise((resolve) => setTimeout(resolve, duration));
    try {
      await this.sock.sendPresenceUpdate("paused", jid);
    } catch {
      /* ignore */
    }
  }

  private async emitContactIdentity(
    chatJid: string,
    identity: {
      pnJid: string | null;
      e164: string | null;
      displayName: string | null;
    }
  ): Promise<void> {
    await this.events.onContactIdentity?.({
      waChatId: chatJid,
      altWaChatId: identity.pnJid,
      participantE164: identity.e164,
      displayName: identity.displayName,
    });
  }

  getHealth(): WhatsAppHealth {
    return {
      state: this.state,
      detail: this.detail,
      lastConnectedAt: this.lastConnectedAt,
      connectedPhone: this.connectedPhone,
      updatedAt: this.updatedAt,
    };
  }

  async start(): Promise<void> {
    this.stopped = false;
    ensureAuthDir(this.session.authDir);

    if (!this.connectOnStart) {
      const hasCreds = hasAuthStateFiles(this.session.authDir);
      await this.setHealth(
        hasCreds ? "DISCONNECTED" : "AUTHENTICATION_REQUIRED",
        hasCreds
          ? "Worker ready; socket not started (WHATSAPP_CONNECT_ON_START=false)"
          : "Worker ready; no session files - call connect/requestAuthentication when environment is ready"
      );
      return;
    }

    await this.connect();
  }

  /**
   * Open (or reopen) the Baileys socket. Safe to call after start() when
   * connectOnStart was false.
   */
  async connect(): Promise<void> {
    if (this.stopped) {
      throw new Error("ADAPTER_STOPPED");
    }
    await this.openSocket();
  }

  async requestAuthentication(): Promise<void> {
    // Opening with empty/invalid creds causes Baileys to emit QR via connection.update
    // Manual (admin / supervisor) retry resets the automatic backoff budget.
    this.reconnectAttempt = 0;
    await this.connect();
  }

  /**
   * Request a phone pairing code instead of QR. Opens the socket if needed.
   * Code is emitted through onPairingCode only — never logged.
   */
  async requestPairingCode(phoneDigits: string): Promise<void> {
    if (this.stopped) {
      throw new Error("ADAPTER_STOPPED");
    }
    const phone = phoneDigits.replace(/\D/g, "");
    if (phone.length < 7 || phone.length > 15) {
      throw new Error("INVALID_PHONE");
    }
    if (this.state === "CONNECTED") {
      throw new Error("ALREADY_LINKED");
    }

    if (!this.sock) {
      this.reconnectAttempt = 0;
      await this.connect();
    }
    const sock = this.sock;
    if (!sock) {
      throw new Error("SOCKET_NOT_OPEN");
    }
    // Baileys requires the socket handshake to have started before pairing.
    await new Promise((resolve) => setTimeout(resolve, 1_500));

    const code = await sock.requestPairingCode(phone);
    await this.setHealth(
      "AUTHENTICATION_REQUIRED",
      "Pairing code available for authorized admin authentication"
    );
    await this.events.onPairingCode?.({
      code,
      phone,
      createdAt: nowIso(),
    });
  }

  async stop(): Promise<void> {
    this.stopped = true;
    this.clearReconnectTimer();
    const sock = this.sock;
    this.sock = null;
    if (sock) {
      try {
        sock.ev.removeAllListeners("connection.update");
        sock.ev.removeAllListeners("messages.upsert");
        sock.end(undefined);
      } catch {
        // ignore teardown errors
      }
    }
    await this.setHealth("DISCONNECTED", "Worker stopped");
  }

  async logout(): Promise<void> {
    const sock = this.sock;
    if (sock) {
      try {
        await sock.logout();
      } catch {
        // session may already be invalid
      }
    }
    this.sock = null;
    this.clearReconnectTimer();
    try {
      wipeAuthState(this.session.authDir);
    } catch {
      // wipe failure must not crash the worker; next pairing will surface errors
    }
    await this.setHealth(
      "AUTHENTICATION_REQUIRED",
      "Logged out - authentication required"
    );
  }

  /**
   * USync phone → LID for known E.164s, then emit identity for inbox rows.
   */
  async resolvePhonesToLids(phonesE164: string[]): Promise<number> {
    const sock = this.sock;
    if (!sock || this.state !== "CONNECTED") return 0;
    const unique = [
      ...new Set(
        phonesE164
          .map((p) => p.replace(/\D/g, ""))
          .filter((d) => d.length >= 8 && d.length <= 15)
      ),
    ].slice(0, 80);
    if (unique.length === 0) return 0;

    let linked = 0;
    try {
      const results = await sock.onWhatsApp(
        ...unique.map((d) => `${d}@s.whatsapp.net`)
      );
      for (const row of results ?? []) {
        const pn = row.jid;
        const lid = (row as { lid?: string }).lid;
        if (!pn || !lid || !row.exists) continue;
        const identity = this.contacts.linkLidToPn(lid, pn);
        if (!identity?.e164) continue;
        await this.emitContactIdentity(lid, identity);
        await this.emitContactIdentity(pn, identity);
        linked += 1;
      }
    } catch {
      return linked;
    }
    return linked;
  }

  async sendText(input: WhatsAppSendTextInput): Promise<WhatsAppSendTextResult> {
    const clientRequestId = input.clientRequestId?.trim() ?? "";
    if (!clientRequestId) {
      return {
        ok: false,
        clientRequestId: "",
        error: "clientRequestId is required",
        code: "INVALID_INPUT",
      };
    }

    if (this.seenClientRequestIds.has(clientRequestId)) {
      return {
        ok: false,
        clientRequestId,
        error: "Duplicate clientRequestId",
        code: "DUPLICATE",
      };
    }

    if (!isOutboundEnabled()) {
      return {
        ok: false,
        clientRequestId,
        error: "Outbound messaging is disabled (WHATSAPP_OUTBOUND_ENABLED)",
        code: "OUTBOUND_DISABLED",
      };
    }

    if (this.state !== "CONNECTED" || !this.sock) {
      return {
        ok: false,
        clientRequestId,
        error: "WhatsApp is not connected",
        code: "NOT_CONNECTED",
      };
    }

    const text = input.text?.trim() ?? "";
    if (!text) {
      return {
        ok: false,
        clientRequestId,
        error: "Message text is empty",
        code: "INVALID_INPUT",
      };
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return {
        ok: false,
        clientRequestId,
        error: `Message exceeds ${MAX_TEXT_LENGTH} characters`,
        code: "INVALID_INPUT",
      };
    }

    const jid = normalizeUserJid(input.waChatId);
    if (!jid) {
      return {
        ok: false,
        clientRequestId,
        error: "Invalid waChatId",
        code: "INVALID_INPUT",
      };
    }

    try {
      await this.simulateTyping(jid, "composing", text.length);
      const result = await this.sock.sendMessage(
        jid,
        { text },
        buildQuotedOptions(jid, input.quoted) as never
      );
      const waMessageId = result?.key?.id;
      if (!waMessageId) {
        return {
          ok: false,
          clientRequestId,
          error: "Send returned no message id",
          code: "SEND_FAILED",
        };
      }
      this.seenClientRequestIds.add(clientRequestId);
      return { ok: true, waMessageId, clientRequestId };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Send failed";
      return {
        ok: false,
        clientRequestId,
        error: message.slice(0, 200),
        code: "SEND_FAILED",
      };
    }
  }

  async sendMedia(input: WhatsAppSendMediaInput): Promise<WhatsAppSendResult> {
    const clientRequestId = input.clientRequestId?.trim() ?? "";
    if (!clientRequestId) {
      return {
        ok: false,
        clientRequestId: "",
        error: "clientRequestId is required",
        code: "INVALID_INPUT",
      };
    }
    if (this.seenClientRequestIds.has(clientRequestId)) {
      return {
        ok: false,
        clientRequestId,
        error: "Duplicate clientRequestId",
        code: "DUPLICATE",
      };
    }
    if (!isOutboundEnabled()) {
      return {
        ok: false,
        clientRequestId,
        error: "Outbound messaging is disabled (WHATSAPP_OUTBOUND_ENABLED)",
        code: "OUTBOUND_DISABLED",
      };
    }
    if (this.state !== "CONNECTED" || !this.sock) {
      return {
        ok: false,
        clientRequestId,
        error: "WhatsApp is not connected",
        code: "NOT_CONNECTED",
      };
    }
    if (!input.bytes?.length) {
      return {
        ok: false,
        clientRequestId,
        error: "Media payload is empty",
        code: "INVALID_INPUT",
      };
    }
    if (input.bytes.length > WHATSAPP_MAX_MEDIA_BYTES) {
      return {
        ok: false,
        clientRequestId,
        error: "Media exceeds size limit",
        code: "INVALID_INPUT",
      };
    }
    const jid = normalizeUserJid(input.waChatId);
    if (!jid) {
      return {
        ok: false,
        clientRequestId,
        error: "Invalid waChatId",
        code: "INVALID_INPUT",
      };
    }

    const caption = input.caption?.trim() || undefined;
    const mime = input.mime?.trim() || "application/octet-stream";

    try {
      await this.simulateTyping(
        jid,
        input.messageType === "audio" ? "recording" : "composing",
        input.bytes.length / 1024
      );
      let result;
      switch (input.messageType) {
        case "image":
          result = await this.sock.sendMessage(jid, {
            image: input.bytes,
            caption,
            mimetype: mime,
          }, buildQuotedOptions(jid, input.quoted) as never);
          break;
        case "video":
          result = await this.sock.sendMessage(jid, {
            video: input.bytes,
            caption,
            mimetype: mime,
          }, buildQuotedOptions(jid, input.quoted) as never);
          break;
        case "audio": {
          const asPtt = input.ptt !== false;
          // WhatsApp voice notes must declare Opus codecs; bare audio/ogg or
          // browser webm often get a waMessageId then never play on the phone.
          const audioMime = asPtt
            ? "audio/ogg; codecs=opus"
            : mime.startsWith("audio/")
              ? mime
              : "audio/ogg; codecs=opus";
          result = await this.sock.sendMessage(jid, {
            audio: input.bytes,
            mimetype: audioMime,
            ptt: asPtt,
            ...(input.seconds != null &&
            Number.isFinite(input.seconds) &&
            input.seconds > 0
              ? { seconds: Math.max(1, Math.round(input.seconds)) }
              : {}),
          }, buildQuotedOptions(jid, input.quoted) as never);
          break;
        }
        case "document":
          result = await this.sock.sendMessage(jid, {
            document: input.bytes,
            mimetype: mime,
            fileName: input.fileName?.trim() || "file",
            caption,
          }, buildQuotedOptions(jid, input.quoted) as never);
          break;
        default:
          return {
            ok: false,
            clientRequestId,
            error: "Unsupported media type",
            code: "INVALID_INPUT",
          };
      }
      const waMessageId = result?.key?.id;
      if (!waMessageId) {
        return {
          ok: false,
          clientRequestId,
          error: "Send returned no message id",
          code: "SEND_FAILED",
        };
      }
      this.seenClientRequestIds.add(clientRequestId);
      return { ok: true, waMessageId, clientRequestId };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Send failed";
      return {
        ok: false,
        clientRequestId,
        error: message.slice(0, 200),
        code: "SEND_FAILED",
      };
    }
  }

  private async openSocket(): Promise<void> {
    if (this.starting) return;
    this.starting = true;
    this.clearReconnectTimer();

    try {
      ensureAuthDir(this.session.authDir);
      this.closeSocketQuietly();
      await this.setHealth("CONNECTING", "Opening Baileys socket");

      const { state, saveCreds } = await loadMultiFileAuthState(
        this.session.authDir
      );
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: baileysLogger,
        /** Pull chat roster + recent history like WhatsApp Web */
        syncFullHistory: true,
        shouldSyncHistoryMessage: () => true,
        markOnlineOnConnect: false,
        getMessage: async () => undefined,
      });

      this.sock = sock;

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", (update) => {
        void this.handleConnectionUpdate(update);
      });

      sock.ev.on("messages.upsert", (payload) => {
        void this.handleMessagesUpsert(payload);
      });

      sock.ev.on("messages.update", (updates) => {
        void this.handleMessagesUpdate(updates);
      });

      sock.ev.on("messaging-history.set", (payload) => {
        void this.handleHistorySet(payload);
      });

      sock.ev.on("chats.upsert", (chats) => {
        void this.handleHistorySet({ chats, messages: [] });
      });

      sock.ev.on("contacts.upsert", (list) => {
        void this.handleContactsUpsert(list);
      });
      sock.ev.on("contacts.update", (list) => {
        void this.handleContactsUpsert(list);
      });
      sock.ev.on("chats.phoneNumberShare", (payload) => {
        void this.handlePhoneNumberShare(payload);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Socket open failed";
      await this.setHealth("ERROR", message.slice(0, 200));
      this.scheduleReconnect();
    } finally {
      this.starting = false;
    }
  }

  private async handleConnectionUpdate(update: {
    connection?: "open" | "connecting" | "close";
    lastDisconnect?: { error?: unknown };
    qr?: string;
  }): Promise<void> {
    if (this.stopped) return;

    if (update.qr) {
      // Never log QR payload — emit only through the controlled event channel
      await this.setHealth(
        "AUTHENTICATION_REQUIRED",
        "QR available for authorized admin authentication"
      );
      await this.events.onQr?.({
        qr: update.qr,
        createdAt: nowIso(),
      });
    }

    if (update.connection === "connecting") {
      await this.setHealth("CONNECTING", "Baileys connecting");
      return;
    }

    if (update.connection === "open") {
      this.reconnectAttempt = 0;
      this.lastConnectedAt = nowIso();
      // A burst of outbound traffic the instant the session reconnects is a
      // known ban signal — arm a brief cooldown before sends resume.
      noteConnectionEstablished();
      // Own number: "9639xxxxxxxx:12@s.whatsapp.net" → digits before the device suffix.
      const selfId = this.sock?.user?.id ?? "";
      const selfDigits = selfId.split("@")[0]?.split(":")[0]?.replace(/\D/g, "") ?? "";
      if (selfDigits.length >= 8 && selfDigits.length <= 15) {
        this.connectedPhone = selfDigits;
      }
      await this.setHealth("CONNECTED", "Baileys connection open");
      // Nudge app-state / roster sync so chat list fills beyond the last open slice
      void this.requestRosterRefresh();
      return;
    }

    if (update.connection === "close") {
      const code = statusCodeFromError(update.lastDisconnect?.error);
      const loggedOut = code === DisconnectReason.loggedOut;

      this.sock = null;

      if (loggedOut) {
        await this.setHealth(
          "AUTHENTICATION_REQUIRED",
          "Session logged out - QR authentication required"
        );
        return;
      }

      await this.setHealth(
        "RECONNECTING",
        code != null
          ? `Connection closed (code ${code}) - scheduling reconnect`
          : "Connection closed - scheduling reconnect"
      );
      this.scheduleReconnect();
    }
  }

  private async requestRosterRefresh(): Promise<void> {
    const sock = this.sock;
    if (!sock || this.stopped) return;
    try {
      const resync = (
        sock as WASocket & {
          resyncAppState?: (
            collections: string[],
            isInitialSync: boolean
          ) => Promise<void>;
        }
      ).resyncAppState;
      if (typeof resync === "function") {
        await resync.call(
          sock,
          ["critical_block", "critical_unblock_low", "regular_high", "regular_low", "regular"],
          false
        );
      }
    } catch {
      // best-effort; history sync / chats.upsert still drive the roster
    }
  }

  private async handleHistorySet(payload: {
    chats?: Array<{
      id?: string | null;
      name?: string | null;
      lidJid?: string | null;
      conversationTimestamp?: number | { toNumber?: () => number } | null;
    }>;
    messages?: WAMessage[];
    isLatest?: boolean;
  }): Promise<void> {
    if (this.stopped) return;
    const chats = payload.chats ?? [];
    const messages = payload.messages ?? [];

    // Contacts often arrive in the same history payload — apply before seeding
    // so LID↔phone links are available when we write participantE164.
    const contacts = (payload as { contacts?: unknown }).contacts;
    if (Array.isArray(contacts)) {
      await this.handleContactsUpsert(contacts as Array<Record<string, unknown>>);
    }

    for (const chat of chats) {
      const id = chat.id?.trim();
      if (!id || isIgnorableChatJid(id)) continue;
      const lid =
        (chat.lidJid && normalizeUserJid(chat.lidJid)) ||
        (isLidJid(id) ? id : null);
      const pn = isPhoneUserJid(id) ? id : null;
      if (lid && pn) {
        this.contacts.linkLidToPn(lid, pn);
      }
      const ts = chat.conversationTimestamp;
      let lastIso: string | null = null;
      if (typeof ts === "number") {
        lastIso = new Date(ts * 1000).toISOString();
      } else if (ts && typeof ts.toNumber === "function") {
        lastIso = new Date(ts.toNumber() * 1000).toISOString();
      }
      if (chat.name?.trim() || lid || pn) {
        this.contacts.upsertContact({
          id,
          lid: lid ?? undefined,
          jid: pn ?? undefined,
          name: chat.name?.trim() || undefined,
        });
      }
      const identity = this.contacts.resolve(id, {
        pushName: chat.name?.trim() || null,
      });
      await this.events.onChatSeed?.({
        waChatId: id,
        displayName: identity.displayName || chat.name?.trim() || null,
        participantE164: identity.e164,
        lastMessagePreview: "",
        lastMessageAt: lastIso,
      });
      if (identity.e164 || identity.displayName) {
        await this.emitContactIdentity(id, identity);
        if (lid && lid !== id) await this.emitContactIdentity(lid, identity);
        if (pn && pn !== id) await this.emitContactIdentity(pn, identity);
      }
    }

    for (const msg of messages) {
      await this.processWaMessage(msg, { downloadMedia: false });
    }
  }

  /** Extract phoneNumberToLidMappings from a history blob (Baileys drops them). */
  private async ingestHistoryPhoneMappings(msg: WAMessage): Promise<void> {
    try {
      if (!msg.message) return;
      const histNotification = getHistoryMsg(msg.message);
      if (!histNotification) return;
      const syncData = await downloadHistory(histNotification, {});
      const mappings =
        (
          syncData as {
            phoneNumberToLidMappings?: Array<{
              pnJid?: string | null;
              lidJid?: string | null;
            }>;
          }
        ).phoneNumberToLidMappings ?? [];
      for (const m of mappings) {
        if (!m.lidJid || !m.pnJid) continue;
        const identity = this.contacts.linkLidToPn(m.lidJid, m.pnJid);
        if (!identity) continue;
        await this.emitContactIdentity(m.lidJid, identity);
        await this.emitContactIdentity(m.pnJid, identity);
      }
    } catch {
      // ignore mapping extract failures — chat still works via senderPn later
    }
  }

  private async handleContactsUpsert(
    list: Array<{
      id?: string | null;
      lid?: string | null;
      jid?: string | null;
      name?: string | null;
      notify?: string | null;
      verifiedName?: string | null;
    }>
  ): Promise<void> {
    for (const c of list) {
      const identity = this.contacts.upsertContact({
        id: c.id,
        lid: c.lid,
        jid: c.jid,
        name: c.name,
        notify: c.notify,
        verifiedName: c.verifiedName,
      });
      if (!identity) continue;
      const chatJid = identity.chatJid || c.id || c.lid || c.jid;
      if (!chatJid) continue;
      await this.emitContactIdentity(chatJid, identity);
      if (identity.pnJid && identity.pnJid !== chatJid) {
        await this.emitContactIdentity(identity.pnJid, identity);
      }
    }
  }

  private async handlePhoneNumberShare(payload: {
    lid?: string;
    jid?: string;
  }): Promise<void> {
    if (!payload.lid || !payload.jid) return;
    const identity = this.contacts.linkLidToPn(payload.lid, payload.jid);
    if (!identity) return;
    await this.emitContactIdentity(payload.lid, identity);
    await this.emitContactIdentity(payload.jid, identity);
  }

  private async handleMessagesUpsert(payload: {
    messages: WAMessage[];
    type: string;
  }): Promise<void> {
    if (this.stopped) return;
    if (
      payload.type !== "notify" &&
      payload.type !== "append" &&
      payload.type !== "hist"
    ) {
      return;
    }

    for (const msg of payload.messages) {
      if (msg.message && getHistoryMsg(msg.message)) {
        void this.ingestHistoryPhoneMappings(msg);
      }
      await this.processWaMessage(msg, { downloadMedia: true });
    }
  }

  /**
   * Delivery/read receipts for messages we sent. `update.status` only
   * appears on the row that actually changed, so most events here are for
   * someone else's inbound ack and have nothing to report — bail quietly.
   */
  private async handleMessagesUpdate(
    updates: Array<{ key: { id?: string | null; fromMe?: boolean | null }; update: Partial<WAMessage> }>
  ): Promise<void> {
    if (this.stopped) return;
    for (const { key, update } of updates) {
      if (!key.fromMe || !key.id) continue;
      const level = update.status;
      if (level == null) continue;
      // WAMessageStatus: ERROR=0 PENDING=1 SERVER_ACK=2 DELIVERY_ACK=3 READ=4 PLAYED=5
      const status = level >= 4 ? "read" : level === 3 ? "delivered" : null;
      if (!status) continue;
      await this.events.onOutboundStatusUpdate?.({
        waMessageId: key.id,
        status,
        timestamp: nowIso(),
      });
    }
  }

  private async processWaMessage(
    msg: WAMessage,
    opts: { downloadMedia: boolean }
  ): Promise<void> {
    if (!msg.message) return;

    const waMessageId = msg.key.id;
    const waRemoteJid = msg.key.remoteJid;
    if (!waMessageId || !waRemoteJid) return;
    if (isIgnorableChatJid(waRemoteJid)) return;

    if (this.seenWaMessageIds.has(waMessageId)) return;
    this.seenWaMessageIds.add(waMessageId);

    if (msg.message && getHistoryMsg(msg.message)) {
      await this.ingestHistoryPhoneMappings(msg);
    }

    // Always try identity first (even for stubs we skip) so senderPn maps LID→phone
    const ts = messageTimestampIso(msg);
    const identity = this.contacts.resolve(waRemoteJid, {
      senderPn: msg.key.senderPn ?? null,
      participantPn: msg.key.participantPn ?? null,
      pushName: msg.pushName ?? null,
    });
    if (identity.e164 || identity.displayName) {
      await this.emitContactIdentity(waRemoteJid, identity);
      if (identity.pnJid && identity.pnJid !== waRemoteJid) {
        await this.emitContactIdentity(identity.pnJid, identity);
      }
    }

    if (isSkippableWaMessage(msg)) return;

    const base = {
      waMessageId,
      waChatId: waRemoteJid,
      waRemoteJid,
      senderE164: identity.e164,
      displayName: identity.displayName || msg.pushName || null,
      timestamp: ts,
    };

    const text = extractInboundText(msg);
    if (msg.key.fromMe) {
      if (text) {
        await this.events.onOutboundEcho?.({
          waMessageId,
          waChatId: waRemoteJid,
          waRemoteJid,
          text,
          timestamp: ts,
        });
      }
      return;
    }

    if (text) {
      await this.events.onInboundText?.({ ...base, text });
      return;
    }

    const classified = classifyInbound(msg);
    if (classified.kind === "skip") return;

    if (classified.kind === "location" || classified.kind === "contact") {
      await this.events.onInboundMedia?.({
        ...base,
        messageType: classified.kind,
        mime: null,
        fileName: null,
        caption: null,
        durationSec: null,
        bytes: null,
        structuredBody: classified.structuredBody,
      });
      return;
    }

    if (
      classified.kind === "image" ||
      classified.kind === "video" ||
      classified.kind === "audio" ||
      classified.kind === "document" ||
      classified.kind === "sticker"
    ) {
      if (!opts.downloadMedia || !this.sock) {
        // History path: keep a typed placeholder, not unknown
        await this.events.onInboundUnsupported?.({
          ...base,
          kindHint: classified.kind,
        });
        return;
      }
      try {
        const downloaded = await downloadMediaMessage(
          msg,
          "buffer",
          {},
          {
            logger: baileysLogger,
            reuploadRequest: this.sock.updateMediaMessage,
          }
        );
        const bytes = Buffer.isBuffer(downloaded)
          ? downloaded
          : Buffer.from(downloaded as ArrayBuffer);
        if (!bytes.length || bytes.length > WHATSAPP_MAX_MEDIA_BYTES) {
          await this.events.onInboundUnsupported?.({
            ...base,
            kindHint: classified.kind,
          });
          return;
        }
        await this.events.onInboundMedia?.({
          ...base,
          messageType: classified.kind,
          mime: classified.mime,
          fileName: classified.fileName,
          caption: classified.caption,
          durationSec: classified.durationSec,
          bytes,
          structuredBody: null,
        });
      } catch {
        await this.events.onInboundUnsupported?.({
          ...base,
          kindHint: classified.kind,
        });
      }
      return;
    }
    // Do not persist unknown stubs as empty attachment bubbles
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    if (this.reconnectAttempt >= MAX_BAILEYS_RECONNECT_ATTEMPTS) {
      void this.setHealth(
        "ERROR",
        "Reconnect attempts exhausted — manual intervention required"
      );
      return;
    }
    this.clearReconnectTimer();
    const attempt = this.reconnectAttempt++;
    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** Math.min(attempt, 5),
      RECONNECT_MAX_MS
    );
    void this.setHealth(
      "RECONNECTING",
      `Reconnect attempt ${attempt + 1}/${MAX_BAILEYS_RECONNECT_ATTEMPTS} in ${delay}ms`
    );
    this.reconnectTimer = setTimeout(() => {
      void this.openSocket();
    }, delay);
  }

  /** Tear down any previous socket so reconnect never leaves two live sockets. */
  private closeSocketQuietly(): void {
    const sock = this.sock;
    this.sock = null;
    if (!sock) return;
    try {
      sock.ev.removeAllListeners("connection.update");
      sock.ev.removeAllListeners("messages.upsert");
      sock.end(undefined);
    } catch {
      // ignore teardown errors
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private async setHealth(
    state: WhatsAppConnectionState,
    detail?: string
  ): Promise<void> {
    this.state = state;
    this.detail = detail;
    this.updatedAt = nowIso();
    await this.events.onHealth?.(this.getHealth());
  }
}
