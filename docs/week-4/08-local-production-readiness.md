# Week 4 — Local Production Readiness Review

**Project B:** `D:\N I G H T\rare-oud-platform`  
**Scope:** Review of Phases A–E implementation (not reports alone)  
**Date:** 2026-10-05  
**Mode:** Readiness gate — no speculative code changes applied

---

## Overall verdict

**B1 (build blocker) is fixed.** `npm run build` now passes.

**VPS / QR / production WhatsApp session / deployment** still require a separate explicit GO — this remediation only clears the local production **build** gate. Hardening recommendations remain deferred.

Previously: NO-GO solely due to B1 build failure.

---

## A. BLOCKING DEFECTS

### B1 — Production build fails: ESLint false positive on Baileys `useMultiFileAuthState`

| Field | Detail |
|---|---|
| Location | `lib/whatsapp/baileys-adapter.ts` (~line 318) |
| Symptom | `npm run build` fails during “Linting and checking validity of types” |
| Error | `React Hook "useMultiFileAuthState" cannot be called in a class component` (`react-hooks/rules-of-hooks`) |
| Cause | Baileys exports a function named `useMultiFileAuthState`. It is **not** a React Hook. Next.js ESLint treats any `use*` call inside a class as illegal. |
| Impact | Production web build cannot complete → **blocks Stage B / VPS deploy**. Worker itself still runs via `tsx` (smoke OK). Typecheck (`tsc`) still passes. |
| Smallest safe fix (NOT APPLIED — awaiting approval) | Import with an alias that does not start with `use`: `import { useMultiFileAuthState as loadMultiFileAuthState } from "@whiskeysockets/baileys"` and call `loadMultiFileAuthState(...)`. Optionally add `serverExternalPackages: ["@whiskeysockets/baileys"]` later as hardening (not required for this lint failure). |
| Alternatives | Targeted `eslint-disable-next-line react-hooks/rules-of-hooks` on that call; or move adapter out of Next lint include. Alias is preferred (no rule weakening). |

**No other genuine blocking code defects were identified in this review.**

---

## Architecture review — PASS (with note)

| Check | Result |
|---|---|
| Next.js app does not import Baileys | **PASS** — `@whiskeysockets/baileys` only in `baileys-adapter.ts` |
| Baileys adapter not imported from `app/` or `components/` | **PASS** — only `worker/` + Phase A/E test scripts |
| Web barrel excludes adapter | **PASS** — `lib/whatsapp/index.ts` does not export adapter |
| Messaging service has no Baileys import | **PASS** |
| Linking only reads Week 3 domains | **PASS** — findUnique / include; no status transitions |
| WhatsApp is communication layer | **PASS** — soft `linkType`/`linkId`; no Order/CRM merge |
| No WhatsApp `app/api` routes | **PASS** — admin server actions only |

**Note:** `baileys-adapter.ts` lives under `lib/` and is therefore linted by `next build` even though it is worker-only (root cause of B1).

---

## Database review — PASS

| Item | Assessment |
|---|---|
| `waChatId` unique | Present — conversation identity |
| `waMessageId` unique (nullable) | Present — inbound idempotency |
| `clientRequestId` unique (nullable) | Present — outbound idempotency |
| Indexes | `lastMessageAt`, `linkType+linkId`, message `(conversationId, createdAt)`, status, direction |
| Soft business link | No FK into Retail/Deal/Wholesale — intentional; deleted targets → context shows unlinked |
| Cascades | Messages/audits cascade with conversation; **no** cascade into Week 3 domains |
| Week 3 models | Untouched by WhatsApp migrations beyond additive WA tables |
| Migrations | Additive only (`week4_phase_b/d/e`) |
| Transactions | Inbound upsert+create with P2002 handling; outbound claim via `updateMany` |
| Race | Unique constraints + claim `status=pending` filter mitigate double-insert / double-send |

**Ambiguity (documented, not invented-away):** If Baileys accepts a send and the process dies before `waMessageId` is persisted, recovery may retry and WhatsApp could receive a second message. Policy prefers bounded retry over silent loss. Acceptable for Stage A with operator awareness.

---

## Security review — PASS

| Check | Result |
|---|---|
| Admin middleware + shell + `requireAdminSession` on WA actions | PASS |
| Trader JWT rejected as admin | PASS (Week 3 + Phase C/D/E) |
| No public WhatsApp API routes | PASS |
| DTOs omit QR/session/creds | PASS (`InboxHealthView`, inbox messages) |
| QR not logged (presence log only) | PASS |
| `printQRInTerminal: false` | PASS |
| Session dir gitignored | PASS (`.wa-auth/`) |
| `assertAuthDirNotPublic` blocks `public/`, `.next/`, `node_modules/` | PASS |
| Kill switch multi-layer | PASS (UI, enqueue, dispatch/drain, adapter.sendText) |
| Link type allowlist | PASS — arbitrary model names rejected |
| IDOR trader domain filters intact | PASS |
| Messages do not mutate business domains | PASS (tests + code inspection) |

**Session storage — local vs VPS**

| Enforced locally in code | VPS-only / ops |
|---|---|
| Reject web-served path segments | OS user isolation, ACL |
| Prefer `0700` (best-effort; Windows may skip) | Enforce `0700` + non-web mount |
| No logging of creds/QR payload | Disk encryption, backups as secrets |
| Default `./.wa-auth` gitignored | Production `WHATSAPP_AUTH_DIR` outside web root |

