# Week 4 — Phase B Report

**Project B:** `D:\N I G H T\rare-oud-platform`  
**Status:** Phase B complete — **STOPPED**; awaiting approval before Phase C  
**Policy:** No mock provider, no fake WhatsApp business data, no demo conversations in app DB

---

## 1. What was implemented

Real WhatsApp **communication-domain persistence** and **message flow**:

- Prisma models: `WhatsAppConversation`, `WhatsAppMessage`, `WhatsAppConnectionHealth`
- Non-destructive migration applied
- Messaging application service (adapter-agnostic; no Baileys imports)
- Inbound: Baileys → adapter events → service → DB
- Outbound: enqueue (DB pending) → adapter dispatch → sent/failed
- Kill switch enforced at application enqueue + dispatch (and still in adapter)
- Worker wired to service layer (not raw Prisma in event handlers)
- Unsupported non-text inbound recorded safely (`messageType=unsupported`)
- Isolated Phase B integration tests (temp SQLite; no pollution of dev DB)

**Not in Phase B:** Admin Inbox UI, business linking, QR auth, VPS.

---

## 2. Final data model

### `WhatsAppConversation`
| Field | Role |
|---|---|
| `id` | App primary key |
| `waChatId` | **Unique** WhatsApp 1:1 chat JID (conversation identity) |
| `remoteJid` | Remote JID mirror |
| `participantE164` | Digits when known |
| `displayName` | Push name when available |
| `lastMessageAt` / `lastMessagePreview` / `unreadCount` | List metadata |
| `createdAt` / `updatedAt` | Timestamps |

No `linkType` / `linkId` yet (Phase D).

### `WhatsAppMessage`
| Field | Role |
|---|---|
| `direction` | `inbound` \| `outbound` |
| `messageType` | `text` \| `unsupported` |
| `body` | Text or `[unsupported:…]` |
| `waMessageId` | **Unique** Baileys id (inbound idempotency; outbound after send) |
| `clientRequestId` | **Unique** admin intent id (outbound idempotency) |
| `status` | `received` \| `pending` \| `sent` \| `failed` |
| `errorSafe` | Operator-safe failure text (no secrets) |
| `waTimestamp` / `adminId` / timestamps | Metadata |

### `WhatsAppConnectionHealth`
Singleton row `id=default` — state + safe detail + `lastConnectedAt`. Never stores QR/session.

---

## 3. Migration

- Name: `20261005143754_week4_phase_b_whatsapp_messaging`
- Path: `prisma/migrations/20261005143754_week4_phase_b_whatsapp_messaging/migration.sql`
- Additive only — Week 3 models unchanged

---

## 4. Application / service boundaries

```
BaileysWhatsAppAdapter (worker-only)
        ↓ events
lib/whatsapp/messaging/service.ts
        ↓ Prisma
WhatsAppConversation / WhatsAppMessage / WhatsAppConnectionHealth
```

| Layer | Responsibility |
|---|---|
| `baileys-adapter.ts` | Transport only |
| `messaging/service.ts` | Persist inbound, enqueue/dispatch outbound, health mirror |
| `worker/whatsapp-worker.ts` | Owns socket; calls service; drains pending outbound |
| Next.js web | May call enqueue later (Phase C); must **not** import Baileys adapter |

---

## 5. Inbound flow

1. Baileys `messages.upsert`
2. Adapter extracts text **or** emits unsupported
3. `persistInboundText` / `persistUnsupportedInbound`
4. Upsert conversation by `waChatId`
5. Insert message; unique `waMessageId` → duplicates ignored

---

## 6. Outbound flow

1. `enqueueOutboundText` (kill switch checked) → conversation upsert + `pending` message with unique `clientRequestId`
2. `dispatchOutboundMessage(adapter, messageId)` → `adapter.sendText`
3. On success → `sent` + `waMessageId`
4. On transport failure → `failed` + `errorSafe` (never claimed sent)
5. Worker polls pending when connected + kill switch on

`sendOutboundText` = enqueue + dispatch (for callers holding an adapter).

---

## 7. Idempotency strategy

| Event | Key | Enforcement |
|---|---|---|
| Inbound | `waMessageId` | DB `@unique` + find-before-insert + P2002 race handling |
| Outbound | `clientRequestId` | DB `@unique`; duplicate returns existing; no second send if already `sent` |
| Conversation | `waChatId` | DB `@unique` upsert |
| Worker restart | same keys | DB is source of truth (in-memory adapter sets are secondary only) |

At-least-once Baileys delivery is assumed.

---

## 8. Failure handling

- Empty/malformed inbound → rejected, no row
- Unsupported media/etc. → `unsupported` row, worker continues
- Outbound transport fail → `failed`, no `waMessageId`
- Kill switch off → enqueue rejected; dispatch leaves `pending` (no false permanent fail)
- Health persist errors logged; worker does not crash

---

## 9. Security considerations

- Phase A session/QR rules unchanged
- Health/messages never store auth/QR/creds
- Baileys adapter still excluded from web barrel
- No business-domain auto-link
- Outbound disabled by default
- Tests use isolated DB only

---

## 10. Tests performed

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run test:whatsapp-phase-a` | PASS |
| `npm run test:whatsapp-phase-b` | PASS (47 assertions) |

Coverage includes: first/second inbound, duplicate `waMessageId`, restart replay, unsupported + duplicate, malformed reject, timestamps, outbound sent, failure, offline, kill switch enqueue/dispatch, no Week 3 pollution, no creds in message JSON.

Test double implements `WhatsAppAdapter` **inside the test script only** — application has no mock provider branch.

---

## 11. Known limitations

- Admin Inbox UI not built (Phase C)
- Business linking not built (Phase D)
- No real Baileys QR/session exercised
- Outbound from Next.js → worker is DB pending queue (admin composer comes in Phase C)
- Delivery receipts beyond sent/failed not modeled
- Group chats ignored by adapter

---

## 12. Production-specific items still deferred

- Hostinger VPS / process manager
- Production `WHATSAPP_AUTH_DIR` + secrets
- Real WhatsApp QR authentication / production session
- Session backup/restore
- Final deployment
- Hardening of worker↔web channel if moved beyond DB queue

---

## Files changed / added

| Path | Action |
|---|---|
| `prisma/schema.prisma` | WhatsApp models |
| `prisma/migrations/20261005143754_week4_phase_b_whatsapp_messaging/` | migration |
| `lib/whatsapp/messaging/constants.ts` | added |
| `lib/whatsapp/messaging/service.ts` | added |
| `lib/whatsapp/types.ts` | unsupported event |
| `lib/whatsapp/baileys-adapter.ts` | unsupported emit |
| `lib/whatsapp/index.ts` | export messaging API |
| `worker/whatsapp-worker.ts` | service wiring + outbound drain |
| `scripts/whatsapp-phase-b-checks.ts` | isolated tests |
| `package.json` | `test:whatsapp-phase-b` |
| `docs/week-4/04-phase-b-report.md` | this report |

---

## Approval gate

**Do not start Phase C until explicit approval.**
