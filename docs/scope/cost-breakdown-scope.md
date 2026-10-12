# Cost Breakdown — Scope Reference (no prices)

**Project:** RARE OUD platform (Project B) — multi-trader musical-instruments site
**Purpose:** a single, repo-resident scope reference so UI planning and review map to the contractual line items. Prices are intentionally omitted.
**Place at:** `docs/scope/cost-breakdown-scope.md`

Section numbering skips 05 for historical reasons (a former marketing section was merged into Trader Deals). Do not renumber.

---

## Clarifications that override older wording

1. **No trader filter.** Traders own no products, so catalog search/filter is by **type and price only** (item 2.3). Any "filter by trader" wording is obsolete.
2. **Trader accounts are created and managed by admin.** There is no trader self-registration (item 3.1).
3. **"Customer Management" (6.2) is an admin CRM list.** It is not customer accounts; visitors do not register.
4. **No payment anywhere.** Retail requests end in a prefilled WhatsApp handoff (4.1).
5. **Automatic WhatsApp status notifications to customers are out of scope.** The former item 9.4 was cancelled. Status tracking (4.3) is internal to the admin panel.
6. **Three request domains stay separate:** RetailRequest / DealProposal + NegotiationEntry + PublicCuratedOffer / WholesaleRequest (+ Line + Event). There is no generic "Order".
7. **Out of scope for this plan (future versions):** a B2B marketplace upgrade with an AI assistant (V2) and a custom oud configurator (V3). Leave room, but do not design or build them.

---

## 01 — Planning & Design

| # | Item | Scope |
|---|------|-------|
| 1.1 | Business & Requirements Discovery | Business model, trader relationships, deal proposal flow, wholesale-from-own-stock model |
| 1.2 | Site Information Architecture | Storefront, trader deals section, admin panel |
| 1.3 | UI/UX Design | Wireframes for four experiences: storefront, trader deals, WhatsApp inbox in admin, wholesale request |
| 1.4 | Brand-Aligned Visual Design | One visual direction applied across all of the above |

## 02 — Core Storefront

| # | Item | Scope |
|---|------|-------|
| 2.1 | Product Catalog Engine | Products listed by category and source |
| 2.2 | Product Detail Pages | Images, video, specifications per product |
| 2.3 | Search & Filters | By type and price (see clarification 1) |
| 2.4 | Shopping Cart | Full cart functionality |
| 2.5 | Request Finalization Flow | Review cart and confirm request details before WhatsApp handoff |
| 2.6 | Responsive Design | Mobile, tablet, desktop |

## 03 — Trader Deals & Requests

| # | Item | Scope |
|---|------|-------|
| 3.1 | Trader Registration & Onboarding | Admin-created trader accounts (see clarification 2) |
| 3.2 | Trader Profile & Deal Preferences | Trader profile and interests to match suitable deals |
| 3.3 | Trader Request Visibility | A trader sees only their own requests |
| 3.4 | Trader Request History & Status Dashboard | History and status (in review, accepted, shipped) — not sales |
| 3.5 | Public Deals Board for Traders | Deals and offers visible to all registered traders |
| 3.6 | Deal Approval Workflow | Admin accepts or rejects each proposal |
| 3.7 | Trader-Proposed Deal Requests | A trader proposes a request or offer to admin, to ship products from the client's stock on acceptance |

## 04 — Orders & WhatsApp Handoff

| # | Item | Scope |
|---|------|-------|
| 4.1 | Request-to-WhatsApp Handoff | Finalized request becomes a ready WhatsApp conversation, completed manually |
| 4.2 | Order Management System | Internal record of requests from receipt to close |
| 4.3 | Internal Order Status Tracking | Status updates inside the admin panel only |

## 06 — Admin & Reporting

| # | Item | Scope |
|---|------|-------|
| 6.1 | Admin Dashboard | Unified panel for deals, requests, customers, and the WhatsApp inbox entry point |
| 6.2 | Customer Management | List and manage customer records (clarification 3) |

## 07 — Security & Launch

| # | Item | Scope |
|---|------|-------|
| 7.1 | Data Encryption & Secure Storage | Sensitive data encrypted and stored securely |
| 7.2 | Daily Backup Configuration | Automatic daily backup |
| 7.3 | QA & Testing | Full functional pass before launch |
| 7.4 | Deployment & Launch Support | Deployment and direct support in the first days |
| 7.5 | Domain & SSL Certificate Setup | Domain linking and SSL |

## 08 — Wholesale Trader Ordering

| # | Item | Scope |
|---|------|-------|
| 8.1 | Wholesale Request Submission | A trader browses the client's own catalog and submits a bulk request |
| 8.2 | Wholesale Order Fulfillment Dashboard | The client reviews, confirms, and prepares the request for shipping |
| 8.3 | Wholesale Shipping & Fulfillment Tracking | Shipping data and a tracking reference per wholesale request |

## 09 — WhatsApp Business Integration

| # | Item | Scope |
|---|------|-------|
| 9.1 | WhatsApp Business API Connection | Account linked to the admin panel (implemented via a WhatsApp Web adapter, not the Meta Cloud API) |
| 9.2 | Unified Conversations Inbox | All WhatsApp conversations shown inside the admin dashboard |
| 9.3 | Order-to-Conversation Linking | Each request or deal linked to its conversation (RetailRequest, DealProposal, or WholesaleRequest) |
