# Runbook — deploy

Primary reference: `docs/pro-readiness/VPS-RUNBOOK.md`.

## Preconditions

- DNS A/AAAA → VPS
- `.env.production` filled (`ENV-REFERENCE.md`)
- `RO_SHOW_UI_FIXTURES` **unset**
- Backup taken if replacing live traffic

## Standard release

```bash
cd /opt/rare-oud-platform
git fetch && git checkout <tag-or-sha>
docker compose -f docker-compose.prod.yml --env-file .env.production pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production exec web \
  npx prisma migrate deploy
npm run smoke:prod -- https://$DOMAIN
npm run seo:validate -- https://$DOMAIN
```

## Post-deploy

- Spot-check admin login, catalog, one wa.me handoff on staging number.
- Confirm worker container healthy if WhatsApp enabled.
- Monitor logs 15–30 min (`docker compose logs -f web worker`).

## Failed deploy

See `rollback.md`. Do not re-run failed migrations blindly.
