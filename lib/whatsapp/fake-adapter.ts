/**
 * FakeWhatsAppAdapter — deterministic WhatsApp transport for E2E without a phone.
 *
 * Selected with WHATSAPP_ADAPTER=fake. Never opens a socket, never touches
 * session files, never contacts WhatsApp. Safe to import from the web process
 * (unlike BaileysWhatsAppAdapter, which is worker-only).
 */

import { randomBytes, randomUUID } from "node:crypto";

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
/** Short tick between "awaiting code" and "connected" in fake pairing. */
export const FAKE_PAIRING_CONNECT_DELAY_MS = 50;
const PAIRING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function nowIso(): string {
  return new Date().toISOString();
}

/** Fake pairing code in the shape FAKE-XXXX. */
export function generateFakePairingCode(): string {
  const bytes = randomBytes(4);
  let suffix = "";
  for (const b of bytes) {
    suffix += PAIRING_CODE_ALPHABET[b % PAIRING_CODE_ALPHABET.length];
  }
  return `FAKE-${suffix}`;
}

export type FakeWhatsAppAdapterOptions = {
  events?: WhatsAppAdapterEvents;
  /** When true, start() goes straight to CONNECTED (default false = not linked). */
  connectOnStart?: boolean;
  /** Override the connect tick (tests). */
  connectDelayMs?: number;
};

export class FakeWhatsAppAdapter implements WhatsAppAdapter {
  private readonly events: WhatsAppAdapterEvents;
  private readonly connectOnStart: boolean;
  private readonly connectDelayMs: number;

  private state: WhatsAppConnectionState = "DISCONNECTED";
  private detail: string | undefined;
  private lastConnectedAt: string | null = null;
  private updatedAt: string = nowIso();
  private stopped = false;
  /** True once a fake pairing/connect succeeded and no logout happened since. */
  private linked = false;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly seenClientRequestIds = new Set<string>();
  /** Sent messages for E2E assertions (text only, in-process). */
  private readonly sent: Array<{
    waMessageId: string;
    waChatId: string;
    text: string;
    clientRequestId: string;
  }> = [];

  constructor(options: FakeWhatsAppAdapterOptions = {}) {
    this.events = options.events ?? {};
    this.connectOnStart = options.connectOnStart ?? false;
    this.connectDelayMs = options.connectDelayMs ?? FAKE_PAIRING_CONNECT_DELAY_MS;
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
    if (this.connectOnStart) {
      await this.connectNow("Fake adapter connected on start");
      return;
    }
    if (this.state === "CONNECTED") return;
    await this.setHealth(
      "AUTHENTICATION_REQUIRED",
      "Fake adapter ready; not linked"
    );
  }

  async stop(): Promise<void> {
    this.stopped = true;
    this.clearConnectTimer();
    await this.setHealth("DISCONNECTED", "Fake adapter stopped");
  }

  async requestAuthentication(): Promise<void> {
    if (this.stopped) throw new Error("ADAPTER_STOPPED");
    if (this.linked) {
      // Reconnect path — a previously linked fake session comes straight back
      await this.connectNow("Fake adapter reconnected");
      return;
    }
    await this.setHealth(
      "AUTHENTICATION_REQUIRED",
      "Fake adapter awaiting pairing"
    );
  }

  /** Emit a fake pairing code, then flip to CONNECTED after a short tick. */
  async requestPairingCode(phoneE164: string): Promise<void> {
    if (this.stopped) throw new Error("ADAPTER_STOPPED");
    const phone = phoneE164.replace(/\D/g, "");
    if (!phone) throw new Error("INVALID_PHONE");

    this.clearConnectTimer();
    await this.setHealth(
      "AUTHENTICATION_REQUIRED",
      "Fake pairing code issued"
    );
    await this.events.onPairingCode?.({
      code: generateFakePairingCode(),
      phone,
      createdAt: nowIso(),
    });

    this.connectTimer = setTimeout(() => {
      this.connectTimer = null;
      if (this.stopped) return;
      void this.connectNow("Fake adapter connected");
    }, this.connectDelayMs);
  }

  async logout(): Promise<void> {
    this.clearConnectTimer();
    this.linked = false;
    await this.setHealth(
      "AUTHENTICATION_REQUIRED",
      "Logged out - pairing required"
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
    if (this.state !== "CONNECTED") {
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
    if (!input.waChatId?.trim()) {
      return {
        ok: false,
        clientRequestId,
        error: "Invalid waChatId",
        code: "INVALID_INPUT",
      };
    }

    const waMessageId = `FAKE-${randomUUID()}`;
    this.seenClientRequestIds.add(clientRequestId);
    this.sent.push({
      waMessageId,
      waChatId: input.waChatId,
      text,
      clientRequestId,
    });
    return { ok: true, waMessageId, clientRequestId };
  }

  /** E2E helper — messages "sent" through this adapter instance. */
  getSentMessages(): ReadonlyArray<{
    waMessageId: string;
    waChatId: string;
    text: string;
    clientRequestId: string;
  }> {
    return this.sent;
  }

  /** E2E helper — simulate an inbound text from `jid` (E.164 digits or JID). */
  async simulateInbound(
    text: string,
    jid = "963900000001@s.whatsapp.net"
  ): Promise<{ waMessageId: string }> {
    const remoteJid = jid.includes("@") ? jid : `${jid}@s.whatsapp.net`;
    const digits = remoteJid.split("@")[0]?.replace(/\D/g, "") ?? "";
    const waMessageId = `FAKE-IN-${randomUUID()}`;
    await this.events.onInboundText?.({
      waMessageId,
      waChatId: remoteJid,
      waRemoteJid: remoteJid,
      senderE164: digits || null,
      displayName: null,
      text,
      timestamp: nowIso(),
    });
    return { waMessageId };
  }

  /** E2E helper — force the connected state (no pairing). */
  async simulateConnect(): Promise<void> {
    await this.connectNow("Fake adapter connected");
  }

  private async connectNow(detail: string): Promise<void> {
    this.clearConnectTimer();
    this.linked = true;
    this.lastConnectedAt = nowIso();
    await this.setHealth("CONNECTED", detail);
  }

  private clearConnectTimer(): void {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
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

export function createFakeAdapter(
  events?: WhatsAppAdapterEvents,
  options: Omit<FakeWhatsAppAdapterOptions, "events"> = {}
): FakeWhatsAppAdapter {
  return new FakeWhatsAppAdapter({ ...options, events });
}
