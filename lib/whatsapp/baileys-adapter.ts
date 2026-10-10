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
  fetchLatestBaileysVersion,
  useMultiFileAuthState as loadMultiFileAuthState,
  type WAMessage,
  type WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";

import { e164FromRemoteJid, normalizeUserJid } from "@/lib/whatsapp/jid";
import { MAX_BAILEYS_RECONNECT_ATTEMPTS } from "@/lib/whatsapp/messaging/reliability";
import {
  ensureAuthDir,
  hasAuthStateFiles,
  type WhatsAppSessionStoreConfig,
} from "@/lib/whatsapp/session-store";
import {
  isOutboundEnabled,
  type WhatsAppAdapter,
  type WhatsAppAdapterEvents,
  type WhatsAppConnectionState,
  type WhatsAppHealth,
  type WhatsAppSendTextInput,
  type WhatsAppSendTextResult,
} from "@/lib/whatsapp/types";

const MAX_TEXT_LENGTH = 4096;
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

function extractInboundText(message: WAMessage): string | null {
  const content = message.message;
  if (!content) return null;
  if (typeof content.conversation === "string" && content.conversation.trim()) {
    return content.conversation;
  }
  const ext = content.extendedTextMessage?.text;
  if (typeof ext === "string" && ext.trim()) return ext;
  return null;
}

/** Safe kind label for unsupported Stage A types — never downloads media. */
function unsupportedKindHint(message: WAMessage): string {
  const content = message.message;
  if (!content) return "empty";
  if (content.imageMessage) return "image";
  if (content.videoMessage) return "video";
  if (content.audioMessage) return "audio";
  if (content.documentMessage) return "document";
  if (content.stickerMessage) return "sticker";
  if (content.contactMessage || content.contactsArrayMessage) return "contact";
  if (content.locationMessage || content.liveLocationMessage) return "location";
  return "unknown";
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
export class BaileysWhatsAppAdapter implements WhatsAppAdapter {
  private readonly session: WhatsAppSessionStoreConfig;
  private readonly events: WhatsAppAdapterEvents;
  private readonly connectOnStart: boolean;

  private sock: WASocket | null = null;
  private state: WhatsAppConnectionState = "DISCONNECTED";
  private detail: string | undefined;
  private lastConnectedAt: string | null = null;
  private updatedAt: string = nowIso();
  private starting = false;
  private stopped = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /** In-process outbound idempotency (Phase B persists this). */
  private readonly seenClientRequestIds = new Set<string>();
  /** In-process inbound dedupe for the current process lifetime. */
  private readonly seenWaMessageIds = new Set<string>();

  constructor(options: BaileysWhatsAppAdapterOptions) {
    this.session = options.session;
    this.events = options.events ?? {};
    this.connectOnStart = options.connectOnStart ?? false;
  }

  getHealth(): WhatsAppHealth {
    return {
      state: this.state,
      detail: this.detail,
      lastConnectedAt: this.lastConnectedAt,
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
    await this.connect();
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
    await this.setHealth(
      "AUTHENTICATION_REQUIRED",
      "Logged out - QR authentication required"
    );
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
      const result = await this.sock.sendMessage(jid, { text });
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

  private async openSocket(): Promise<void> {
    if (this.starting) return;
    this.starting = true;
    this.clearReconnectTimer();

    try {
      ensureAuthDir(this.session.authDir);
      await this.setHealth("CONNECTING", "Opening Baileys socket");

      const { state, saveCreds } = await loadMultiFileAuthState(
        this.session.authDir
      );
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        syncFullHistory: false,
        markOnlineOnConnect: false,
      });

      this.sock = sock;

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", (update) => {
        void this.handleConnectionUpdate(update);
      });

      sock.ev.on("messages.upsert", (payload) => {
        void this.handleMessagesUpsert(payload);
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
      await this.setHealth("CONNECTED", "Baileys connection open");
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

  private async handleMessagesUpsert(payload: {
    messages: WAMessage[];
    type: string;
  }): Promise<void> {
    if (this.stopped) return;
    if (payload.type !== "notify" && payload.type !== "append") return;

    for (const msg of payload.messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const waMessageId = msg.key.id;
      const waRemoteJid = msg.key.remoteJid;
      if (!waMessageId || !waRemoteJid) continue;
      if (waRemoteJid.endsWith("@g.us") || waRemoteJid === "status@broadcast") {
        continue;
      }

      if (this.seenWaMessageIds.has(waMessageId)) continue;
      this.seenWaMessageIds.add(waMessageId);

      const ts = messageTimestampIso(msg);
      const base = {
        waMessageId,
        waChatId: waRemoteJid,
        waRemoteJid,
        senderE164: e164FromRemoteJid(waRemoteJid),
        displayName: msg.pushName ?? null,
        timestamp: ts,
      };

      const text = extractInboundText(msg);
      if (text) {
        await this.events.onInboundText?.({ ...base, text });
        continue;
      }

      // Stage A: record unsupported types safely; never crash the worker
      await this.events.onInboundUnsupported?.({
        ...base,
        kindHint: unsupportedKindHint(msg),
      });
    }
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
