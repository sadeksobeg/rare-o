# Runbook — incident response

## Severity

| Level | Example | Response |
|-------|---------|----------|
| S1 | Site down, data loss risk | Immediate — all hands, owner notified |
| S2 | WhatsApp worker down, admin blocked | <1h — rollback or relink |
| S3 | Degraded perf, single feature | Same business day |

## First 15 minutes

1. Confirm scope: `npm run smoke:prod -- https://DOMAIN`, check `/api/health` and `/api/ready`.
2. Capture time, SHA, recent deploys.
3. Check `docker compose ps` and logs (`web`, `worker`, `postgres`).
4. If deploy-related: consider `rollback.md`.

## Common paths

| Symptom | Likely action |
|---------|----------------|
| 502/504 | Restart web; check Caddy/disk |
| DB connection errors | Postgres disk/memory; restore if corrupt |
| WA not receiving | `whatsapp-relink.md`; verify worker |
| Admin login loop | `AUTH_SECRET` mismatch across replicas |

## After resolution

- Document timeline and root cause in ticket.
- Update `CHANGELOG.md` if user-visible.
- Schedule post-mortem for S1/S2.

## Contacts (fill owner)

| Role | Name | Channel |
|------|------|---------|
| Product owner | _TBD_ | |
| Infra | _TBD_ | |
| On-call dev | _TBD_ | |
