# DOD — OPS-04 Wholesale

Not in `design-lab/` — designed directly in the real app per `VISION.md` §5.3-5.4. Scope this
phase: a shipping-progress tracker on the detail page, driven by real `status`/`shippedAt`
fields.

## B1 Visual
- [x] `components/admin/shipping-tracker.tsx` renders a 4-step horizontal progress indicator
      (open → quoted → shipped → delivered) on `/admin/wholesale/[id]`.

## B2 Motion
- [ ] Not separately audited this phase (transform/opacity-friendly per the component's own
      comment, not independently re-verified).

## B3 Functional
- [x] Steps are derived from the real `status`/`shippedAt`/`carrier`/`trackingReference`
      fields on the actual record, not hardcoded — confirmed by code tracing in the
      independent audit (`docs/ui-planning/AUDIT-PHASE-5.md`).
- [x] **Fixed 2026-11-02** (post-audit, Low finding L-2): a cancelled request rendered the
      "delivered" step as `current` (in-progress), which read as if a cancelled order were
      still being delivered. `app/admin/(protected)/wholesale/[id]/page.tsx`'s step builder
      now only marks "delivered" current when the request is actually `completed`.
- [x] Lines + quote controls unchanged this phase (no invented pricing math).

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
