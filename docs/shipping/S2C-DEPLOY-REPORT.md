# Shipping 2b+2c — Deploy Report
**Date:** 2026-11-13 · **SHA:** a54a95cf58eeec5fd9d32b8f5aeaecb66b7e5ee0 (health: `a54a95c`, builtAt 2026-11-13T10:23:57Z) · **Mode:** web-only, no migration (S1 already applied), no import.
- Dump: `/var/lib/rareoud/backups/rareoud-pre-s2c-20261113-102357.dump`
- Rollback image: `rare-oud-web:pre-s2c-20261113-102357` (re-tag to `rare-oud-web:prod`, `up -d --no-deps web`)
- Worker before/after identical (id + StartedAt); WhatsApp `connected`; `WHATSAPP_CONNECT_ON_START=false`.
- Smoke: /api/health 200 new sha; /api/ready ok; /track/<bad> 404; /admin/print/x → 307 login; /request, /catalog, /trader/login 200; quote DE 20 OK; web logs 0 error lines; Shipment table 0 rows (no data touched).
- Not verified on prod: admin Shipments / print UI visuals (needs admin session — owner to open once).
- Source on server extracted over /srv/rareoud; `.env.production` backup at `/root/env.production.pre-s2c`.
