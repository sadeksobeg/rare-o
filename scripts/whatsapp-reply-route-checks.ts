/**
 * Reply routing — the one resolver the admin composer and the send action
 * share. Run: npm run test:whatsapp-reply-route
 */
import {
  isPlatformOnlyChatId,
  isWhatsAppLive,
  resolveReplyRoute,
} from "../lib/whatsapp/messaging/reply-route";

let passed = 0;
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  passed += 1;
  console.log(`PASS: ${msg}`);
}

const live = { state: "CONNECTED", outboundEnabled: true, outboundKillSwitch: false };

assert(isWhatsAppLive(live), "connected + enabled + no kill switch is live");
assert(!isWhatsAppLive({ ...live, state: "DISCONNECTED" }), "disconnected is not live");
assert(!isWhatsAppLive({ ...live, state: "RECONNECTING" }), "reconnecting is not live");
assert(!isWhatsAppLive({ ...live, outboundEnabled: false }), "env outbound off is not live");
assert(!isWhatsAppLive({ ...live, outboundKillSwitch: true }), "kill switch is not live");

assert(
  resolveReplyRoute({ whatsappLive: true, hasPlatformAccount: false, platformOnly: false })
    .channel === "whatsapp",
  "live WhatsApp, no account → whatsapp"
);
assert(
  resolveReplyRoute({ whatsappLive: true, hasPlatformAccount: true, platformOnly: false })
    .channel === "whatsapp",
  "live WhatsApp, trader account → still whatsapp"
);
assert(
  resolveReplyRoute({ whatsappLive: false, hasPlatformAccount: true, platformOnly: false })
    .channel === "platform",
  "WhatsApp down, trader account → platform"
);
assert(
  resolveReplyRoute({ whatsappLive: false, hasPlatformAccount: false, platformOnly: false })
    .channel === "none",
  "WhatsApp down, no account → refused, never parked on the platform"
);
assert(
  resolveReplyRoute({ whatsappLive: true, hasPlatformAccount: true, platformOnly: true })
    .channel === "platform",
  "platform-only thread → platform even when WhatsApp is live"
);
assert(
  resolveReplyRoute({ whatsappLive: true, hasPlatformAccount: false, platformOnly: true })
    .channel === "none",
  "platform-only thread without an account → refused"
);
assert(isPlatformOnlyChatId("trader-abc@platform.local"), "platform.local id detected");
assert(!isPlatformOnlyChatId("963911122233@s.whatsapp.net"), "real JID is not platform-only");

console.log(`\nReply-route checks: ${passed} passed`);
