# Mini-audit — Phase 2 High fixes (H-1 / H-2)

**Date:** 2026-10-31  
**Scope:** Live verification only of storefront global search (H-1) and admin command palette (H-2). No Phase 3 work.

## Findings closed

### H-1 — Storefront search from every page

| Check | Result |
| --- | --- |
| Header `بحث` on `/catalog` opens overlay (does not navigate away) | **PASS** |
| Overlay shows live catalog hits | **PASS** (e.g. قانون مختار، موالف رقمي، …) |
| Close control / no client crash after open | **PASS** |
| Page remains usable without overlay | **PASS** |

**Root causes addressed**

1. Header previously dispatched `ro:open-search` only on `/`; elsewhere it did `window.location` to `/catalog`, so search never opened on catalog itself.
2. Client discovery UI imported `@/lib/catalog/homepage`, which pulls Prisma / `next/cache` into the browser graph → webpack `undefined.call` during hydration.

**Fix**

- Header always dispatches `ro:open-search`.
- Client-safe modules: `lib/catalog/homepage-types.ts`, `lib/catalog/homepage-search.ts`.
- `GlobalSearchMount` lazy-loads `global-search-slot` so a poisoned search chunk cannot take down the layout.

### H-2 — Admin command palette (Ctrl/⌘K)

| Check | Result |
| --- | --- |
| `AdminCommandSearchMount` present in admin chrome | **PASS** (label «بحث أو أمر») |
| Ctrl+K opens dialog with search field | **PASS** |
| Placeholder from dictionary | **PASS** («ابحث عن طلب أو منتج أو تاجر…») |
| No client crash | **PASS** |

**Fix:** Mount `AdminCommandSearchMount` in `components/admin/shell.tsx` with dictionary labels + page map (team label reused from nav groups — no new i18n ternary).

## Quality gates run

- `npx tsc --noEmit` — clean after the fix set.
- Live browser: `/catalog?h1=1` search overlay; `/admin` after login + Ctrl+K.

## Out of scope / gate

- Phase 3 (and later) **not started** — requires explicit written owner approval per `CLAUDE.md`.
- No Prisma schema / API contract / WhatsApp production changes.
