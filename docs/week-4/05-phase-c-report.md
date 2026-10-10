# Week 4 — Phase C Report

**Project B:** `D:\N I G H T\rare-oud-platform`  
**Status:** Phase C complete — **STOPPED**; awaiting approval before Phase D  
**Policy:** Real Admin Inbox on Phase B persistence — no mock inbox, no demo conversations, no business linking

---

## 1. What was implemented

Real **Admin WhatsApp Inbox** against persisted Conversations/Messages:

- `/admin/inbox` — conversation list + connection health + outbound kill-switch indicator
- `/admin/inbox/[id]` — chronological thread, inbound/outbound, failed state, text composer
- Server actions authorize every read/send with `requireAdminSession`
- Outbound uses Phase B `enqueueOutboundText` only (pending → worker → adapter → Baileys)
- AR/EN dictionary + RTL/LTR via existing locale cookie
- “Not linked” shown (Phase D linking not implemented)
- No Baileys / QR / session exposure to browser

---

## 2. Files changed / added

| Path | Action |
|---|---|
| `lib/whatsapp/messaging/inbox.ts` | added — list/get/markRead/health DTOs |
| `app/whatsapp-actions.ts` | added — auth-gated admin actions |
| `app/admin/(protected)/inbox/page.tsx` | added — list UI |
| `app/admin/(protected)/inbox/[id]/page.tsx` | added — detail + composer |
| `components/admin/inbox-composer.tsx` | added |
| `components/admin/inbox-health.tsx` | added |
| `components/admin/locale-toggle.tsx` | added |
| `components/admin/shell.tsx` | inbox nav + i18n labels |
| `app/admin/(protected)/page.tsx` | inbox shortcut |
| `lib/i18n/dictionaries.ts` | AR/EN inbox strings |
| `lib/whatsapp/index.ts` | export inbox helpers |
| `scripts/whatsapp-phase-c-checks.ts` | isolated tests |
| `package.json` | `test:whatsapp-phase-c` |
| `docs/week-4/05-phase-c-report.md` | this report |

---

## 3. Routes / UI

| Route | Purpose |
|---|---|
| `GET /admin/inbox` | Conversation list, health banner, kill-switch banner |
| `GET /admin/inbox/[id]` | Thread + composer; marks unread on open |

**UI structure**
1. Health banner (state + safe detail + outbound enabled/disabled)
2. List: display label, last preview, timestamp, unread, “Not linked”
3. Detail: chronological messages (inbound/outbound, status, failed `errorSafe`)
4. Composer: disabled when kill switch off; uses stable `clientRequestId` for retries

---

## 4. Authorization model

| Layer | Enforcement |
|---|---|
| Middleware | `/admin/*` requires admin-role JWT |
| `AdminShell` | `getAdminSession()` or redirect login |
| Server actions | `requireAdminSession()` on every inbox action |
| Trader JWT | Rejected by `verifyAdminSessionToken` (`role !== admin`) |

Actions return `UNAUTHORIZED` for unauthenticated callers — never trust client role checks alone.

---

## 5. Outbound flow

```
Admin composer
  → adminSendWhatsAppTextAction (requireAdminSession)
  → enqueueOutboundText (kill switch + clientRequestId uniqueness)
  → WhatsAppMessage status=pending
  → worker drain → WhatsAppAdapter → Baileys
```

- UI/API never imports Baileys adapter
- Duplicate `clientRequestId` returns existing row (no second message)
- Kill switch: UI blocks composer **and** server rejects enqueue

---

## 6. Connection-health flow

- Worker writes `WhatsAppConnectionHealth` via `upsertConnectionHealth`
- Inbox reads `getInboxHealthView()` — state, `detailSafe`, outbound flag only
- No QR, creds, session paths, or socket handles in responses

---

## 7. Tests and results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run test:whatsapp-phase-c` | PASS (34 assertions) |

Coverage: list/open/read, send enqueue, kill switch, failed visibility, duplicate idempotency, safe health, AR/EN dict, unauthorized actions, trader JWT rejected. Isolated temp DB only.

---

## 8. Security checks

- No session/QR/Baileys in client payloads or health DTO
- Baileys adapter remains worker-only
- Admin-only middleware + shell + action auth
- Outbound kill switch server-enforced
- Composer `clientRequestId` prevents duplicate inserts on retry

---

## 9. Known limitations

- Business linking / context panel = **Phase D**
- Live send requires worker connected + kill switch on (UI queues pending)
- No media composer (text only)
- Admin shell secondary nav labels (Traders/Deals/…) still EN-only strings
- No realtime websocket — refresh after send / reopen thread

---

## 10. Remains for Phase D

- Explicit link conversation → RetailRequest **or** DealProposal **or** WholesaleRequest
- Business context panel from real Week 3 records
- “Not linked” → linked detail; unlink
- No auto lifecycle from WhatsApp text

---

## Approval gate

**Do not start Phase D until explicit approval.**
