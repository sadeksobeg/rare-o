# Runbook — secret rotation

## AUTH_SECRET (admin/trader JWT)

1. Generate new random string (≥32 chars).
2. Update `.env.production` on all app instances **together**.
3. Redeploy web containers.
4. **Effect:** all users must sign in again (cookies invalid).

## Database password

1. Create new Postgres role/password or alter user.
2. Update `DATABASE_URL` in env.
3. Rolling restart web + worker.
4. Update backup scripts if they embed credentials.

## WHATSAPP_AUTH_KEY (session encryption)

1. Stop worker.
2. Rotate key per deployment docs / Baileys crypto helper.
3. If decryption fails, full re-pair (`whatsapp-relink.md`) — plan maintenance window.

## WHATSAPP_BUSINESS_E164

1. Update env + redeploy web (wa.me links).
2. No DB migration required.
3. Communicate new click-to-chat number to marketing.

## Admin bootstrap passwords

- Change via admin UI or direct hash update — never reuse seed passwords in production.
- After first login on prod, rotate `ADMIN_PASSWORD` from seed defaults.

## Checklist after any rotation

- [ ] `smoke:prod` PASS
- [ ] Admin + trader login
- [ ] Sample wa.me handoff
- [ ] Worker connected (if applicable)
