/**
 * Unit checks for lib/whatsapp/outbound-safety.ts (no phone / no Baileys).
 */
import assert from "node:assert/strict";
import {
  acquireOutboundSendSlot,
  assessOutboundEnqueue,
  clearPersistedSafetyStateForTests,
  getOutboundSafetyStatus,
  recordOutboundSendFailure,
  resetOutboundSafetyForTests,
} from "../lib/whatsapp/outbound-safety";

async function main() {
  // Gap off for burst/daily checks (production default remains 8000 via module).
  process.env.WHATSAPP_OUTBOUND_MIN_GAP_MS = "0";
  process.env.WHATSAPP_OUTBOUND_JITTER_MS_MAX = "0";
  process.env.WHATSAPP_OUTBOUND_WINDOW_MS = "60000";
  process.env.WHATSAPP_OUTBOUND_WINDOW_MAX = "3";
  process.env.WHATSAPP_OUTBOUND_DAILY_MAX = "5";
  process.env.WHATSAPP_OUTBOUND_MAX_WAIT_MS = "0";
  process.env.WHATSAPP_OUTBOUND_CIRCUIT_FAILURES = "3";
  process.env.WHATSAPP_OUTBOUND_CIRCUIT_WINDOW_MS = "60000";

  resetOutboundSafetyForTests();

  assert.equal(assessOutboundEnqueue().ok, true, "enqueue allowed initially");

  const a = await acquireOutboundSendSlot();
  assert.equal(a.ok, true, "first slot acquired");
  const b = await acquireOutboundSendSlot();
  assert.equal(b.ok, true, "second slot acquired");
  const c = await acquireOutboundSendSlot();
  assert.equal(c.ok, true, "third slot acquired");

  const blocked = await acquireOutboundSendSlot();
  assert.equal(blocked.ok, false, "fourth blocked by window");
  if (!blocked.ok) {
    assert.equal(blocked.code, "RATE_LIMITED");
  }

  resetOutboundSafetyForTests();
  process.env.WHATSAPP_OUTBOUND_WINDOW_MAX = "50";
  process.env.WHATSAPP_OUTBOUND_DAILY_MAX = "2";

  assert.equal((await acquireOutboundSendSlot()).ok, true);
  assert.equal((await acquireOutboundSendSlot()).ok, true);
  const dayBlock = await acquireOutboundSendSlot();
  assert.equal(dayBlock.ok, false, "daily cap blocks");
  if (!dayBlock.ok) assert.equal(dayBlock.code, "RATE_LIMITED");

  resetOutboundSafetyForTests();
  process.env.WHATSAPP_OUTBOUND_MIN_GAP_MS = "80";
  process.env.WHATSAPP_OUTBOUND_DAILY_MAX = "100";
  process.env.WHATSAPP_OUTBOUND_WINDOW_MAX = "50";
  process.env.WHATSAPP_OUTBOUND_MAX_WAIT_MS = "20";
  assert.equal((await acquireOutboundSendSlot()).ok, true, "gap: first ok");
  const gapBlock = await acquireOutboundSendSlot();
  assert.equal(gapBlock.ok, false, "gap pacing blocks when maxWait too short");
  if (!gapBlock.ok) assert.equal(gapBlock.code, "RATE_LIMITED");

  resetOutboundSafetyForTests();
  process.env.WHATSAPP_OUTBOUND_MIN_GAP_MS = "0";
  process.env.WHATSAPP_OUTBOUND_MAX_WAIT_MS = "0";
  process.env.WHATSAPP_OUTBOUND_CIRCUIT_FAILURES = "3";
  recordOutboundSendFailure();
  recordOutboundSendFailure();
  assert.equal(assessOutboundEnqueue().ok, true, "circuit still closed");
  recordOutboundSendFailure();
  const circuit = assessOutboundEnqueue();
  assert.equal(circuit.ok, false, "circuit opens");
  if (!circuit.ok) assert.equal(circuit.code, "SAFETY_CIRCUIT");

  const status = getOutboundSafetyStatus();
  assert.equal(status.circuitOpen, true);

  // Leave no persisted rate-limit state behind for the next real run.
  await clearPersistedSafetyStateForTests();

  console.log("PASS: whatsapp-outbound-safety-checks");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
