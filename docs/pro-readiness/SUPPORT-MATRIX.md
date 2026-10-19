# Browser & device support matrix

| Surface | Chromium (Chrome) | Firefox | Safari (WebKit) | Mobile Chrome (Pixel 7) | Mobile Safari (iPhone 13) |
|---------|-------------------|---------|-----------------|-------------------------|---------------------------|
| Storefront (AR/EN) | Supported | Supported | Supported | Supported | Supported |
| Admin portal | Supported | Supported | Supported | Best-effort¹ | Best-effort¹ |
| Trader portal | Supported | Supported | Supported | Best-effort¹ | Best-effort¹ |
| WhatsApp handoff (wa.me) | Supported | Supported | Supported | Supported | Supported |

¹ Admin/trader dense tables and media upload are validated primarily on desktop Chromium in CI; mobile layouts are responsive but not all admin workflows are optimized for small viewports.

## Playwright projects

Configured in `playwright.config.ts`: `chromium` (system Chrome channel on Windows when `PW_CHANNEL=chrome`), `firefox`, `webkit`, `mobile-chrome`, `mobile-safari`.

## Server / runtime

| Component | Version |
|-----------|---------|
| Node.js | 20 LTS |
| PostgreSQL | 16 (production); SQLite acceptable for local dev only |
| Next.js | 15.x |

## Accessibility target

WCAG 2.1 Level AA for storefront flows; admin/trader AA for primary tasks (see `ACCESSIBILITY-STATEMENT.md`).
