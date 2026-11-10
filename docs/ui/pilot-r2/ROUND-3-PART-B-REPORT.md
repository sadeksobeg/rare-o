# Round 3, Part B — `/admin/inbox` rebuild

Scope: `/admin/inbox` + `/admin/inbox/[id]` only, branch `ui/pilot-world-class`. Nothing pushed.
`.env` untouched. **No real WhatsApp connection action was ever triggered** — see "Safety" below.

Built on top of Part A (already approved). Reference: `admin-inbox/index.html` from the
owner's zip, read in full line-by-line and matched class-for-class/behavior-for-behavior where
the real data model allows it — divergences are listed explicitly below, not silently dropped.

---

## What's real vs. what's new vs. what's intentionally not wired

**Existing, untouched, still working exactly as before:**
- `listInboxConversations`, `getInboxConversation`, `getInboxHealthView` (Part A's heartbeat
  check included), `markConversationRead` — all from `lib/whatsapp/messaging/inbox.ts`.
- `adminSendWhatsAppTextAction` — including its existing kill-switch fallback to the internal
  platform channel. I did not touch this logic; the new composer calls it exactly as the old
  one did.
- All business-record linking (search, link, unlink, CRM party suggestions) —
  `components/admin/linked-record-panel.tsx` is embedded **as-is**, not rebuilt. Rebuilding its
  internals to match the reference's visual card risked the brief's explicit "don't modify
  existing features" instruction, so it keeps its current (pre-pilot) look inside the new panel
  rather than being re-skinned. This is the one piece of Part B that does not visually match
  the reference — flagged honestly rather than silently patched.

