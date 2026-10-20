# Alert rules (F4)

| Alert | Condition | Action |
|-------|-----------|--------|
| Site down | `/api/health` or external probe fails 2× | Page on-call; check Caddy + web |
| Not ready | `/api/ready` → 503 | Check DB + AUTH_SECRET |
| WA stale | `/api/wa-heartbeat` `stale=true` or age &gt; 5 min while expecting CONNECTED | Relink WhatsApp; see `docs/handover/RUNBOOKS/whatsapp-relink.md` |
| Disk full | host &lt; 15% free | Expand volume; prune backups |
| Backup failure | `test:f4-backup-drill` or daily job non-zero | Fix MinIO/rclone/age keys; restore from last good |
| Error spike | Sentry/GlitchTip (if `SENTRY_DSN` set) | Triage release |

Optional: set `SENTRY_DSN` or `GLITCHTIP_DSN` in production env (no-op if unset).

Local check: `npm run test:f4-alerts`
