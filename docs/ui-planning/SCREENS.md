# Screen inventory — base commit `c645a60`

Old name, purpose, what exists today. Used as the "soul to keep" baseline for VISION v3 (section 5). Upgrades land wave by wave; this file is updated as each screen moves.

| File | Purpose | What exists (c645a60) | Wave |
|---|---|---|---|
| `login.html` | Admin sign-in | Dark stage, resonance-ring backdrop, cream card, email/password/2FA fields, lockout hint | 1 |
| `admin-dashboard.html` | Admin home | Dark sidebar nav, KPI grid (4 counts), action-queue table, WhatsApp status card, content-health card | 1 |
| `whatsapp-inbox.html` | Admin WhatsApp inbox | 3-pane layout (list / thread / linking), sample AR/EN dialogue | 2 |
| `requests-list.html` | Retail requests list | Filter tabs, search, table with status chips | 2 |
| `request-detail.html` | Retail request detail | Stepper, items table, admin note, customer card, event log | 2 |
| `product-form.html` | Product create/edit | AR/EN name fields, price/currency, oud specs, drag-drop upload zone | 3 |
| `trader-home.html` | Trader portal home | Greeting, two task cards (propose deal / wholesale), available-offers list | 1 |
| `deal-wizard.html` | Trader deal proposal | Item select, proposed price, message field | 2 |
| `wholesale.html` | Trader wholesale request | Item/qty/price line, notes | 2 |
| `notifications.html` | Trader notifications | Simple read/unread list | 4 |
| `account.html` | Trader account | Account details card (no security section in c645a60 — added as G1 in round 2) | 4 |
| `brokerage-pending-decision.html` | Brokerage (placeholder) | Illustrative-only banner, disabled accept/decline, no real lifecycle | 2 (full rebuild) |
| `index.html` | Mockup gallery | Flat list of links to the above | 5 (becomes showcase gallery) |

**Not present in `c645a60`, net new per VISION.md:**
- Storefront home, catalog, product page, request flow (5.9) — Wave 1 (home), Wave 3 (rest)
- Categories, Offers admin (5.6) — Wave 3
- Customers 360, Traders 360 (5.7) — Wave 4
- Admin notifications center, Settings (5.10) — Wave 4
- 404 / 403 / offline / session-expired / maintenance / onboarding (5.10) — Wave 4
- Full Brokerage screen set beyond the single placeholder (5.8, 7.2, 7.3) — Wave 2
- Kanban board views for requests/deals/wholesale/brokerage (5.4) — Wave 2/3