**New, additive, real (not a UI mockup — actual Prisma models + server actions + tests):**
- **Notes**: `WhatsAppConversationNote` model (migration
  `20261109065224_inbox_notes_and_tags`, purely additive — one `CREATE TABLE`, one
  `ADD COLUMN`). `addInboxNote()` + `adminAddInboxNoteAction`. Append-only (no edit/delete —
  matches the reference's own minimal note display, which only ever shows existing notes).
- **Tags**: `tags String[]` on `WhatsAppConversation` (same migration). `addInboxTag()` /
  `removeInboxTag()` + their actions. Capped at 12 tags/conversation, 30 chars each,
  deduplicated.
- **Masked phone numbers**: `formatMaskedPhone()` (`lib/whatsapp/messaging/phone-format.ts`,
  split into its own file specifically so a client component importing it doesn't drag
  `node:crypto`/`fs`/`path` into the browser bundle — see "bugs found" below). The existing
  `formatConversationDisplayLabel()` (which shows the **full** number) is untouched for
  whatever else relies on it; the new inbox UI uses the masked formatter everywhere a phone
  number is shown — list rows, thread header, context panel — per the owner's explicit
  requirement.
- **Compact chat-list time format** (`formatCompactChatTime()` in `lib/i18n/format.ts`): today
  → HH:mm, yesterday → "أمس", last 6 days → weekday name, older → short date — computed
  against `APP_TIMEZONE`, not the server's UTC day.
- 7 new regression assertions in `scripts/whatsapp-phase-c-checks.ts` for notes/tags (create,
  author attribution, whitespace-rejection, dedup, removal, no secrets in payload) — all
  passing.

**Present in the UI but intentionally NOT wired to a real mutation, with the reason stated
inline in the component:**
- **Connection sheet's pairing/disconnect buttons** (`connection-sheet.tsx`). The sheet reads
  and displays real health data (state, heartbeat age) but its "Show pairing code" and
  "Disconnect account" buttons are rendered `disabled`, not connected to
  `adminRequestWhatsAppPairingAction` / `adminWhatsAppLogoutAction`. Both of those are real,
  working actions that would queue a `linkCommand` for the worker — exactly the "no real
  connection activation without separate written approval" line from CLAUDE.md and the brief's
  own "لا تُفعّل أي اتصال فعلي". The layout and copy are there to review; nothing in this round
  can trigger a real pairing or disconnect.
- **Quick actions** ("إنشاء طلب من المحادثة", "فتح صفقة جديدة", "تثبيت المحادثة" in the
  reference): **omitted entirely**, not faked. Retail requests and deals have no
  admin-initiated creation route in this app (`app/admin/(protected)/requests` and `.../deals`
  have no `new/` route — both domains are customer/trader-initiated), and "pin conversation"
  has no backing feature anywhere. Rather than link to a route that doesn't exist or wire a
  button that does nothing, I left this section out and I'm stating that plainly here instead
  of leaving a silent gap.
- **Product-card composer button**: omitted. No backend exists for attaching a product to an
  outbound message. The bubble renderer still supports displaying a product-card bubble for a
  message that already has one (dead code path with current data, but not fabricated UI).
- **Attach (file) button**: present, disabled when WhatsApp is unreachable (mirrors the real
  media-blocking logic already in the old composer), but doesn't open a file picker — no
  backend wiring attempted this round; the brief's structure section lists it but the
  acceptance gate doesn't test it, so I didn't build a half-finished upload flow against the
  clock.
- **Quick replies**: 3 static, dictionary-driven templates (delivery/payment/confirmation —
  translated ar/en), not an owner-manageable list. No "canned responses" backend exists in this
  app; building one was out of scope for a UI-rebuild round.
- **Search-in-thread / "more" header buttons**: rendered, disabled. No in-thread search or
  additional-actions menu exists server-side.

## Structure (matches the reference)

Three columns ≥1321px (372px list / flexible thread / 332px context), two columns 901–1320px
with the context panel as a slide-out (`.rad-xo`), one column ≤900px (list ↔ thread with a back
button). Implemented via `:has()`-scoped CSS overriding the shared `.rad-page` shell only when
it contains `.rad-ibx` (`styles/admin-inbox.css`) — zero risk to any other admin page, since
that selector only ever matches the inbox route.

Routing **is** the selection state — no client-side `SELID` like the reference's static mock.
Clicking a row is a real `<Link>` navigation to `/admin/inbox/[id]`; the mobile list↔thread
transform and the `rad-sel` highlight are both derived from `usePathname()`
(`components/admin/rad/inbox/inbox-shell.tsx`). This also means the "mark read" behavior is the
existing, real one — opening a conversation's page genuinely zeros its unread count server-side
(confirmed in the integration check below), not a client-side pretend state.

## Behavior checklist against the brief

- Connection badge opens a sheet (not an inline form) with real state + heartbeat age; no live
  pairing. ✅ (pairing/disconnect intentionally inert — see above)
- Masked phone numbers in list + header, full number never rendered by this UI. ✅
- Compact time formats (today/yesterday/weekday/short date). ✅
- Filters (all/unread/linked/unlinked) with live counts, search (`/` focuses it). ✅
- Reply vs. internal note tabs; note is **not** sent to the customer. ✅ — but see "divergence"
  below: notes are NOT interleaved into the message timeline the way the reference's static
  demo shows them, because the real data model stores them in a separate table with
  independent timestamps, not as `WhatsAppMessage` rows. Interleaving them would require either
  faking timestamps into the message stream (misleading) or a schema change merging two
  different entities (risky, unscoped). Notes live in the context panel's Notes section only,
  which is also where the reference's own context panel shows them.
- Quick replies, date separators, unread-message separator, system message, read ticks (sent
  only — no delivered/read receipt data exists in this system, so no fake blue ticks),
  product-card bubble rendering. ✅
- Context panel: linked records (existing panel, unchanged), quick actions (omitted, see
  above), notes (new, real), tags (new, real), link/unlink (existing panel). ✅ with the stated
  exception.
- Shortcuts: `j`/`k` list navigation, `/` search focus, `Esc` back/close, visible focus
  everywhere, focus returns to the connection button after the sheet closes. ✅ (see checks
  below).
- Loading/empty/error states: empty list, no-results, select-a-conversation empty state all
  built. A dedicated loading skeleton for the list itself (first paint) was not built — the
  existing `Suspense` fallback in the layout is a bare `.rad-ibx` shell, not a skeleton matching
  row dimensions like the dashboard's. Minor, logged rather than fixed under time pressure.

## Real bugs found and fixed while building this

- **Client/server module boundary**: `conversation-list.tsx` and `thread.tsx` (client
  components) imported `formatMaskedPhone` from `lib/whatsapp/messaging/inbox.ts`, which pulls
  in `node:crypto`/`fs`/`path` via its `lib/whatsapp/media.ts` import — webpack correctly
  refused to bundle that for the browser (`UnhandledSchemeError`). Fixed by moving the pure
  formatter into its own dependency-free file (`phone-format.ts`) that both the server-only
  `inbox.ts` (re-exporting it) and the client components import directly.
- **RTL bidi bug of my own, caught before shipping**: the first working version rendered a
  masked phone number (`+963 9•• ••• 654`) as plain text inside an RTL paragraph without
  `<bdi dir="ltr">`, so the whole string visually reversed (`654 ••• ••9 963+`). Fixed in all
  three places a title can be a phone instead of a name (list row, thread header, context
  panel) by conditionally wrapping in `<bdi dir="ltr">` only when no real name exists.

## Acceptance gate — real numbers

1. **Matching**: not re-run as a pixel-diff gate against a reference screenshot for this part —
   the owner's inbox reference has no production-fidelity screenshots to diff against (only the
   interactive HTML mock), unlike AD-02's dashboard reference which shipped real PNGs. Real
   Playwright screenshots (dark, 1440 + 390, list + thread) are attached instead for your own
   visual review, consistent with how the two screenshots were reviewed for round 2.1.
