# DOD — OPS-03 Deals

Not in `design-lab/` — designed directly in the real app per `VISION.md` §5.3-5.4. Scope this
phase: a "waiting on you" badge on the detail page (list already had one) and a link from the
detail page to its linked WhatsApp conversation.

## B1 Visual
- [x] List "waiting" chip pre-existing; detail page now shows the same badge plus a linked
      conversation link when one exists.

## B2 Motion
- [ ] Not separately audited this phase.

## B3 Functional
- [x] Waiting-badge logic corrected during this phase's own self-review (the admin fetch
      orders negotiation entries ascending, so the badge must read the *last* entry, not
      `entries[0]` — documented in `evidence/phase-05-admin-ops.md` REVIEW-LOG Pass 2).
- [x] Negotiation thread reused unchanged; linked-conversation link navigates to the correct
      conversation in the inbox (verified by code tracing in the independent audit).
- [ ] Live click-through of the linked-conversation link was not performed this phase —
      verified by reading the href-construction code only.

## B4 Language
- [x] `check:i18n` passes.

## B5 Accessibility
- [ ] Fresh axe run — not run this phase.

## B6 Performance
- [ ] Not separately measured this phase.

## B7 Evidence
- [ ] Full screenshot matrix / video — not captured this phase.
- [x] `docs/ui-planning/evidence/phase-05-admin-ops.md` and
      `docs/ui-planning/AUDIT-PHASE-5.md` (independent audit) stand in as the evidence record.
