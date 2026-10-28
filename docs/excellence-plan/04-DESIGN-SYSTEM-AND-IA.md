# WP3 — Digital Identity, Information Architecture, and Design System

## Authoritative sources (do not duplicate, reference directly)

RARE OUD already has a complete, locked design system and IA. This document does not re-specify it — it confirms coverage, closes gaps found by cross-checking it against the *actual implemented* code (Session 1–2 of this initiative), and records the one concrete refinement from WP2.

| Topic | Authoritative doc | Coverage confirmed |
|---|---|---|
| Creative direction, motifs, color, type, motion tokens, radii, elevation | `docs/ui-planning/plan/01-foundations.md` | Complete — Decision Lock D1–D26 |
| Component specs and states | `docs/ui-planning/plan/02-components.md` | Complete |
| Every storefront screen | `docs/ui-planning/plan/03-storefront-pages.md` | Complete |
| Every admin screen | `docs/ui-planning/plan/04-admin-pages.md` | Complete |
| Trader portal | `docs/ui-planning/plan/05-trader-pages.md` | Complete |
| i18n/RTL, microcopy, a11y, perf, SEO, state patterns | `docs/ui-planning/plan/06-cross-cutting.md` | Complete — includes the explicit Arabic-first rules, RTL scroll/logical-property rules, bilingual parity check (`scripts/check-i18n.ts`), WCAG 2.2 AA checklist, error/loading taxonomy |
| Icon system (lucide + 6 brand glyphs) | `docs/visual/ICON-MAP.md` | Complete, implemented (Session 1, V2 of the motion plan) |
| Motion token system, per-surface tiers | `docs/ui-planning/VISUAL-MOTION-PLAN.md`, `docs/visual/V1-REPORT.md` | Complete through V2; **V3 (wiring signature interactions into live pages) remains explicitly on hold pending owner authorization** — unchanged by this plan |
| Phase-0 as-built inventory | `docs/ui/00-PHASE-0-INVENTORY.md`, `01_DESIGN_SYSTEM.md` | Reference baseline, superseded in places by Session 1–2 commits — see delta below |

**Arabic/RTL is not re-specified here** because `06-cross-cutting.md` §1 already treats it as a first-class design discipline (dedicated typography, numeral, mixed-script, and directional-control rules; Arabic-first design process; a parity linter that fails the build on untranslated or mirrored-wrong strings) — exactly what this mission's brief asks for. Re-writing it would risk silently diverging from the signed version.

## Delta — what changed since the as-built inventory, and what needs folding in

| Area | `00-PHASE-0-INVENTORY.md` said | Current reality (Session 1–2) | Action |
|---|---|---|---|
| Icons | "No Lucide/Heroicons dep" | `lucide-react` + `components/brand/icons/` fully implemented | Inventory doc is stale; no plan change needed, just a documentation note (owner-visible, not a defect) |
| Motion | "CSS + small client helper" | Full `components/motion/` library (`MotionProvider`, `Reveal`/`Stagger`, `PressRipple`, etc.) | Same — stale inventory, not a defect |
| Dead homepage modules | Flagged `HomeDiscovery`/`HomeCategories`/`HomeFeaturedProducts` as unused | Not re-verified this session — **flagged as an unverified implementation claim requiring a quick grep-and-confirm before WP6**, not assumed true or false | Verify in WP0-equivalent step of WP6, not invented here |

## Confirmed refinement from WP2 design research

**Card anatomy consolidation.** Catalog grid, trader deal list, wholesale list, and admin request list each currently specify (per `02`–`05`) a similar but not identical card shape (image/thumbnail, title, meta line, status/category tag, CTA). Reference 2 (Sharjah Art Foundation) confirmed this exact anatomy works well across very different content types in a bilingual RTL/LTR context. **Recommendation:** define one shared `RoListCard` primitive with slots (media, title, meta, tag, action) in `02-components.md`'s existing component table, consumed by all four surfaces, rather than four parallel implementations. This is a consolidation of already-approved visual language, not a new pattern — low risk, improves maintainability, and is exactly the kind of refinement WP2 was commissioned to surface.

**No other changes to the design system or IA are proposed.** The locked plan already satisfies this mission's structural requirements (navigation, catalog/discovery, retail/trader/wholesale journeys, admin IA, Arabic/English terminology — all specified per-screen in `03`–`05`).

## Information architecture summary (index only — full detail in `03`–`05`)

| Surface | Primary nav (AR / EN) | Entry points |
|---|---|---|
| Storefront | الرئيسية / Home · الكتالوج / Catalog · عروض مختارة / Offers · تواصل / Contact | `/`, `/catalog`, `/product/[slug]`, `/cart`, `/request`, `/offers` |
| Admin | لوحة التحكم / Dashboard · المنتجات / Products · الفئات / Categories · الطلبات / Requests · التجّار / Traders · الصفقات / Deals · الجملة / Wholesale · العملاء / Customers · صندوق واتساب / Inbox · الإعدادات / Settings | `/admin`, `/admin/products`, `/admin/categories`, `/admin/requests`, `/admin/traders`, `/admin/deals`, `/admin/wholesale`, `/admin/customers`, `/admin/inbox`, `/admin/settings/security` |
| Trader portal | الرئيسية / Home · صفقاتي / My Deals · عروض عامة / Public Offers · الجملة / Wholesale · الإشعارات / Notifications · الملف الشخصي / Profile | `/trader`, `/trader/deals`, `/trader/offers`, `/trader/wholesale`, `/trader/notifications`, `/trader/profile` |

This matches the locked plan's D11 locale-routing decision (Arabic at `/`, English at `/en/…` for storefront; cookie-only locale for admin/trader, no prefix) and D12/D13 shell decisions — confirmed still implemented via `middleware.ts` (re-verified Session 2).
