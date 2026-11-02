# Independent Verification Audit — Phase 5 (Admin operations)

**Mode:** read-only verification. No fixes, commits, migrations, or pushes were made.

**Scope-change note (mid-audit, from the dispatching session):** the original brief asked for
live browser/HTTP click-testing of OPS-01..OPS-04 (as `AUDIT-PHASE-1.md` did for Phase 1). That
was explicitly revoked partway through this audit to save cost — see "Live testing was
descoped" below. Everything marked **"verified by code tracing"** in this report was *not*
clicked in a real browser; it was confirmed by reading the exact component/action/query code
end to end. Anything I could not fully confirm that way is called out explicitly rather than
guessed.

**Environment correction (mid-audit):** this agent's worktree was initially on an unrelated
branch (`worktree-agent-ac342a224a7a2e5f1`, G0–G3 CI/security work, no relation to the phased UI
build). It was moved to a detached `HEAD` at `138a430` — the actual current tip of
`phase/09-hardening`, a descendant of `3aad9c3` — before any review began. All findings below
are against `138a430`.

**Scope read:** `docs/ui-planning/MASTER-BUILD-PLAN.md` Part B (Definition of Done) and Part C3
(OPS-01..OPS-04); `docs/ui-planning/DECISIONS-ADDENDUM.md` "Phase 5 (Admin ops)" and "Standing
rule — WhatsApp number survival" sections; `docs/ui-planning/evidence/phase-05-admin-ops.md`;
`CLAUDE.md`'s WhatsApp rule; the actual code under `app/admin/(protected)/{inbox,requests,deals,
wholesale}`, `components/admin/*`, `lib/whatsapp/*`.

---

## 0. Live testing was descoped — what that means for this report

A throwaway admin (`audit-phase5-throwaway@rareoud.test`, created directly via Prisma, **never**
the real seeded admin) was created and used for a brief live login + `/admin/inbox` check before
the scope change arrived. That account and the two throwaway scripts used to create/delete it
(`scripts/tmp-audit-phase5-admin.ts`, `scripts/tmp-audit-phase5-cleanup.ts`) have been **deleted**;
`git status` is clean. No OPS-02/03/04 live interaction (kanban drag, deal detail, wholesale
tracker) was performed — those are verified by code tracing only, as instructed.

That brief live check is *why* §1 below exists — it is what surfaced the Critical finding.　It
was not optional background: without it, the environment-level kill-switch violation in §1 would
likely not have been caught by code review alone, since every file *in the repo* (code,
`.env.example`, docs) is correct. Full detail in §1.

---

## 1. CRITICAL — the real `.env` in this machine's main checkout has the WhatsApp kill switch OFF (i.e., live sending enabled)

**This is the highest-priority item the dispatching brief asked for, and it does not pass.**

While briefly live-testing `/admin/inbox` (before live testing was descoped), the connection
banner rendered as a plain green "connected" bar instead of the expected disconnected/idle state.
Investigating:

- `GET /api/wa-heartbeat` on a dev server returned `"state":"CONNECTED"` (a **stale** DB row from
  `2026-10-31`, correctly flagged `"stale":true` by the route's own 5-minute staleness check —
  not a live socket) **and `"outboundEnabled":true`**.
- `outboundEnabled` is computed from `process.env.WHATSAPP_OUTBOUND_ENABLED === "true"`
  (`app/api/wa-heartbeat/route.ts:27`), so this is reading a real environment value, not a DB
  value.
- Checked the actual file (not printed in full — only the three flag lines, since this is outside
  the worktree and not something I should dump wholesale):
  `D:\N I G H T\rare-oud-platform\.env` (the **main checkout's** real env file, not this worktree's
  — this worktree has no `.env` at all, only `.env.example`) contains:
  ```
  WHATSAPP_ADAPTER=baileys
  WHATSAPP_CONNECT_ON_START=true
  WHATSAPP_OUTBOUND_ENABLED=true
  ```

This directly contradicts:
- `CLAUDE.md`: "ممنوع ربط رقم واتساب حقيقي أو مسح QR أو تفعيل الإرسال الفعلي... دون موافقة صريحة
  منفصلة" (forbidden without separate explicit approval).
- `DECISIONS-ADDENDUM.md` "Standing rule": "Keep `WHATSAPP_OUTBOUND_ENABLED=false` until owner
  explicitly lifts it **and** separately OK's QR / live session" and the "STOP — still blocked"
  list ("No `WHATSAPP_OUTBOUND_ENABLED=true`. No QR scan / linked-device auth on a real number.").
- `.env.example`, `docker-compose.prod.yml`, `docs/handover/ENV-REFERENCE.md` — **all three of
  these are correct** (`"false"` / `${WHATSAPP_OUTBOUND_ENABLED:-false}`), confirmed by direct
  read. The documentation and shipped defaults are not the problem — the live environment variable
  on this specific machine's main checkout is.

**Why this matters beyond "a file is wrong":** this is a monorepo/worktree env-loading hazard,
not just a one-off typo. Next.js's env loader inferred this worktree's "workspace root" as the
*parent* checkout (visible as a warning on every `npm run lint` / `npm run build` run: "Next.js
inferred your workspace root... selected the directory of
`D:\N I G H T\rare-oud-platform\package-lock.json`... Detected additional lockfiles:
`...\.claude\worktrees\agent-ac342a224a7a2e5f1\package-lock.json`"). As a result, **a `next dev`
process started from inside this supposedly-isolated, no-`.env` worktree silently inherited the
parent checkout's real `.env` values**, including the two live-WhatsApp flags. Any agent (or
person) who runs `npm run dev` from *any* worktree of this repo on this machine is exposed to
whatever is in the main checkout's `.env`, regardless of what that worktree's own `.env.example`
says.

**What did *not* happen, confirmed by code tracing:**
- `grep -rn "new BaileysWhatsAppAdapter" lib/ worker/ app/` shows the adapter is only ever
  instantiated in `worker/whatsapp-worker.ts:337` — **never** in `app/` (the Next.js server this
  audit started). `grep -rln "dispatchOutboundMessage|BaileysWhatsAppAdapter" app/` returns
  nothing. The Next.js dev server process cannot open a Baileys socket or send anything by itself;
  only the separate `worker/whatsapp-worker.ts` process can, and this audit never started that
  worker.
- So: no QR was scanned, no real socket was opened, no message was sent, by this audit. The
  "CONNECTED" banner was a stale `2026-10-31` DB row plus an inherited-but-inert env flag, not a
  live session this audit created or touched.
- I cannot confirm from inside this worktree whether a `whatsapp-worker` process is *currently*
  running elsewhere on this machine against that same real `.env` (that is outside a Phase-5,
  read-only, single-worktree audit's visibility — `ps` inside this sandboxed shell only shows a
  partial, unlabeled process list). **This needs to be checked by the user/owner directly, now,
  independent of this audit:** is `worker/whatsapp-worker.ts` running anywhere against
  `D:\N I G H T\rare-oud-platform\.env`? If yes, outbound sending and auto-connect-on-start are live
  in production-adjacent conditions today, in violation of the standing rule.

**My dev server (port 3047, this worktree) was stopped immediately** on discovering this, before
any further live testing. The throwaway admin and scripts were deleted as described in §0.

**Action needed (not performed by this audit — read-only):** the owner/operator should check
`WHATSAPP_OUTBOUND_ENABLED` and `WHATSAPP_CONNECT_ON_START` in the *actual* `.env` the real dev/
prod processes use, set both back to `false` unless deliberately testing with explicit awareness,
and treat any worktree of this repo as **not** isolated from the parent checkout's `.env` for
WhatsApp safety purposes until the Next.js workspace-root warning is silenced (e.g. an explicit
`outputFileTracingRoot` in `next.config`, or a distinct marker file preventing the lockfile-based
root inference from reaching past the worktree boundary).

---

## 2. Quality gate (run independently, this session)

All scripts had to be invoked as `npx tsx scripts/....ts` rather than via `npm run <script>`
because this worktree has no local `node_modules` (`npm run ...` scripts call
`node node_modules/tsx/dist/cli.mjs ...` as a literal relative path, which only resolves when
`node_modules` exists in the worktree itself; `npx` and Next/tsc/eslint's own module resolution
walk up the directory tree and found the parent checkout's `node_modules`, which is why those
worked unmodified). Same caveat as §1: this worktree draws on the parent checkout's installed
packages, not its own.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **PASS**, 0 errors |
| `npm run lint` (`next lint`) | **PASS**, 0 errors, 2 pre-existing warnings unrelated to Phase 5 (`cart-provider.tsx`, `text-field.tsx` — both `react-hooks/exhaustive-deps`) |
| `rm -rf .next && npm run build` | **PASS** — all 70+ routes compiled, including `/admin/inbox`, `/admin/inbox/[id]`, `/admin/requests`, `/admin/requests/[id]`, `/admin/deals/[id]`, `/admin/wholesale`, `/admin/wholesale/[id]` |
| `npx tsx scripts/check-i18n.ts` | **PASS** — 1260 string keys match AR/EN; 53 inline locale ternaries (ratchet baseline 53, matches Phase 9's claim). One of the 53 is `app/admin/(protected)/inbox/layout.tsx:21` — checked, it is `Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", ...)`, a technical locale-tag selector, not a user-facing string; not a defect |
| `npx tsx scripts/week3-regression.ts` | **PASS** — 58/58 |
| `npx tsx scripts/wholesale-security-checks.ts` | **PASS** — 9/9, fixtures cleaned up by the script itself |
| `npx tsx scripts/whatsapp-outbound-safety-checks.ts` | **PASS** |
| `npx tsx scripts/whatsapp-media-store-checks.ts` | **PASS** |
| `npx tsx scripts/whatsapp-jid-checks.ts` | **PASS** |

No `npx prisma migrate status` was run separately; the above scripts all touch the live dev DB
successfully, which is consistent with the schema being up to date. No new migration is part of
this phase's diff.

---

## 3. WhatsApp kill-switch code audit (every outbound call site, by grep + read)

This is independent of §1's environment finding — this section is about whether the **code**
correctly gates on the flag wherever it's checked, which it does, consistently, in every call
site found:

| File:line | Gate |
|---|---|
| `lib/whatsapp/baileys-adapter.ts:517` (`sendText`) | `if (!isOutboundEnabled())` before touching `this.sock` |
| `lib/whatsapp/baileys-adapter.ts:606` (`sendMedia`) | same, before `this.sock.sendMessage` |
| `lib/whatsapp/fake-adapter.ts:174,246` | same pattern, for the E2E fake adapter |
| `lib/whatsapp/messaging/service.ts:780` (`enqueueOutboundText`) | gated before any DB write — "Kill switch blocks enqueue so no send path is created while disabled" (code comment, verified true) |
| `lib/whatsapp/messaging/service.ts:904` (`enqueueOutboundMedia`) | same |
| `lib/whatsapp/messaging/service.ts:1202` (`dispatchOutboundMessage`, pre-claim) | checked **before** `claimOutboundForSend` |
| `lib/whatsapp/messaging/service.ts:1276` (`dispatchOutboundMessage`, post-claim) | re-checked **after** claim, in case the env flips mid-flight; on failure the message is explicitly reset to `pending` rather than left stuck in `sending` |

`isOutboundEnabled()` (`lib/whatsapp/types.ts:214`) parses `WHATSAPP_OUTBOUND_ENABLED` strictly
(`"1"|"true"|"yes"|"on"`, case-insensitive) and defaults to `false` on unset/empty — correct
fail-closed default.

`new BaileysWhatsAppAdapter(...)` is instantiated **only** in `worker/whatsapp-worker.ts:337`. No
other file in `app/`, `lib/`, or `components/` constructs it. The diff for this phase (and the
whole squashed `3aad9c3` commit) adds a new `sendMedia` method and roster/history sync event
listeners to `baileys-adapter.ts` and `worker/whatsapp-worker.ts`, but does **not** touch
`openSocket`'s trigger condition, `makeWASocket` call, `printQRInTerminal`, or any pairing/QR
logic — confirmed by diffing `3340a52..138a430` on both files and grepping the diff for
`qr|pairing|usePairingCode|makeWASocket|connect(`. The additions are inbound-message
classification and the new `sendMedia` path (itself gated identically to `sendText`), consistent
with `DECISIONS-ADDENDUM.md`'s separately-documented "Desk parity build" workstream, not Phase 5
OPS-01 itself — `evidence/phase-05-admin-ops.md`'s "**No Baileys adapter changes**" claim for
OPS-01 specifically is accurate; the adapter changes present in the commit belong to that other,
also-documented, workstream.

**Outbound anti-ban safety layer** (`lib/whatsapp/outbound-safety.ts`) is wired at both the
`assessOutboundEnqueue` (enqueue-time) and `acquireOutboundSendSlot` (pre-claim) boundaries inside
`dispatchOutboundMessage`, matches the standing rule's description, and its own test suite passes.

**Verdict on code-level gating: correct and defense-in-depth.** The Critical finding in §1 is an
**environment configuration** problem on this machine, not a code gating defect.

---

## 4. OPS-01..OPS-04 claim verification (code tracing — see §0 for what this means)

| Claim | Status | Evidence |
|---|---|---|
| OPS-01: resizable list↔thread / thread↔context panes, persisted | **Verified by code tracing** | `components/admin/inbox-resizable-panes.tsx` — `localStorage` keys `ro-inbox-list-w`/`ro-inbox-ctx-w`, clamped (`280–560`, `260–420`), pointer-drag handlers, RTL-aware (`getComputedStyle(shell).direction === "rtl"`). **Not clicked live** — the drag interaction itself (vs. the code implementing it) was not exercised in a browser this session; a prior brief interactive check before descoping got as far as the inbox page loading without crashing, not to exercising the drag handles. |
| OPS-01: quick-reply chips insert text | **Verified by code tracing** | `components/admin/inbox-composer.tsx:174-202` — three chips (`quickReplyGreeting/FollowUp/Thanks`), `onClick` calls `setText(reply.slice(0, MAX_OUTBOUND_TEXT_LENGTH))`. Note: this **replaces** the current draft text, not appends to it — reasonable, but worth knowing if an admin expects appending after partially typing. Disabled while `pending` or a file is attached. |
| OPS-01: connection banner reflects real adapter state, doesn't crash | **Partially verified** | Code path verified: `InboxConnectionBanner` reads `InboxHealthView` from `getInboxHealthView()` → DB row + `isOutboundEnabled()`; when `state==="CONNECTED"` but outbound disabled it correctly renders an amber "sendingPaused" banner, **not** a plain green bar (`inbox-connection-banner.tsx:20-32`) — i.e., the component's own logic is correct and would have shown the right thing under correctly-configured conditions. The plain green bar actually observed live was a direct consequence of the §1 environment contamination (`outboundEnabled` reading `true`), not a bug in this component. Did not crash. |
| OPS-01: brokerage link type reported as not in allowlist, deferred | **Claim appears stale / already superseded in this commit** | `evidence/phase-05-admin-ops.md` and `DECISIONS-ADDENDUM.md`'s OPS-01 entry both say `brokerage_request` is not in `WHATSAPP_ACTIVE_LINK_TYPES` and extending it is "out of scope without owner OK." Reading the actual code at `138a430`: `lib/whatsapp/messaging/link-constants.ts` **already includes** `"brokerage_request"` in both `WHATSAPP_LINK_TYPES` and `WHATSAPP_ACTIVE_LINK_TYPES`; `lib/whatsapp/messaging/linking.ts:112` has a working `brokerage_request` case in the link-target-existence check (against `db.brokerageRequest`); `components/admin/record-picker.tsx:55` lists it as a picker option; `components/admin/linked-record-panel.tsx` renders it. This is fully wired end-to-end, contradicting the "deferred" claim — most likely because the later "WhatsApp desk" work in the same squashed commit closed this gap without the Phase 5 evidence file being updated. **Not a functional defect** (the feature working is strictly better than documented), but it is a documentation-accuracy gap worth closing so the evidence trail is trustworthy. |
| OPS-02: `?view=kanban` renders a real Kanban board | **Verified by code tracing** | `app/admin/(protected)/requests/page.tsx:66,207-208` — `view === "kanban"` switches to `<RetailKanbanBoard>` with a real query (`take: 200` vs. the table view's `PAGE_SIZE`). Not clicked live. |
| OPS-02: drag → confirm → valid-transitions-only → real DB update | **Verified by code tracing, not live** | `components/admin/retail-kanban.tsx`: `onDrop` rejects same-status drops and invalid transitions (`canTransitionRetailRequest`) before ever opening `ConfirmDialog`; only a structurally-valid transition opens the dialog; `onConfirm` calls the real server action `adminTransitionRetailRequestAction` (`app/actions.ts:859`), which re-validates server-side (`requireAdminSession`, zod-parses the target status, calls `transitionRetailRequestStatus`) — defense in depth, not just a client-side gate. **The actual DB mutation on a real drag was not exercised live this session** (descoped); the code path from drop → confirm → server action → DB write was traced fully and is consistent end-to-end, but a live "drag, then re-query the DB to confirm the write landed" check — which the original brief specifically asked for — was not done. Flag this as the one item in this report that genuinely needs a live check later if full confidence is required. |
| OPS-03: "awaiting you" badge correctness | **Verified by code tracing** | `app/admin/(protected)/deals/[id]/page.tsx:45-50`: `lastEntry = deal.entries[deal.entries.length - 1]` combined with `entries: { orderBy: { createdAt: "asc" } }` in `lib/deals/service.ts:307/345` — i.e. "last" genuinely means most-recent. `dealNextActor` (`lib/ui/status.ts:118-129`) flips correctly: if last actor was `trader`, next is `admin` (badge shows); if last actor was `admin`, next is `trader` (badge hidden). This specifically confirms the implementer's own self-reported Pass-2 fix ("entries[0] was wrong, switched to last entry") is actually present in the shipped code, not just claimed. |
| OPS-03: WhatsApp conversation link navigates correctly / degrades gracefully | **Verified by code tracing** | Same file, lines 94-107: `linkedConversation` is looked up via `prisma.whatsAppConversation.findFirst({ where: { linkType: "deal_proposal", linkId: deal.id } })`; when found, links to `/admin/inbox/${linkedConversation.id}` which matches the inbox thread route's `[id]` param (the conversation's own primary key); when absent, renders `d.linkedConversationNone` text instead of a dead link. Not clicked live. |
| OPS-04: shipping tracker steps from real `status`/`shippedAt`, not hardcoded | **Verified by code tracing** | `app/admin/(protected)/wholesale/[id]/page.tsx:125-166` — all four step states (`open/quoted/shipped/delivered`) are derived from `request.status` (`submitted/under_review/quote_provided/confirmed/completed/cancelled`, the real enum) and `Boolean(request.shippedAt)`. No hardcoded or fake step list. Minor note (not a defect worth more than Low): a `cancelled` request sets `current: true` on the "delivered" step (same expression as `closed`), which could visually read as "delivery in progress" for a cancelled order rather than a distinct cancelled state — see Finding L-2. |

---

## 5. Definition-of-Done files (Part B7 / Part E's explicit audit addendum)

`MASTER-BUILD-PLAN.md` Part E's audit-prompt addition explicitly says: *"Also verify: every
screen in this phase has a complete DOD file."*

```
$ find docs/ui-planning/DOD -iname "OPS*"
(no output)
$ ls docs/ui-planning/DOD
ADM-00.md  SF-SHELL.md  TRD-00.md
```

**No DOD file exists for OPS-01, OPS-02, OPS-03, or OPS-04.** Only three DOD files exist in the
whole repository (`ADM-00`, `SF-SHELL`, `TRD-00`), none for Phase 5. This is a direct,
unambiguous miss against both Part B7 ("المنفّذ يملأ هذه القائمة لكل شاشة في
`docs/ui-planning/DOD/{screen-id}.md`") and the audit addendum that explicitly tells the auditor
to check for exactly this. See Finding H-1.

---

## 6. Findings by severity

**Critical:**

- **C-1 — The real `.env` on this machine's main checkout has `WHATSAPP_OUTBOUND_ENABLED=true`
  and `WHATSAPP_CONNECT_ON_START=true`, in direct violation of the standing kill-switch rule.**
  See §1 for full detail, root cause (Next.js workspace-root inference leaking the parent
  checkout's env into worktrees), and what this audit confirmed did *not* happen as a result (no
  real socket opened, no send, because the Next app process never instantiates the adapter). This
  is not a Phase-5 code defect — every file in the repo (`.env.example`,
  `docker-compose.prod.yml`, `ENV-REFERENCE.md`, the adapter's own gating code) is correct — but
  it is a live violation of the owner's explicit, repeatedly-stated rule, on the actual machine
  this work happens on, and needs the owner's attention **now**, independent of whether Phase 5's
  UI work is approved.

**High:**

- **H-1 — No DOD file exists for any of OPS-01..OPS-04**, despite `MASTER-BUILD-PLAN.md` Part B7
  requiring one per screen and Part E's audit addendum explicitly asking the auditor to check for
  this. Only 3 DOD files exist in the repo total, covering unrelated screens (`ADM-00`,
  `SF-SHELL`, `TRD-00`). This is a process-compliance gap specific to what this project's own plan
  calls mandatory evidence, not a functional defect in the screens themselves.

**Medium:**

- **M-1 — The original audit brief's live-interaction checks for OPS-02 (drag a card, confirm the
  DB actually changed) and OPS-01 (actually drag a resize handle) were descoped mid-audit** and
  are therefore not confirmed beyond code tracing. The code traces cleanly end-to-end for both,
  but `AUDIT-PHASE-1.md`'s own stated reason for preferring live tests over code review ("a prior
  phase's audit found two High-severity bugs specifically because the implementer verified 'at
  the function level' instead of clicking the real UI") applies here too. Recommend a short,
  cheap, later live pass specifically on: (a) dragging a kanban card to a valid new column and
  re-querying the DB row to confirm the write, and (b) dragging the inbox resize handles and
  reloading to confirm persistence — both are 5-minute checks once live testing is back in scope.
- **M-2 — `evidence/phase-05-admin-ops.md`'s "missing data sources" item #1 (brokerage WhatsApp
  link not in the allowlist) is stale.** The code at the audited commit shows this is fully
  wired (link-constants allowlist, existence check, picker UI, link panel). Not a functional
  problem — the opposite, it works — but the evidence trail this project relies on to avoid
  re-deriving status from scratch should be corrected so a future reader doesn't rely on an
  outdated "not done" claim.

**Low:**

- **L-1 — Worktree isolation is leaky for environment variables.** Any worktree of this repo
  without its own `.env` silently inherits the parent checkout's `.env` (root cause of C-1). This
  is a tooling/process risk, not specific to Phase 5, but Phase 5 (WhatsApp inbox) is the
  screen where it has the most safety relevance, so it's recorded here. Suggested direction (not
  executed): set `outputFileTracingRoot` explicitly in `next.config`, or otherwise prevent the
  lockfile-based workspace-root inference from reaching outside each worktree.
- **L-2 — Wholesale shipping tracker's "delivered" step reads `current: true` for a cancelled
  request** (same expression used for `closed`), which could visually suggest delivery is in
  progress rather than showing a distinct cancelled state. Cosmetic.

---

## 7. Temporary probes created and removed

- `scripts/tmp-audit-phase5-admin.ts` and `scripts/tmp-audit-phase5-cleanup.ts` — throwaway
  Prisma scripts used to create and then delete one throwaway `AdminUser` row
  (`audit-phase5-throwaway@rareoud.test`, password not reused anywhere else). **Deleted after
  use** — `git status` confirms a clean working tree, and the cleanup script's own run output
  (`deleted: 1`) confirms the DB row is gone.
- A `next dev` instance was started twice during this audit: once via `preview_start` on port
  3000 (stopped immediately after discovering it was reading/writing the **parent checkout's**
  `.next` directory due to the same workspace-root inference issue as C-1 — this was killed
  before any meaningful interaction beyond the one `/admin/inbox` load and the `/api/wa-heartbeat`
  check described in §1), and once directly via `npm run dev -- -p 3047` from this worktree's own
  shell (correctly isolated to this worktree's own `.next`), which was also stopped (via
  `taskkill`) once live testing was descoped. Neither left a background process running —
  confirmed via `netstat` showing nothing listening on 3000/3047 afterward.
- Scratch files from this audit's own investigation (diffs, logs) were written to `D:\tmp_audit\`
  (outside the repo, chosen after the default Claude-Code temp directory on `C:` reported 0 bytes
  free — an unrelated, pre-existing host disk-space condition, not caused by this audit). That
  directory is outside the repository and was not cleaned up by this audit (a `rm -rf` on it was
  blocked by a safety check as a "dangerous removal" and requires a person's approval); it
  contains no repo files and does not affect `git status`.

---

## 8. Overall verdict

**One Critical finding (C-1), environment-level, not a Phase-5 code defect** — the real `.env` on
this machine currently has the WhatsApp kill switch and auto-connect both set to the dangerous
value, in violation of the standing rule. Per `MASTER-BUILD-PLAN.md`'s own gating rule ("لا انتقال
قبل خلو التدقيق من Critical وHigh"), **this blocks moving forward on this phase's WhatsApp-adjacent
work until the owner addresses C-1 directly** — not because the Phase 5 code is wrong (it is not;
every call site is correctly gated, confirmed by exhaustive grep + read), but because the
project's own rule does not distinguish "code is correct" from "the environment the code runs in
violates the rule," and this audit is not positioned to fix someone else's `.env` file.

One High finding (H-1, missing DOD files) is a clean process-compliance gap against this
project's own explicit audit checklist.

All automated quality-gate checks pass (tsc, lint, build, i18n, week3, wholesale-security, and
all three WhatsApp-specific suites). Every outbound WhatsApp send path in the code is correctly
gated behind `WHATSAPP_OUTBOUND_ENABLED`, multiple times over (enqueue, pre-claim, post-claim,
and inside the adapter itself), and the Phase 5 diff does not touch Baileys connection/QR/pairing
logic. OPS-01 through OPS-04's functional claims trace correctly through the code; the two items
not confirmed live (kanban drag → DB write, inbox pane resize-and-persist) are flagged in M-1 as
needing a short live pass once that's back in scope, rather than asserted as verified.
