/**
 * Public WhatsApp module surface for the Next.js web process.
 *
 * Exports types, session path helpers, messaging services, and Week 3 wa.me handoff.
 * Does NOT export BaileysWhatsAppAdapter — that is worker-only.
 */

export {
  WHATSAPP_CONNECTION_STATES,
  isFakeWhatsAppAdapter,
  isOutboundEnabled,
  type WhatsAppAdapter,
  type WhatsAppAdapterEvents,
  type WhatsAppConnectionState,
  type WhatsAppHealth,
  type WhatsAppInboundMediaEvent,
  type WhatsAppInboundTextEvent,
  type WhatsAppInboundUnsupportedEvent,
  type WhatsAppPairingCodePayload,
  type WhatsAppQrPayload,
  type WhatsAppSendMediaInput,
  type WhatsAppSendTextInput,
  type WhatsAppSendTextResult,
} from "@/lib/whatsapp/types";

export {
  assertAuthDirNotPublic,
  authDirExists,
  createSessionStoreConfig,
  ensureAuthDir,
  hasAuthStateFiles,
  resolveWhatsAppAuthDir,
  type WhatsAppSessionStoreConfig,
} from "@/lib/whatsapp/session-store";

export {
  e164FromRemoteJid,
  normalizeUserJid,
  toE164Digits,
} from "@/lib/whatsapp/jid";

export {
  buildHandoffMessageText,
  buildWhatsAppDeepLink,
  getWhatsAppBusinessE164,
  prepareWhatsAppHandoff,
  type WhatsAppDeepLinkResult,
} from "@/lib/whatsapp/handoff-adapter";

export {
  dispatchOutboundMessage,
  dispatchPendingOutbound,
  enqueueOutboundMedia,
  enqueueOutboundText,
  persistInboundMedia,
  persistInboundText,
  applyContactIdentity,
  persistOutboundEcho,
  persistUnsupportedInbound,
  recoverInterruptedOutbound,
  seedConversationFromChat,
  claimOutboundForSend,
  sendOutboundText,
  upsertConnectionHealth,
} from "@/lib/whatsapp/messaging/service";

export {
  MAX_OUTBOUND_ATTEMPTS,
  STALE_SENDING_MS,
  MAX_BAILEYS_RECONNECT_ATTEMPTS,
} from "@/lib/whatsapp/messaging/reliability";

export {
  acquireOutboundSendSlot,
  assessOutboundEnqueue,
  getOutboundSafetyConfig,
  getOutboundSafetyStatus,
  recordOutboundSendFailure,
  recordOutboundSendSuccess,
  resetOutboundSafetyForTests,
} from "@/lib/whatsapp/outbound-safety";

export {
  formatConversationDisplayLabel,
  getInboxConversation,
  getInboxHealthView,
  listInboxConversations,
  markConversationRead,
} from "@/lib/whatsapp/messaging/inbox";

export {
  clearConversationBusinessLink,
  getBusinessContextForConversation,
  linkConversationToBusinessRecord,
  assertLinkTargetExists,
  setConversationCrmParty,
  suggestCrmPartiesForConversation,
} from "@/lib/whatsapp/messaging/linking";

export {
  WHATSAPP_ACTIVE_LINK_TYPES,
  WHATSAPP_LINK_TYPES,
  isWhatsAppActiveLinkType,
  isWhatsAppLinkType,
} from "@/lib/whatsapp/messaging/link-constants";

export {
  MAX_OUTBOUND_TEXT_LENGTH,
  WHATSAPP_CONNECTION_HEALTH_ID,
  WHATSAPP_MESSAGE_DIRECTIONS,
  WHATSAPP_MESSAGE_STATUSES,
  WHATSAPP_MESSAGE_TYPES,
} from "@/lib/whatsapp/messaging/constants";
