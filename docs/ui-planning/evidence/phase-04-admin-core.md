# Phase 4 — Admin core

Branch: `phase/04-admin-core`. Screens ADM-01 … ADM-05 (MASTER-BUILD-PLAN Part C2).
Continues from Phase 3 auth work still present in the working tree.

## Quality gate

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npx next lint` on touched Phase 4 files | PASS |
| `npm run test:admin-dashboard-kpi` | PASS (6/6) |

Videos / lab-vs-real screenshot pairs / IDOR suite: not produced in this pass.

## Screen status

| ID | Route | Status | Notes |
|---|---|---|---|
| ADM-01 | `/admin` | Done | Gradient hero + WhatsApp pulse, `KpiTile` + 7-day series, 14-day area chart (real counts), domain donut, first-use empty state, existing queue/aside/feed/manage hub. KPI↔list automated check added. |
| ADM-02 | `/admin/traders`, `/admin/traders/[id]` | Done | List: initials, deals/wholesale/brokerage counts, link to detail. Detail: cover, notes, activity summary, recent lanes, disable/reset. No “last login” (not stored). |
| ADM-03 | `/admin/team` | Partial | URL tabs team/audit, avatars, action filter, CSV export `/api/admin/audit-export`. **Roles Owner/Manager/Staff + invite + permission matrix not built** — `AdminUser` has no role field (reported). |
| ADM-04 | `/admin/customers` (+ `[id]`) | Done (polish) | Initials on list; detail already had notes + WhatsApp match. |
| ADM-05 | `/admin/brokerage` (+ `[id]`) | Done (polish) | Existing Kanban/table/detail kept. Added URL filters: trader, city, stale-only. |

## Decisions

See `DECISIONS-ADDENDUM.md` Phase 4 section.

## Remaining for owner review

1. Role matrix / invite (schema).
2. Trader last-login (needs session telemetry).
3. Playwright videos + lab comparison shots.
4. IDOR tests for new trader detail route (session gates already via protected layout).
