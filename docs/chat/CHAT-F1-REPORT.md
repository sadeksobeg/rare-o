# CHAT-F1 — report (stop for owner deploy OK)

**Branch:** `chat/f1-fixes` (from WA-V `b391344`)  
**Date:** 2026-11-11  
**Deploy:** **not done** — waiting for written approval after this report.  
**Migrations applied:** none.

## Fix table

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | P0 ownership guard + isolate + conflict tag/audit + inbox badge | **DONE** | `ensureTraderConversation` never writes into another trader's JID; `phone-conflict` tag + audit; list `!` badge |
| 1b | App-level one conversation / traderId | **DONE** | `findFirst` by traderId |
| 1c | Unique index migration | **PROPOSED only** | `docs/chat/UNIQUE-TRADERID-INDEX-PROPOSAL.md` — do not apply |
| 1d | Prod read-only counts SQL | **DONE (not run)** | `docs/chat/PROD-OWNERSHIP-COUNTS.sql` — wait for VPS OK |
| 2 | `publishInboxEvent` on trader/admin platform sends | **DONE** | `message.new` + `conversation.updated` (ids/preview only) |
| 3 | Trader ~8s poll + backoff + badge via refresh | **DONE** | `/api/trader/messages/cursor` + `useTraderMessagesPoll` |
| 4 | Admin channel chips / composer channel / fallback toast / optimistic channel / media blocked toast | **DONE** | rad inbox bubbles + `platformFallback` on text action |
| 5 | Trader send rate limit ~20/min + AR error | **DONE** | `trader-send-rate-limit.ts` |
| A | 390 composer above tab bar | **DONE** (verify shots) | fixed composer via `.rad-above-tab` under ≤900 |
| B | Own-bubble contrast AA | **DONE** | forced `#fffcf8` on `#7a44b3` / light `#32104f` |
| C | Mark read on open + WA media placeholder | **DONE** | `markTraderMessagesRead` before fetch; `whatsappMediaUnavailable` |
| D | Header «غير مرتبط» → deal sense + trader chip | **DONE** | `notLinked` = «بلا صفقة»; shows «تاجر مرتبط» when `crm.trader` |

## Tests

| Test | Result |
|------|--------|
| `npx tsx scripts/chat-f1-checks.ts` (same-phone isolate, IDOR, rate, mark-read) | **18 passed, 0 failed** |
| `scripts/chat-f1-trader-gate.mjs` | **PASS** — composer above tab; own-bubble contrast **6.21:1** (dark+light) |
| `scripts/wa-v-inbox-overlay-gate.mjs` | PARTIAL locally (overflow menu selector); WA-V already live on prod |
| Seed | local DB only |

## Production queries (await owner)

File: [`docs/chat/PROD-OWNERSHIP-COUNTS.sql`](./PROD-OWNERSHIP-COUNTS.sql)  
**Do not run until you confirm VPS access in chat.** Counts only, no PII.

## Migration proposal (await owner)

[`docs/chat/UNIQUE-TRADERID-INDEX-PROPOSAL.md`](./UNIQUE-TRADERID-INDEX-PROPOSAL.md) — partial unique on `traderId` WHERE NOT NULL. **Not applied.**

## Screenshots (≤10) — what I SEE

| File | What I SEE |
|------|------------|
| `docs/ui/wa-v/ROUND-V-DEPLOY.md` | WA-V **deployed** prod @ `b391344`; health 200; PP mic; QR templates = 8 |
| `docs/chat/shots/f1-390-before-composer-hidden.png` | 390 before pin: message stack then tab bar — **no usable composer** |
| `docs/chat/shots/f1-trader-390-composer.png` | Composer strip sitting **above** the 5-tab rail; purple own bubbles with cream text |
| `docs/chat/shots/f1-trader-390-dark.png` | Same thread after forcing dark theme — cream-on-plum still readable |
| `docs/chat/shots/f1-admin-channel-chips.png` | Admin rad thread: channel chips on bubbles + composer channel hint |

## WA-V first (done this session)

See `docs/ui/wa-v/ROUND-V-DEPLOY.md`. Smoke OK. Separate from CHAT-F1 ship.

## Stop

No CHAT-F1 deploy. No ownership SQL on prod until you say so. No unique-index migration until you approve after counts.
