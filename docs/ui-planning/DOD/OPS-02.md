# DOD — OPS-02 Retail requests

Not in `design-lab/` — designed directly in the real app per `VISION.md` §5.3-5.4. Scope this
phase: added a Kanban view on top of the pre-existing table/cards view and detail page.

## B1 Visual
- [x] `?view=kanban` renders a real Kanban board (`components/admin/retail-kanban.tsx`),
      columns per status; table/cards view unchanged for users who don't opt in.
- [ ] Lab-vs-real comparison / three-reference benchmark — not applicable (no lab reference)
      and not separately benchmarked this phase.

## B2 Motion
- [ ] Not separately audited this phase.

## B3 Functional
- [x] Dragging a card between columns only allows valid transitions
      (`RETAIL_REQUEST_TRANSITIONS`, checked before the drop is accepted) and shows a
      confirmation before committing via `adminTransitionRetailRequestAction`.
- [x] Filters are saved in the URL (pre-existing, not touched this phase).
- [x] Detail page (stepper, WhatsApp handoff, linked conversation) pre-existing, unchanged.
- [ ] Live confirmation that a drag-and-drop actually persists to the DB (not just shows a
      toast) was verified by code tracing in the independent audit
      (`docs/ui-planning/AUDIT-PHASE-5.md`), not by a live click this phase — flagged as a
      follow-up for the next live-browser pass.

## B4 Language
- [x] `check:i18n` passes.

## B5 Accessibility
- [ ] Fresh axe run — not run this phase. Keyboard drag-and-drop alternative for the Kanban
      board was not verified; this is a known general accessibility risk for drag interfaces
      and should be checked before this screen is considered fully AA-compliant.

## B6 Performance
- [ ] Not separately measured this phase.

## B7 Evidence
- [ ] Full screenshot matrix / video — not captured this phase.
- [x] `docs/ui-planning/evidence/phase-05-admin-ops.md` and
      `docs/ui-planning/AUDIT-PHASE-5.md` (independent audit) stand in as the evidence record.
