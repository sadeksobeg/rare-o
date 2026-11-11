# CHAT-F2 — unify

**Branch / label:** `chat/f2-unify` → prod as `chat-f2-unify-local`  
**Date:** 2026-11-12  
**Deploy:** **live** — see `docs/chat/CHAT-F2-DEPLOY.md`. Rollback `rare-oud-web:pre-chat-f2-20261111-230022`.  
**Pending:** read-only `TEST_PHONE` simulation (owner provides number); no trader phone write.

## Checks

`npx tsx scripts/chat-f2-checks.ts` → **43 passed** (was 32; +abort +ownership guards).

### Atomicity (gap 2)

- Merge runs inside `prisma.$transaction`.
- Test `__testAbortAfter: "messages"` throws `TEST_ABORT_MERGE` after `updateMany` moves messages and **before** notes/delete/tags.
- After abort: conversation count, message locations, notes, unread, tags **unchanged** (full rollback).

### Wrong-merge undo (report)

| Path | What it gives |
|------|----------------|
| Audit `whatsapp.unify_merge` | `traderId`, `primaryId`, `secondaryIds[]`, `messagesMoved` |
| Practical reverse | **`pg_dump` before deploy** (or restore `rareoud-pre-chat-f1-…` style dump) — secondaries are **deleted**; messages only live on primary |
| Audit alone | **Not enough** to rebuild deleted `waChatId` rows (audit stores ids, not the secondary JIDs/bodies snapshot) |

So: transaction prevents half-merge; undoing a *successful wrong* merge needs DB backup, not audit replay.

### Ownership guards (confirmed in tests)

- `unifyTraderConversations(traderId)` only loads `where: { traderId }` → **never** pulls `traderId=null` orphans.
- `autoLinkConversationByResolvedPhone` returns `linked:false` if conversation already owned by another trader.
- Unify of trader A does **not** mutate trader B’s conversation.

## LID outbound (gap 3 — report only)

**Baileys:** `@whiskeysockets/baileys@6.7.24`

**When is primary `@lid`?** Scoring: phone JID `300` > LID `200` > `platform.local` `50`. So LID is primary only if there is **no** `…@s.whatsapp.net` row (e.g. LID + platform shell). If a phone JID exists, it wins (as in seed shots).

**Send path (no rewrite to phone):**

1. Admin enqueue / worker claim → `claimOutboundForSend` returns `waChatId: row.conversation.waChatId` (**not** `remoteJid`).
2. `dispatchOutboundMessage` → `adapter.sendText({ waChatId })` or `sendMedia`.
3. `BaileysAdapter.sendText` → `normalizeUserJid(waChatId)` (**passes `@lid` through**) → `sock.sendMessage(jid, { text })`.

`applyContactIdentity` may set `remoteJid` to the phone JID on a LID row, but **outbound ignores `remoteJid`** today.

**If send fails — admin sees:**

- Compose-time (WA down / outbound paused): new reply is **platform** with chip «عبر المنصة» (`replyUsesPlatform` in `thread.tsx`).
- After enqueue as WhatsApp: failure → status `failed` or parked `pending` + `errorSafe`; bubble shows failed state + retry — **no silent flip to platform** after a WA attempt.

## Feature shots (gap 1)

Fake local data. Honest SEE lines in `docs/chat/shots/f2/FEATURE-NOTES.md`.

| File | What you SEE |
|------|----------------|
| `shots/f2/f2-merged-admin-1440.png` | One Demo Trader thread; WA + platform chips; F2-WA/F2-PLAT bodies in order |
| `shots/f2/f2-merged-trader-1440.png` | Same dual-channel thread on `/trader/messages` |
| `shots/f2/f2-empty-phone-admin-1440.png` | «تاجر بلا هاتف» platform-only; no WA merge |
| `shots/f2/f2-empty-phone-orphan-lid-1440.png` | «LID بلا ربط» separate, unlinked |
| `shots/f2/f2-merged-trader-390.png` | Dual-channel + composer above tabs (gap≈19px) |

Banner shots kept.

## Prod dry-run (unchanged)

```json
{ "tradersChecked": 1, "mergesNeeded": 0, "details": [] }
```

## Owner-only (not done by agent)

1. Open prod `/admin/inbox` after F1.1 — your smoke.
2. WA-V mic/image/voice: connect from inbox connection sheet on **your personal number**, then report result.
3. Do **not** put trader phone on prod until F2 deploy is approved.

## STOP

No F2 deploy. No migration. Waiting on your review of these shots + LID/atomicity answers, then explicit deploy OK if you want it.
