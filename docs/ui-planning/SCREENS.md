# Screen inventory — live app (VISION admin + trader program)

Base mockup inventory for `c645a60` is retained below the divider. This section maps **production App Router** surfaces for the Admin Trader Vision program (2026-11-01).

## Admin (`app/admin`)

| Route | Purpose | VISION target | Status |
|---|---|---|---|
| `/admin/login` | Admin sign-in | §5.1 ceremony | In progress |
| `/admin/force-password-change` | Forced password gate | Auth polish | Exists |
| `/admin` | Dashboard KPI/queue/charts | §5.2 | Elevate |
| `/admin/inbox`, `/admin/inbox/[id]` | WhatsApp 3-pane | §5.3 | Elevate |
| `/admin/requests`, `/admin/requests/[id]` | Retail list + detail/kanban | §5.4 | Elevate |
| `/admin/deals`, `/admin/deals/[id]` | Trader deals | §5.4 | Elevate |
| `/admin/wholesale`, `/admin/wholesale/[id]` | Wholesale ops | §5.4 | Elevate |
| `/admin/brokerage`, `/admin/brokerage/[id]` | Brokerage board + detail | §7 | Elevate |
| `/admin/products`, `new`, `[id]` | Catalog | §5.6 | Elevate |
| `/admin/categories` | Categories | §5.6 | Elevate |
| `/admin/offers`, `promos` | Public offers / promos | §5.6 | Elevate |
| `/admin/customers`, `[id]` | Retail CRM | §5.7 | Elevate |
| `/admin/traders`, `[id]` | Trader 360 | §5.7 | Elevate |
| `/admin/team` | Team + audit | §5.10 | Elevate |
| `/admin/notifications` | Alerts hub | §5.10 | Elevate |
| `/admin/settings`, `security` | Settings hub | §5.10 | Elevate |
| `/admin/profile` | Profile / 2FA / sessions / theme | §5.10 | Elevate |

## Trader (`app/trader`)

| Route | Purpose | VISION target | Status |
|---|---|---|---|
| `/trader/login` | Trader sign-in | §5.1 | In progress |
| `/trader/force-password-change` | Forced password | Auth | Exists |
| `/trader` | Home waiting + tasks + offers | §5.8 | Elevate · 5-tab shell |
| `/trader/deals`, `new`, `[id]` | Deals list + wizard + detail | §5.8 | Elevate |
| `/trader/wholesale`, `requests`, `[id]` | Wholesale builder + detail | §5.8 | Elevate |
| `/trader/brokerage`, `new`, `[id]` | Brokerage (tab replaces Offers) | §7 | Elevate + i18n |
| `/trader/offers`, `[slug]` | Offers (deep link, not tab) | §5.8 | Keep + OfferCard |
| `/trader/notifications` | Notifications | §5.8 | Elevate |
| `/trader/profile` | Account + theme | §5.8 | Elevate |

## Shell decisions (VISION program)
- Admin: dark-luxury first + optional light via `data-theme`; sidebar 264↔72 user toggle; inbox forces collapse.
- Trader bottom tabs (5): Home · Deals · Wholesale · Brokerage · Account. Offers via home + `/trader/offers`.

---

## Legacy mockup inventory (`c645a60`)

| File | Purpose | What exists (c645a60) | Wave |
|---|---|---|---|
| `login.html` | Admin sign-in | Dark stage, resonance-ring backdrop, cream card | 1 |
| `admin-dashboard.html` | Admin home | Dark sidebar, KPI grid, action-queue | 1 |
| `whatsapp-inbox.html` | Inbox | 3-pane | 2 |
| `requests-list.html` | Retail list | Filter tabs, table | 2 |
| `request-detail.html` | Retail detail | Stepper, items | 2 |
| `product-form.html` | Product form | Specs + upload | 3 |
| `trader-home.html` | Trader home | Greeting, task cards | 1 |
| `deal-wizard.html` | Deal proposal | Item + price | 2 |
| `wholesale.html` | Wholesale | Lines | 2 |
| `notifications.html` | Trader notifications | List | 4 |
| `account.html` | Trader account | Details | 4 |
| `brokerage-pending-decision.html` | Brokerage placeholder | Illustrative | 2 |
