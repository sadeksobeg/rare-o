# Shipping — compliance & privacy notes

- **Public tracking (`/track/<token>`)**: unguessable 18-byte base64url token, noindex/nofollow, rate-limited (30/min/IP). Exposes only status, destination country, carrier, tracking number, event notes/timestamps. Never name, phone, address, price, actor, photo.
- **Free text** (carrier, notes, address) is stripped of control chars and `<>` on write; React escapes on render.
- **Notifications**: in-app only. No automatic WhatsApp. Any future WhatsApp notice must be opt-in, only on an existing inbound conversation, via the existing outbox + kill switch + caps.
- **Sanctions / restricted destinations**: the country list is ISO-derived; the owner must decide which destinations to disable (e.g. sanctioned jurisdictions) before launch — disable via Admin → Shipping → Countries. Not decided in code.
- **Customs**: commercial invoice prints declared value only if entered; the team is responsible for HS codes / declarations per destination. Musical instruments with protected materials (CITES-listed woods) may need permits — verify per shipment.
- **Data retention**: shipments/events are kept with the request; deleting a request sets the link to null (no cascade of shipment data loss).
- **Access**: shipment create/transition and print documents are admin-session only and audit-logged (`shipping.shipment.*`). Traders see only shipments of their own wholesale/brokerage requests.
