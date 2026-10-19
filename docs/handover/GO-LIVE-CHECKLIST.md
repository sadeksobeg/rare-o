# Go-live checklist

## Infrastructure

- [ ] VPS sized per `VPS-RUNBOOK.md`
- [ ] DNS A/AAAA live; TLS via Caddy
- [ ] `.env.production` secrets set (`ENV-REFERENCE.md`)
- [ ] Postgres backups scheduled + offsite if required
- [ ] `docker compose … up -d --build` + `prisma migrate deploy`

## Application

- [ ] `npm run smoke:prod -- https://DOMAIN`
- [ ] `npm run seo:validate -- https://DOMAIN`
- [ ] `check:i18n` + `check:ar-enums` on release SHA
- [ ] Production build (`next build`) on CI or VPS

## Content & legal

- [ ] Real product photos / CSV import applied
- [ ] SVG logo deployed
- [ ] Legal markdown finalized; `check:placeholders` PASS
- [ ] `WHATSAPP_BUSINESS_E164` correct on production

## WhatsApp

- [ ] Live phone paired (`whatsapp-relink.md`)
- [ ] Worker running; inbound test message
- [ ] Outbound policy agreed (`WHATSAPP_OUTBOUND_ENABLED`)

## Data hygiene

- [ ] `RO_SHOW_UI_FIXTURES` unset
- [ ] `purge:demo --apply` on prod/staging if demo rows exist
- [ ] Seed/demo passwords rotated

## People

- [ ] Admin accounts provisioned
- [ ] Trader accounts provisioned
- [ ] UAT sign-off (`UAT-PLAN.md`)
- [ ] Hypercare schedule (`HYPERCARE-PLAN.md`)

Go-live approval: _________________ Date: _______
