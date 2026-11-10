# WA-W1 Realtime — evidence report (review pass)

Branch: `wa/w1-realtime`  
Deploy: **not deployed** (owner review required)

## Decision
Postgres `LISTEN/NOTIFY` on channel `rareoud_wa_inbox` + durable `WhatsAppInboxEvent` for `Last-Event-ID` resume. No Redis.

## Additive migrations
1. `20261110143000_wa_w1_realtime_outbox` — events table, `nextRetryAt`, kill flag  
2. `20261110190000_wa_w1_review_hardening` — kill who/when/reason + `outboundGlobalRatePerMin`

## Review fixes (this pass)
1. **Real screenshots** — `docs/ui/wa-w1/shots/frame-*.png` from `/dev/wa-w1-evidence` (simulated worker, no real send). See `SEQUENCE.md`.
2. **Emergency-stop UI** — connection sheet button + confirm + reason; thread banner «الإرسال موقوف طارئاً» with who/when/reason; reversible resume confirm. Admin session only.
3. **SSE hardening** — `X-Accel-Buffering: no`, `Cache-Control: no-cache`, `: ping` every 25s, client reconnect with `?after=` / Last-Event-ID, per-session connection cap (default 3), 401/403 mapping tests.
4. **Ops** — cleanup job deletes `WhatsAppInboxEvent` &gt;48h; sending watchdog every 60s recovers `sending` &gt;2min → pending(+nextRetryAt)/failed + SSE; global rate configurable (DB + env `WHATSAPP_OUTBOUND_GLOBAL_RATE_PER_MIN`, default 20).

## Tests
```
npm run test:whatsapp-w1
```
Result: **OK** — sse auth 401/403, session cap, configurable rate, per-chat rate, kill switch + actor, cold block, dedupe, backoff, status+resume, stuck-sending watchdog, event cleanup 48h.

## Stop
Await owner OK before merge/deploy. WhatsApp session store untouched. No production deploy from this pass.
