# DOD — TRD-00 Trader shell

Scope this phase: mounted Sonner into the shell (see `DECISIONS-ADDENDUM.md`); otherwise
audited only, not rebuilt — no structural gaps found against Part C's TRD-00 description that
warranted a change this phase.

## B1 Visual
- [ ] Lab-vs-real screenshots / reference benchmark — not captured this phase.
- [x] Shell structure (bottom tab bar, top nav on desktop) unchanged and already functional;
      not re-audited pixel-by-pixel this phase.

## B2 Motion
- [ ] Not re-audited this phase.

## B3 Functional
- [x] Sonner `<Toaster>` now mounted (`components/trader/shell.tsx`), confirmed rendering via
      the `/dev/ui` gallery's live toast demo (same `Toaster` component, same mount pattern).
- [ ] Trader portal's own toast call sites still use the pre-existing `AppToast` system, not
      yet migrated to Sonner — deliberate, see `DECISIONS-ADDENDUM.md`.

## B4 Language
- [x] `check:i18n` passes.
- [ ] Zero inline ternaries — not reached (ratchet, not zero; see `DECISIONS-ADDENDUM.md`).

## B5 Accessibility
- [ ] Fresh axe run — not run this phase.

## B6 Performance
- [x] Bundle report: `/trader` route is 3.6 kB page / 129 kB first load (production build,
      this phase).

## B7 Evidence
- [ ] Full screenshot matrix / video — not captured this phase.
