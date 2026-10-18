# WhatsApp live connection — manual steps (test phone)

Contract items **9.1–9.3** and retail handoff **4.1** (`wa.me` already works without a live session).

## Prerequisites

1. Set in `.env` (never commit secrets):
   - `WHATSAPP_AUTH_DIR` — private durable path (e.g. `./.wa-auth` locally)
   - `WHATSAPP_CONNECT_ON_START=true` when ready to open the socket
   - `WHATSAPP_OUTBOUND_ENABLED=true` only after inbound works
2. Dedicated **WhatsApp Business** or personal test number (not the owner’s primary if avoidable).
3. Admin app running (`npm run dev` / `npm start`).

## Link account (QR)

1. Start the worker with connect:
   ```bash
   WHATSAPP_CONNECT_ON_START=true npm run worker:whatsapp
   ```
2. Watch worker logs for a QR event (payload is not printed by default). Wire/display QR via the admin inbox connection flow when the channel is connected.
3. Open WhatsApp on the test phone → Linked devices → Link a device → scan.
4. Confirm admin dashboard ConnectionCard shows connected (not «مطلوب مصادقة»).
5. Send a test inbound message to the business number → appears in `/admin/inbox`.
6. Enable outbound: `WHATSAPP_OUTBOUND_ENABLED=true`, restart worker, reply from inbox.
7. Link a conversation to a retail request / deal / wholesale (`9.3`) from the inbox panel.

## Session persistence

- Auth files live under `WHATSAPP_AUTH_DIR`. Treat as **secret-class**.
- Restart worker without deleting the dir → should reconnect without a new QR.
- To force re-auth: stop worker, clear auth dir (after backup), start again.

## Reconnect

- On `RECONNECTING` / `AUTHENTICATION_REQUIRED`, restart worker with connect enabled and re-scan if needed.
- Outbound stays disabled when env kill-switch is false (intentional).

## Retail 4.1 without live session

Storefront request flow still prepares a bilingual `wa.me` deep link. Live inbox linking is **9.x** and requires the steps above.
