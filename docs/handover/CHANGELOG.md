# Changelog (handover)

Format: release-oriented notes for operators. Full git history: `git log`.

## Unreleased (E5/E6 closure)

### Added

- Catalog CSV template and `npm run catalog:import` (dry-run default).
- `npm run purge:demo` for regression/demo fixture cleanup.
- Legal markdown under `content/legal/` and `/terms`, `/cookies` pages.
- `npm run check:placeholders`, `npm run seo:validate`.
- Handover pack: `docs/handover/*` (guides, runbooks, UAT, go-live).

### Documentation

- `docs/pro-readiness/E5-CONTENT-REPORT.md`
- `docs/handover/DELIVERY-VS-CONTRACT.md` → links FINAL-REPORT rows

## Prior milestones (see git tags / FINAL-REPORT)

- **D4:** Clean-install regression, axe/Lighthouse evidence, E2E 18/3.
- **D2:** PostgreSQL migration merged.
- **D3:** Docker/Caddy production package.
- **Week 3–4:** WhatsApp inbox, trader deals, wholesale.

---

Update this file on each production release after go-live.
