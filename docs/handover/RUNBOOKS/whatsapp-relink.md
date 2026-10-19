# Runbook — WhatsApp re-link

## When to use

- Phone replaced or logged out from linked device
- Baileys session errors in worker logs
- After restoring an old `.wa-auth` backup that no longer matches Meta state

## Steps

1. **Stop outbound** (optional safety): set `WHATSAPP_OUTBOUND_ENABLED=false` and restart worker.
2. **Admin UI:** `/admin/inbox` → pairing / QR flow.
3. Scan QR with the designated business phone (WhatsApp → Linked devices).
4. Confirm worker logs show connected; send test inbound message.
5. Re-enable outbound if previously disabled.
6. Run `npm run test:whatsapp-phase-a` … `phase-e` on staging if available.

## CLI / volume reset (last resort)

1. Stop worker container.
2. Backup then clear `WHATSAPP_AUTH_DIR` volume contents (never commit to git).
3. Start worker, pair again via admin UI.
4. Historical messages remain in DB; new session ID may differ — verify conversation links in admin customers/requests.

## Production notes

- One active session per `WHATSAPP_AUTH_DIR`.
- Protect volume like a password (`secret-rotation.md`).
- Live phone linking remains **OWNER-ACTION** per `FINAL-REPORT.md` item 9.1.
