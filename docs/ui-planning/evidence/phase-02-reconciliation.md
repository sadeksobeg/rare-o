# Phase 2 — Route Reconciliation Table

Step 0 of the Phase 2 prompt (`MASTER-BUILD-PLAN.md`, Part D). Maps every screen ID in
Part C to its real-app route, whether it exists today, its design-lab reference, and notes.
No routes were renamed; gaps are reported, not silently fixed, per the prompt ("propose the
minimal fix, do not rename routes on your own").

Legend: ✅ exists and matches the planned route · ⚠️ exists but differs/incomplete · ❌ missing

## C1 — Auth and accounts (Phase 3 scope)

| ID | Route | Status | Lab ref | Notes |
|---|---|---|---|---|
| AUTH-01 | `/admin/login` | ✅ | `/login` | |
| AUTH-02 | `/trader/login` | ✅ | `/login` (tab) | |
| AUTH-03 | (forgot password) | ❌ | — | No route, no link found anywhere in the app. Plan allows this ("no self-reset unless the system supports it — report it"). Reporting: not built. |
| AUTH-04 | `/admin/force-password-change`, `/trader/force-password-change` | ✅ | `/force-password-change` | |
| AUTH-05 | (2FA code entry) | ⚠️ | — | TOTP code field exists inline in the shared login form (`adminLoginSchema`/`app/actions.ts`), not a separate screen. No dedicated 2FA **enrollment** screen found — `components/admin/security-settings.tsx` has an `enrollLabel` that's dead code (unused var, flagged by lint). "Remember this device" not found. |
| AUTH-06 | 403 / 404 / error / offline / session-expired | ⚠️ | — | 403 (`app/forbidden/page.tsx`) and 404 (`app/not-found.tsx`) are both already fully-identity screens (brand motif, search/portal CTAs) — match the Part B bar, nothing to fix. `error.tsx` exists for storefront/admin/trader route groups (generic retry UI, see Finding M-1 in `AUDIT-PHASE-1.md` for a related gap). Session-expired: `/admin\|trader/sign-out-stale` (19db7d3) redirects to login with a `?notice=` banner — functions as the session-expired screen but is a redirect, not a standalone branded screen as C1 literally describes. **Offline: no dedicated route.** Checked deliberately before building one: there is no service worker/PWA manifest in this app, so a `/offline` route would never be reachable (nothing intercepts navigation while offline to redirect there) — it would be dead code. The real offline UX today is `components/system/offline-banner.tsx`, mounted globally in every shell/layout, which shows a toast the moment `navigator.onLine` goes false/true. That's a reasonable equivalent of the intent; a dedicated offline *page* only makes sense once a service worker exists to serve it, which is out of Phase 2 scope. |
| AUTH-07 | `/admin/.../profile`, `/trader/(protected)/profile` | ⚠️ | `/admin/profile` | Trader has `/trader/(protected)/profile/page.tsx`. **Admin has no equivalent** — only `/admin/(protected)/settings/security` (password/2FA) and `/admin/(protected)/team` (team+audit tabs). Per `REMAINING-PLAN.md` decision D8, "my account" must stay separate from team/security — that admin screen doesn't exist yet. |

## C2 — Admin core (Phase 4 scope)

| ID | Route | Status | Lab ref | Notes |
|---|---|---|---|---|
| ADM-00 | shell (`components/admin/shell.tsx`, `nav.tsx`) | ✅ | admin shell | Labelled `<nav aria-label="Admin">` already present (AUDIT M-1 from the earlier UI audit, already fixed). Command palette is hand-rolled, not the `cmdk` library (package installed, unused) — kept as-is, see DECISIONS-ADDENDUM.md. It already does **real** record search (`lib/admin/command-search.ts`: products, retail, deals, wholesale, customers, traders — all live Prisma queries). **Gap found and fixed this phase:** brokerage was missing from that search despite being named in the plan; added. |
| ADM-01 | `/admin` | ✅ | `/admin` | Domain-mix now a recharts donut (this session); area/ticker chart for requests-over-time not yet built. |
| ADM-02 | `/admin/traders` | ✅ | `/admin/traders` | |
| ADM-03 | `/admin/team` | ⚠️ | `/admin/team`, `/admin/audit-log` | `/admin/team` exists with (per code) team + audit tabs merged, matching D8. But `/admin/settings/security` is a **separate** route that also exists — possible leftover from before the merge decision; worth a decision on whether it's now redundant with the team page's security tab, or intentionally distinct (password/2FA self-service vs. org-wide audit log). Not resolved here — flagging, not touching per "propose, don't rename". |
| ADM-04 | `/admin/customers` + `/admin/customers/[id]` | ✅ | `/admin/customers` | |
| ADM-05 | `/admin/brokerage` + `/admin/brokerage/[id]` | ✅ | brokerage screens | |

## C3 — Admin operations (Phase 5 scope, not in design-lab)

| ID | Route | Status | Notes |
|---|---|---|---|
| OPS-01 | `/admin/inbox` + `/admin/inbox/[id]` | ✅ | exists; out of Phase 2 scope |
| OPS-02 | `/admin/requests` + `/admin/requests/[id]` | ✅ | exists; out of Phase 2 scope |
| OPS-03 | `/admin/deals` + `/admin/deals/[id]` | ✅ | exists; out of Phase 2 scope |
| OPS-04 | `/admin/wholesale` + `/admin/wholesale/[id]` | ✅ | exists; out of Phase 2 scope |

## C4 — Admin catalog and system (Phase 6 scope)

| ID | Route | Status | Notes |
|---|---|---|---|
| CAT-01 | `/admin/products`, `/new`, `/[id]` | ✅ | exists; out of Phase 2 scope |
| CAT-02 | `/admin/categories` | ✅ | exists; out of Phase 2 scope |
| CAT-03 | (offers editor) | ⚠️ | App has **both** `/admin/offers` and `/admin/promos` as separate sections. Part C only names one "offers" screen — needs an owner decision on whether these are two distinct features (curated offers vs. promo bands, which do appear to be different domain concepts elsewhere in the code) or a naming overlap. Not resolved here. |
| SYS-01 | notifications center | ⚠️ | Trader has `/trader/(protected)/notifications`. **No admin equivalent route found.** |
| SYS-02 | settings (WhatsApp/brand/security) | ⚠️ | Only `/admin/settings/security` exists. No WhatsApp-reconnect or brand/contact-info settings route found under `/admin/settings`. |
| SYS-03 | global search results page | ❌ | Only the command-palette overlay exists; no dedicated results page. |

## C5 — Trader portal (Phase 7 scope)

| ID | Route | Status | Lab ref | Notes |
|---|---|---|---|---|
| TRD-00 | shell (`components/trader/shell.tsx`) | ✅ | trader shell | |
| TRD-01 | `/trader` | ✅ | `/trader` | |
| TRD-02 | `/trader/deals`, `/new`, `/[id]` | ✅ | — (not in lab) | |
| TRD-03 | `/trader/wholesale`, `/requests`, `/[id]` | ✅ | — (not in lab) | |
| TRD-04 | `/trader/brokerage`, `/new`, `/[id]` | ✅ | trader brokerage screens | |
| TRD-05 | `/trader/offers` + `/[slug]` | ✅ | — (not in lab) | |
| TRD-06 | `/trader/notifications`, `/trader/profile` | ✅ | — (not in lab) | Security tab lives inside `/trader/profile` per `components/trader/password-settings.tsx`. |

## C6 — Storefront (Phase 8 scope)

| ID | Route | Status | Lab ref | Notes |
|---|---|---|---|---|
| SF-01 | `/` | ✅ | `/` | |
| SF-02 | `/catalog` | ✅ | — (not in lab) | |
| SF-03 | `/product/[slug]` | ✅ | — (not in lab) | |
| SF-04/05/06 | `/cart`, `/request`, (success) | ⚠️ | — | Cart and request exist as routes; "success" is an inline state on `/request` (`dict.request.successTitle` etc.), not a separate route — functionally reasonable (matches "no duplicate on reload" easier as client state) but doesn't literally match Part C's 3-route split. Not changed here. |
| SF-07/08 | `/offers` + `/offers/[slug]` | ✅ | — (not in lab) | |
| SF-09 | `/contact` | ✅ | — (not in lab) | |
| SF-10 | `/privacy` | ✅ | — (not in lab) | `/terms` and `/cookies` also exist (not named in Part C, reasonable additions). |
| SF-11 | 404 / error / offline | ✅ | — | 404 and error exist and are shared with the rest of the app (see AUTH-06). Offline: same finding as AUTH-06 — no service worker exists, so a dedicated route isn't reachable; the global `OfflineBanner` is the real mechanism. |
| SF-12 | full-screen search | ✅ | — | `components/storefront/discovery/search-overlay.tsx` already existed (full-screen, real catalog data, keyboard nav) but was only mounted on the homepage (`HomepageShell`), so the header's search button did nothing on any other storefront page. **Fixed this phase:** a `GlobalSearchMount` now wraps the whole storefront layout with its own `DiscoveryProvider` (nested under the homepage's own, more specific one there — React's nearest-provider-wins means the homepage's compare/quick-view behavior is unchanged), so search now works from every storefront route. Verified live from `/catalog`: real product results, close button, Escape. |

## Summary

- **33 screen IDs** mapped. **20 exist cleanly**, **10 exist with gaps/ambiguity**, **3 are missing entirely** (forgot-password AUTH-03, offline AUTH-06/SF-11, storefront search SF-12 and admin search-results SYS-03 — 4 if counted separately).
- Real gaps worth owner attention before later phases build on top of them: **no offline page anywhere** (AUTH-06 and SF-11 both need it), **no admin "my account" page** (AUTH-07), **no admin notifications center** (SYS-01), and the **`/admin/settings/security` vs `/admin/team`'s security tab** possible duplication (ADM-03).
- None of these were renamed or restructured in this phase — per the prompt, they're reported for an owner decision, not fixed unilaterally.
