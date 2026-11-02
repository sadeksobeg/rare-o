# DOD — OPS-01 WhatsApp inbox

Not in `design-lab/` — designed directly in the real app per `VISION.md` §5.3-5.4. Scope this
phase: polish an already-functional inbox (three-pane list/thread/context already existed) —
made the panes resizable, added quick replies, kept the WhatsApp adapter untouched.

## B1 Visual
- [x] Three-pane layout (list | thread | context) on desktop; stacked on mobile, pre-existing.
- [x] Resizable list↔thread split (`components/admin/inbox-resizable-panes.tsx`), width
      persisted to `localStorage`; resizable thread↔context split on `xl` via
      `components/admin/inbox-split.tsx`.
- [ ] Lab-vs-real comparison — no `design-lab/` reference exists for this screen.
- [ ] Three-reference world-class benchmark comparison — not captured this phase (see
      `evidence/phase-05-admin-ops.md` REVIEW-LOG for the self-review notes that stand in).

## B2 Motion
- [ ] Not separately audited this phase (no new motion beyond the existing pane transitions).

## B3 Functional
- [x] Quick-reply chips insert text into the composer (`components/admin/inbox-composer.tsx`).
- [x] Tabs (all/unread/linked/unlinked), search, unread glow — pre-existing, not touched.
- [x] Connection-status banner reflects real adapter state (`/api/wa-heartbeat`); does not
      crash when disconnected/idle.
- [x] No changes to `lib/whatsapp/baileys-adapter.ts` core connection logic or `worker/`.
- [ ] Brokerage WhatsApp link type — **not in the allowlist as of this phase's initial ship**
      (`WHATSAPP_ACTIVE_LINK_TYPES` in `lib/whatsapp/messaging/link-constants.ts`); flagged as a
      missing data source rather than invented. **Update (independent audit, 2026-11-02):**
      this was subsequently wired (allowlist entry, existence check, picker UI all present) —
      `evidence/phase-05-admin-ops.md`'s "not wired" note is stale; see
      `docs/ui-planning/AUDIT-PHASE-5.md` finding M-2.

## B4 Language
- [x] `check:i18n` passes; no new inline ternaries introduced.

## B5 Accessibility
- [ ] Fresh axe run — not run this phase; keyboard-inset protection on mobile composer kept
      from the pre-existing implementation, not re-verified.

## B6 Performance
- [ ] Not separately measured this phase.

## B7 Evidence
- [ ] Full screenshot matrix / video — not captured this phase.
- [x] `docs/ui-planning/evidence/phase-05-admin-ops.md` and
      `docs/ui-planning/AUDIT-PHASE-5.md` (independent audit) stand in as the evidence record.
