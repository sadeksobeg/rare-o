# DOD — Storefront shell (header/footer)

Not a numbered screen ID in Part C, but required by the Phase 2 prompt ("storefront
header/footer ... built to Part C, wired to real data"). Header and footer already existed and
were judged structurally sound against Part C; the one real functional gap found (search only
working from the homepage) was fixed this phase.

## B1 Visual
- [x] Header/footer already present, branded, real nav — not rebuilt, no structural gap found.
- [ ] Lab-vs-real comparison — storefront has no lab reference for header/footer specifically
      (SF-01 home is the lab reference; header/footer are shared chrome, not separately
      designed in `design-lab/`).

## B3 Functional
- [x] **Fixed this phase:** the header's search button (`ro:open-search` event) now opens the
      full-screen `SearchOverlay` with real catalog data from every storefront route, not only
      `/`. Verified live: navigated to `/catalog`, triggered the event, got real product
      results (قانون مختار, مواقف رقمي, …), closed via the close button. Verified the homepage's
      own, more specific `DiscoveryProvider` (quick-view, compare) still works unmodified — the
      global one added this phase is nested underneath it, so React's nearest-provider-wins
      keeps the homepage's existing behavior exactly as it was. `test:week3` (58/58) re-run
      clean after the change.
- [x] Cart count, locale toggle, nav links — pre-existing, not touched, not re-verified in
      depth this phase.

## B4 Language
- [x] `check:i18n` passes; one genuine inline-ternary fix landed in `contact/page.tsx`
      (brand-name literal, not actually translatable — simplified rather than dictionary-keyed).

## B6 Performance
- [x] The new `GlobalSearchMount` adds one query (`getDiscoveryProducts`, `unstable_cache`,
      60s revalidate, same product mapping the homepage already computes) to every storefront
      page load. Not separately measured against a performance budget this phase — flagged as
      something to watch in Phase 8 (Storefront)'s Lighthouse pass, since it's the first thing
      this phase added to the *shared* storefront layout rather than a single page.

## B7 Evidence
- [ ] Full screenshot matrix / video — not captured this phase. Live verification notes above
      stand in for it.
