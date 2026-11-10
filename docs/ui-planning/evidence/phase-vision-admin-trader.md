# Evidence — Admin Trader VISION program (2026-11-01)

Owner-approved plan: Admin Trader Vision (`admin_trader_vision_ca448eb3`).
Authority: VISION.md visuals + PLAN.md business rules.

## P0 — Authority + tokens
- Updated `.cursor/rules/rareoud-ui.mdc` for VISION (motion/sonner/cmdk allowed; dark-luxury first; 5 trader tabs).
- Extended `styles/tokens.css` with dark-luxury tokens + `.ro-portal[data-theme=dark]`.
- `PortalThemeProvider` / `PortalShellFrame` / `AppearanceCard` wired into admin + trader shells.
- Live inventory: `docs/ui-planning/SCREENS.md`, production stack note in `STACK.md`.

## P1 — Motion foundation
- `MotionProvider` wraps `LazyMotion` + `MotionConfig` (`motion/react`); Lite forces reduced motion.
- `ADMIN_MAX_MS` → 300; `.ro-row-flash` utility; portal toasts = Sonner only (AppToast removed from portal shells).

## P2 — Auth ceremony
- Login form: MotionProvider + dark portal root; Latin brand in `<bdi>`; ambient glow respects `motion-safe`.

## P3 — Admin chrome / dashboard
- Header `h-16`; user-controlled sidebar collapse (inbox still forces 72px); theme toggle; no Arabic letter-spacing on chrome labels; sticky filters `top-16`.

## P4 — Admin ops
- Unsaved guards on offer/promo/categories/trader-create/customer-notes.
- EmptyState primary actions on core lists; request/wholesale controls → Select/TextField.
- Brokerage admin sticky filters (`BrokerageAdminFilters`).

## P5 — Trader shell / home
- Bottom/desktop tabs = 5: Home · Deals · Wholesale · Brokerage · Account (Offers deep-link only).
- Max content width 1120; brand subtitle without tracking; dict `navLabelTrader`.
- Home: per-block Suspense + ErrorState + EmptyState (rose) for activity; offers link retained.

## P6 — Trader flows
- Wholesale + brokerage wizards: sessionStorage draft + `useUnsavedGuard`.
- Brokerage list/detail: dictionary keys (no `ar ? … : …` chrome copy).

## P7 / P8 — Quality pack
- Touch targets ≥44 on new chrome; stroke 1.5 on profile icons; logical props retained.
- Verification commands run in this session: see checklist below.

## Verification checklist
- [x] `npx tsc --noEmit` (run after final edits)
- [x] `npx next lint` on touched areas (as available)
- [ ] Playwright reduced-motion sample (deferred to device pass / owner lab)
- [ ] Full axe matrix AR/EN × 390/1440 (deferred; prior phase-09 baseline still reference)

## Out of scope (unchanged gates)
- Live WhatsApp QR / outbound enable
- Storefront restyle
- Destructive migrations / Roles matrix / Web Push
