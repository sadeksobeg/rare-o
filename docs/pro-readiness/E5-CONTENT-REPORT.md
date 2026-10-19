# E5 content & import readiness

**Date:** 2026-10-19  
**Scope:** Catalog CSV template, legal stubs, SEO/placeholder tooling (Closure Round E5).

## Deliverables

| Item | Path / command | Status |
|------|----------------|--------|
| Bilingual catalog CSV template | `docs/templates/catalog-import.csv` | Ready |
| Import validator (dry-run default) | `npm run catalog:import -- --dry-run` | Ready |
| Demo fixture purge (dry-run default) | `npm run purge:demo` | Ready |
| Legal markdown (AR/EN) | `content/legal/{privacy,terms,cookies}.{ar,en}.md` | Stub |
| Storefront legal pages + TOC | `/privacy`, `/terms`, `/cookies` via `lib/content/legal.ts` | Wired |
| Placeholder gate | `npm run check:placeholders` | Ready (fails until copy clean) |
| SEO smoke | `npm run seo:validate` | Ready (needs running app or BASE URL) |

## OWNER-ACTION (before client-facing launch)

1. **SVG logo** — replace PNG master mark per `docs/pro-readiness/OWNER-ASSETS.md`.
2. **Product photography** — drop files beside CSV (`docs/templates/media/`) and run import with `--apply`; retire editorial plates where real shots exist.
3. **Legal final copy** — replace `content/legal/*.md` placeholders; re-run `check:placeholders` after removing EN dictionary PLACEHOLDER strings if any remain.
4. **Production env** — unset `RO_SHOW_UI_FIXTURES`; optionally `npm run purge:demo -- --apply` on staging after backup.

## Notes

- CSV `imageFiles` uses `;`-separated filenames resolved under `--media-dir` (default: `docs/templates/media`).
- `purge-demo` targets regression/demo markers aligned with `lib/admin/ui-hidden.ts`; it does **not** delete published storefront seed SKUs such as `demo-string-instrument`.
- Legal pages show a banner when frontmatter `isPlaceholder: true`.
