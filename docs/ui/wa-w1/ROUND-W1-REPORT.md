# WA-W1 Realtime — evidence report

Branch: `wa/w1-realtime`  
Deploy: **not deployed** (owner review required)

## Decision
Postgres `LISTEN/NOTIFY` on channel `rareoud_wa_inbox` + durable `WhatsAppInboxEvent` for `Last-Event-ID` resume. No Redis.

## Additive migration
`20261110143000_wa_w1_realtime_outbox`
- `WhatsAppInboxEvent` (id, type, payloadJson, createdAt)
- `WhatsAppMessage.nextRetryAt`
- `WhatsAppConnectionHealth.outboundKillSwitch`

## Sequence (send → ticks live)

| Step | UI | Source |
|------|-----|--------|
| 1 | Composer clears; bubble appears with clock/`sending` | Optimistic client `clientRequestId` |
| 2 | Tick → pending/sending | SSE `message.status` / action reconcile |
| 3 | Tick → single ✓ `sent` | Worker dispatch + SSE |
| 4 | Tick → ✓✓ `delivered` | Baileys ack → `recordOutboundStatusUpdate` + SSE |
| 5 | No full-page poll every 2.5s | Polling removed; EventSource `/api/admin/inbox/events` |

See `SEQUENCE.md` for the annotated frame list (screenshot stand-in until browser capture on review).

## Tests
```
npm run test:whatsapp-w1
```
Results (local): rate limit, kill switch, cold-number block, dedupe, backoff delays, delivered status, SSE resume list — **OK**.

## Safety
- Enqueue: ≤1/s per chat, ≤20/min global (after idempotency check)
- Existing anti-ban slot (~8s) unchanged
- Admin `allowCreateConversation: false`
- Emergency stop: `adminSetOutboundKillSwitchAction` (DB flag, no restart)

## Stop
Await owner OK before merge/deploy. WhatsApp session store untouched.
