# Week 4 — Phase E Report

**Project B:** `D:\N I G H T\rare-oud-platform`  
**Status:** Phase E complete — **STOPPED**; awaiting approval before next phase  
**Scope:** Reliability, idempotency, recovery, operational safety — no deploy / QR / VPS

---

## 1. Reliability changes

| Area | Change |
|---|---|
| Outbound states | `pending` → `sending` → `sent` \| return `pending` \| `failed` |
| Claim | Atomic `pending`→`sending` via `updateMany` (no double dispatch) |
| Attempts | `attemptCount` + `lastAttemptAt` on `WhatsAppMessage` |
| Recovery | `recoverInterruptedOutbound` on worker start |
| Reconnect | Explicit `RECONNECTING` health; capped attempts → `ERROR` |
| Ordering | Messages ordered by `waTimestamp`, `createdAt`, `id` |
| Kill switch | Enforced at enqueue, dispatch, and **adapter.sendText** |

Migration: `20261005145359_week4_phase_e_outbound_reliability`

---

## 2. Retry / recovery behavior

**Policy (conservative):**
- `MAX_OUTBOUND_ATTEMPTS = 3`
- `STALE_SENDING_MS = 2 minutes`
- No aggressive loops; no uncontrolled resend

| Situation | Behavior |
|---|---|
| Transport `SEND_FAILED`, attempts remaining | Back to `pending` with safe error |
| Attempts exhausted | `failed` — manual review |
| `NOT_CONNECTED` / kill switch mid-send | Back to `pending` (not lost) |
| Interrupted `sending` + no `waMessageId` | Recover → `pending` (if budget left) |
| Interrupted `sending` + `waMessageId` present | Mark `sent` — **do not resend** |
| Uncertain delivery without id | Documented: treated as retryable until max attempts; never blind infinite retry |

**Inbound idempotency (audited):** DB unique `waMessageId` + find-before-insert + P2002 race handling. In-memory adapter set is secondary only.

---

## 3. Worker lifecycle

1. Start → `recoverInterruptedOutbound()`
2. Start Baileys adapter (connect optional)
3. Persist health / inbound via messaging service
4. Poll pending drain only if `CONNECTED` **and** kill switch on
5. SIGINT/SIGTERM → stop socket cleanly

Worker alive ≠ `CONNECTED` (idle without socket reports auth/disconnected).

---

## 4. Connection health

States: `DISCONNECTED` | `CONNECTING` | `RECONNECTING` | `CONNECTED` | `AUTHENTICATION_REQUIRED` | `ERROR`

- Transient close → `RECONNECTING` with backoff (max 60s, max 10 attempts)
- Exhausted reconnect → `ERROR` (manual intervention)
- Logged out / QR needed → `AUTHENTICATION_REQUIRED`
- QR never logged; health DTO stores `detailSafe` only

---

## 5. Kill-switch enforcement

`WHATSAPP_OUTBOUND_ENABLED=false` blocks:
1. `enqueueOutboundText`
2. `dispatchOutboundMessage` / `dispatchPendingOutbound`
3. `BaileysWhatsAppAdapter.sendText` (final boundary)

Pending rows remain; no transmission.

---

## 6. Security regression

Covered in Phase E suite:
- Unauth cannot list/send
- Trader JWT ≠ admin
- Arbitrary link type rejected
- Messages do not mutate/create business domains
- Health/session free of QR/creds
- No Baileys in browser path

---

## 7. Tests and results

| Suite | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `test:whatsapp-phase-b` | PASS (48) — updated for retry policy |
| `test:whatsapp-phase-e` | PASS (41) |

Phase E coverage: duplicate inbound/outbound, ordering, kill switch (dispatch + adapter), interrupted recovery, bounded retry, claim race, health transitions, reconnect bounds, auth regression, no lifecycle mutation, i18n.

---

## 8. Remaining production-only items

- Hostinger VPS / process manager
- Production secrets + `WHATSAPP_AUTH_DIR`
- Real WhatsApp QR authentication / session
- Session backup/restore
- Final deployment
- Optional: richer admin visibility for attempt counts (UI shows status/error already)

**Not in Phase E (deferred by design):** media, realtime push, CRM, AI, multi-link, phone auto-match, deploy.

---

## Files touched

- `prisma/schema.prisma` + migration
- `lib/whatsapp/messaging/{reliability,constants,service,inbox}.ts`
- `lib/whatsapp/{types,baileys-adapter,index}.ts`
- `worker/whatsapp-worker.ts`
- `components/admin/inbox-health.tsx`
- `app/admin/(protected)/inbox/[id]/page.tsx`
- `lib/i18n/dictionaries.ts`
- `scripts/whatsapp-phase-{b,e}-checks.ts`
- `package.json`
- `docs/week-4/07-phase-e-report.md`

---

## Approval gate

**Do not start the next phase until explicit approval.**