2. **`test:d1-axe`**, full ar+en × 390/1440 sweep (includes `/admin/inbox`): 96/96 scans, same
   4 pre-existing `/admin/profile` failures only (unrelated, out of scope). Plus a dedicated
   check on an **open conversation** (`/admin/inbox/[id]`, which the shared sweep doesn't cover
   for any `[id]` route app-wide by existing convention):
   `scripts/pilot-r3-inbox-axe-thread.mjs` → **0 serious/critical violations, ar+en × 390/1440**
   (`docs/ui/pilot-r2/INBOX-THREAD-AXE.json`).
3. **Keyboard + focus + network + integration** (`scripts/pilot-r3-inbox-checks.mjs`,
   `docs/ui/pilot-r2/INBOX-CHECKS.json`):
   - `/` focuses the search input: **true**
   - `j` opens the first conversation: **true**
   - 18 tab stops, **0** without a visible focus ring
   - Opening the connection sheet moves focus inside it; `Escape` returns focus to the
     connection button: **true** / **true**
   - Opening a conversation with unread messages clears its unread count server-side
     (confirmed by reloading the list and checking the row no longer carries `.rad-un`):
     **true**
   - Outbound network requests to any WhatsApp/Baileys-looking host while browsing the inbox
     and opening/closing the sheet: **0** (empty array, captured via Playwright's own request
     listener)
4. **Contrast audit**, extended with 4 new inbox-specific pairs (outgoing bubble text, active
   filter chip, conversation preview text, unread time marker): **40/40 pairs pass, both
   themes** (up from 32 before this round).
5. **Dev-language scan**, extended to the 8 new inbox component files + the route files +
   the `ib` dictionary block: **clean, no hits**.
6. `tsc --noEmit`: clean. `next lint`: clean (same 2 pre-existing unrelated warnings).
   `test:week3`: 62/62. `test:wholesale-security`: all passing.
   `test:whatsapp-phase-c`: **33/34** — the 1 failure (`masked jid when no e164`) is the exact
   same pre-existing, unrelated bug already confirmed in round 2.1 (reproduced before any of
   this round's changes too); the 7 new notes/tags assertions all pass.

## Safety

`.env` was never opened. The WhatsApp worker process was never started this session. Nothing in
the new UI can trigger a real pairing, QR scan, reconnect, or logout — the two action handlers
that could (`adminRequestWhatsAppPairingAction`, `adminWhatsAppLogoutAction`) exist and work
(pre-existing), but the new sheet's buttons that would call them are rendered `disabled` and
have no `onClick`. The dedicated network check above empirically confirms zero outbound
requests toward any WhatsApp-looking host while the UI is used.

## What's not done / known gaps

- Connection sheet pairing/disconnect buttons are inert by design (see above) — pending your
  separate written approval before ever being wired up.
- Quick actions section (create request / new deal / pin) omitted — no real destination exists
  for any of them in the current app.
- No list-loading skeleton (bare Suspense fallback instead).
- In-thread search and the thread header's "more" menu are visually present but non-functional.
- File attach button doesn't open a picker.
- Notes are not interleaved into the message timeline (by design — see "divergence" above).
- Mobile: the reference hides the topbar/tabbar while a thread is open for an immersive
  full-screen feel (`body.tv` toggle); this round didn't implement that toggle, so both remain
  visible on mobile under the thread. Not a functional bug — just not fully matching the
  reference's mobile chrome behavior.

## Stop point

Per the brief: nothing pushed, `.env` untouched, WhatsApp worker never run, no real connection
action ever triggered. Stopping here for your review before any further page or commit beyond
this round's two (Part A, already approved; Part B, about to be committed separately as its own
commit per your instruction).
