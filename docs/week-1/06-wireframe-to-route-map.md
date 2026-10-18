# Week 1 wireframes → as-built routes (alignment notes)

**Date:** 2026-10-18  
**Wireframe source:** [03-uiux-wireframes.md](./03-uiux-wireframes.md)  
**Route source:** Next.js App Router under `app/`  
**Marks:** **MATCH** = primary flow exists; **PARTIAL** = same intent, layout/spec gaps; **DEVIATES** = materially different structure; **N/A** = gated or not in v1

---

## Storefront (Surface 1)

| Wireframe | Plan ID | Route(s) | Mark | Notes |
|-----------|---------|----------|------|-------|
| SF-01 Home | H1–H9 (plan) / compact hero (wireframe) | `/`, `/en` → `app/(storefront)/page.tsx` | DEVIATES | Commerce stack (shortcuts, grids, editorial) ≠ locked H1–H9 plan stack; see `CONFORMANCE.md` P4 |
| SF-02 Catalog | SF-02 | `/catalog`, `/en/catalog` → `catalog/page.tsx` | PARTIAL | Filter bar + mobile sheet; SEO/polish open |
| SF-03 Product detail | SF-03 | `/product/[slug]` | PARTIAL | Gallery, request CTA, specs present |
| SF-04 Cart | SF-04 | `/cart` | PARTIAL | Request-list naming; sticky summary extraction open |
| SF-05 Request / handoff | SF-05 | `/request` | PARTIAL | Country + consent; WhatsApp handoff |
| SF-06 / SF-07 Offers | SF-06/07 | `/offers`, `/offers/[slug]` | PARTIAL | Curated language; D30 rules |
| SF-08 Contact | SF-08 | `/contact` | PARTIAL | Two-column + plate per plan |
| SF-09 Privacy | SF-09 | `/privacy` | PARTIAL | Structure + sticky TOC; **owner legal copy still PLACEHOLDER** (`dict.privacy`) |
| System 404 / error | SF-10 | `app/not-found.tsx`, group `error.tsx` | PARTIAL | Search on 404 (slice G) |

---

## Trader portal (Surface 2)

| Wireframe | Route(s) | Mark | Notes |
|-----------|----------|------|-------|
| TR sign-in | `/trader/login` | PARTIAL | Help link polish |
| TR dashboard | `/trader` → `(protected)/page.tsx` | PARTIAL | Tasks, deals, offers rail |
| Propose deal | `/trader/deals/new` | PARTIAL | Form page, not extracted Wizard (T04) |
| Deals list | `/trader/deals` | PARTIAL | Tabs + cards |
| Deal negotiation | `/trader/deals/[id]` | PARTIAL | **NegotiationThread MATCH** (`components/deals/negotiation-thread.tsx`) |
| Wholesale catalog | `/trader/wholesale` | PARTIAL | |
| Wholesale requests | `/trader/wholesale/requests`, `[id]` | PARTIAL | Quote/read paths |
| Offers (trader) | `/trader/offers`, `[slug]` | PARTIAL | Prefill subject |
| Profile | `/trader/profile` | PARTIAL | Read-only |
| Notifications | `/trader/notifications` | PARTIAL | Status center |

---

## Admin — WhatsApp inbox (Surface 3)

| Wireframe | Route(s) | Mark | Notes |
|-----------|----------|------|-------|
| Inbox list | `/admin/inbox` | PARTIAL | Not full 3-pane ≥1280; tabs/search partial |
| Thread + context | `/admin/inbox/[id]` | PARTIAL | Composer, bubbles; **RecordPicker MATCH** via `linked-record-panel.tsx` |
| Link conversation ↔ record | Inbox actions | PARTIAL | Single active link; A16 polish |

---

## Admin — operational screens (plan Part 04)

| Plan screen | Route(s) | Mark | Notes |
|-------------|----------|------|-------|
| AD-01 Login | `/admin/login` | PARTIAL | |
| AD-02 Dashboard | `/admin` | DEVIATES | KPI/queue/feed not plan-shaped |
| AD-03 Inbox | see above | PARTIAL | |
| AD-04 Requests | `/admin/requests`, `[id]` | PARTIAL | **AdminTableFilters** on list |
| AD-05 Deals | `/admin/deals`, `[id]` | PARTIAL | Thread **MATCH** on detail |
| AD-06 Wholesale | `/admin/wholesale`, `[id]` | PARTIAL | Shipping block per D37b |
| AD-07 Products | `/admin/products`, `new`, `[id]` | PARTIAL | Publish rules server-side; ImageUploader on edit |
| AD-08 Categories | `/admin/categories` | PARTIAL | Launch slug edit only; no create dialog |
| AD-09 Offers | `/admin/offers`, `new`, `[id]` | PARTIAL | Publish rules in `lib/offers/service.ts` |
| AD-10 Customers | `/admin/customers`, `[id]` | PARTIAL | Detail page exists; no linked conversations block |
| AD-11 Traders | `/admin/traders` | PARTIAL | Show-once password pattern |
| Promos (gated) | `/admin/promos` | N/A | `RO_PROMO_FEATURES` |

---

## Cross-surface flows (wireframe diagram)

The mermaid map in [03-uiux-wireframes.md](./03-uiux-wireframes.md) still describes **intent**. As-built:

- Storefront request → WhatsApp handoff → admin inbox linking: **implemented** (manual link + RecordPicker).
- Trader deal → admin negotiation → optional curated offer: **partial** (negotiation yes; auto-offer publish not automatic — correct).
- Wholesale quote/fulfill: **partial** (schema/UI gaps on shipping).

For conformance marks and component IDs (A03, A17, A19, etc.), see [../ui-planning/plan/CONFORMANCE.md](../ui-planning/plan/CONFORMANCE.md).