**Hardening (non-blocking):** Web barrel still exports `claimOutboundForSend` / `dispatchOutboundMessage` / `recoverInterruptedOutbound`. Not used by UI; narrowing exports would reduce misuse surface.

---

## Reliability review — PASS (known limits)

| Area | Status |
|---|---|
| Inbound idempotency (DB unique + race) | PASS |
| Outbound claim `pending→sending` | PASS |
| Bounded retries (`MAX_OUTBOUND_ATTEMPTS=3`) | PASS |
| Stale `sending` recovery on worker start | PASS |
| Sent + `waMessageId` → no resend | PASS |
| Kill switch leaves pending (no silent drop) | PASS |
| Reconnect backoff + cap → ERROR | PASS |
| `RECONNECTING` distinct from CONNECTED | PASS |
| Worker alive ≠ CONNECTED (idle smoke) | PASS |
| Message order `waTimestamp, createdAt, id` | PASS |

**Stale health after worker crash:** DB may retain last `CONNECTED` until a live worker writes again. Misleads operators briefly; enqueue still works, dispatch requires live CONNECTED + kill switch. **Hardening:** heartbeat / stale-threshold in UI or worker — not classified as blocking security defect.

---

## Business-domain isolation — PASS

WhatsApp inbound/outbound paths do not call retail/deal/wholesale mutation APIs. Linking reads only. Regression + Phase D/E tests confirm no auto-create / no auto status change from messages.

---

## Linking review — PASS

One primary link; allowlist; existence check; admin-only; audit set/change/clear; no phone auto-match; no multi-link.

---

## Admin UX review — PASS (operational)

AR/EN inbox + link/context strings; RTL via root locale; list/detail responsive grid; failed/pending/sending/outbound-disabled/health/not-linked visible. No CRM added.

**Hardening:** attemptCount not shown in UI (status + errorSafe sufficient for Stage A).

---

## Dependency review — PASS

| Package | Version |
|---|---|
| `@whiskeysockets/baileys` | **6.7.24** exact (package.json + installed) |

No extra WhatsApp Cloud API packages. No dependency upgrades performed in this review.

---

## Complete test results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** |
| `npm run test:week3` | **PASS** (58) |
| `npm run test:wholesale-security` | **PASS** |
| `npm run test:whatsapp-phase-a` | **PASS** |
| `npm run test:whatsapp-phase-b` | **PASS** (48) |
| `npm run test:whatsapp-phase-c` | **PASS** (34) |
| `npm run test:whatsapp-phase-d` | **PASS** (46) |
| `npm run test:whatsapp-phase-e` | **PASS** (41) |
| Worker idle smoke (`connectOnStart=false`) | **PASS** — AUTHENTICATION_REQUIRED, no socket |
| `npm run build` | **FAIL** — defect **B1** |

Web app can render Admin Inbox from DB without a live worker (by design). Worker runs independently via `npm run worker:whatsapp`.

---

## B1 remediation (2026-10-05)

**Status:** Applied (minimal alias only).

| Change | `useMultiFileAuthState as loadMultiFileAuthState` in `baileys-adapter.ts` |
|---|---|
| Behavior | Unchanged — same Baileys API |
| Other hardening | Not applied |

### Re-verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run test:whatsapp-phase-a` | PASS |
| `npm run test:whatsapp-phase-e` | PASS |

**Note:** GO/NO-GO for VPS/QR remains a separate explicit approval after this build gate.

---

## B. HARDENING RECOMMENDATIONS (non-blocking)

1. After B1 fix: consider `serverExternalPackages: ["@whiskeysockets/baileys"]` so Next never mistakenly bundles Baileys.
2. Narrow web exports — omit claim/dispatch/recover from `lib/whatsapp/index.ts`.
3. Connection health staleness indicator (updatedAt age) in Admin Inbox.
4. Show outbound `attemptCount` in failed/pending message metadata.
5. Strengthen `assertAuthDirNotPublic` against unusual path spellings if deploy paths grow.
6. Document operator runbook for uncertain outbound delivery (crash after Baileys ack).
7. Optional: exclude `lib/whatsapp/baileys-adapter.ts` from Next ESLint project if kept under `lib/`.

---

## C. PRODUCTION ENVIRONMENT ITEMS (not code defects)

- Hostinger VPS always-on host
- Process manager (systemd/PM2/Docker) for Next + worker
- Production `WHATSAPP_AUTH_DIR` on private durable disk
- Production secrets (`AUTH_SECRET`, DB, env flags)
- Real WhatsApp QR authentication
- Production Baileys session backup/restore (encrypted)
- Monitoring / alerting on worker death & health ERROR
- Domain + TLS (Stage B)
- Deployment pipeline
- OS permissions on auth directory

---

## Explicit GO / NO-GO

| Gate | Decision |
|---|---|
| Local production **build** gate (B1) | **CLEARED** — `npm run build` PASS after alias fix |
| Move to VPS / QR / production WA session / deploy | **Awaiting explicit approval** (not auto-GO) |

**Code changes for B1:** import alias only in `lib/whatsapp/baileys-adapter.ts`. No other hardening applied.
