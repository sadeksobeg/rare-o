# DOD — ADM-00 Admin shell

Scope this phase: audited the existing shell against Part C's ADM-00 description and the
global Definition of Done (Part B); fixed the gaps found (command palette missing brokerage
from its real-record search). The shell itself was **not rebuilt** — it already matched the
lab reference closely enough that no visual/structural rework was judged necessary (see
`DECISIONS-ADDENDUM.md`, "cmdk" entry, for the reasoning on the one deliberate non-change).

## B1 Visual
- [x] Labelled `<nav aria-label="Admin">` landmark (already fixed in an earlier UI audit round,
      re-verified present).
- [ ] Lab-vs-real side-by-side screenshots (375/1440, AR) — not captured this phase.
- [ ] Three-reference benchmark comparison — not done this phase.
- [x] Icons: Lucide, used via existing `nav.tsx`/`shell.tsx` (not re-audited stroke-width/size
      exhaustively this phase).

## B2 Motion
- [ ] Not re-audited this phase (no shell motion changes were made).

## B3 Functional
- [x] Command palette does real record search (products, retail, deals, wholesale, customers,
      traders, **brokerage — added this phase**) via live Prisma queries
      (`lib/admin/command-search.ts`). Verified via a direct query against the seeded fixture
      (`BR-SEED-014`).
- [ ] Full IDOR/role test pass on every admin route — out of this phase's scope (shell-level
      only; route-level security was covered by the Phase 1 audit).

## B4 Language
- [x] `check:i18n` passes (1084 keys match AR/EN after this phase's dictionary additions).
- [ ] Zero inline ternaries / JSX literals — not reached; see the ratchet in
      `DECISIONS-ADDENDUM.md` (50 remaining, tracked, not zero).

## B5 Accessibility
- [x] Sidebar landmark fix already in place (carried over, re-verified).
- [ ] Fresh axe run against a stable server — not run this phase.

## B6 Performance
- [x] Bundle report: `/admin` route is 679 B page / 126 kB first load (production build,
      this phase) — see the Phase 2 quality-gate report.
- [x] Recharts (`DashboardDomainChartMount`) and the 3D logo scene are both lazy-loaded,
      confirmed via per-route bundle sizes and live network-request inspection (no `canvas`/
      recharts chunk requested until actually rendered).

## B7 Evidence
- [ ] Full screenshot matrix / video — not captured this phase (text-only report in
      `docs/ui-planning/evidence/phase-02-reconciliation.md` and this file stand in for it).
