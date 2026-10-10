# Week 2 — Architecture Plan

**Roles:** Senior E-Commerce Full-Stack Architect · Senior Back-Office Systems Engineer  
**Phase:** 1 of 6 — Architecture inspection + approval patches (**no production application code written**)  
**Status:** Directionally approved — **Phase 2 coding blocked** until a separate Project B directory is confirmed  
**Program source of truth:** `docs/week-1/*` and this plan — **NOT** the Vision prototype’s copy, model, or commercial claims  
**Revision:** Project Boundary Correction — Vision is Project A (separate); Production is Project B (separate). No `/vision` route. No merge.

---

## 0. CRITICAL PROJECT BOUNDARY (LOCKED)

### Project A — Vision / presentation prototype

| Item | Detail |
|------|--------|
| Location (current workspace) | `D:\N I G H T\instrumental platform` |
| Purpose | Early client presentation / visual proof-of-concept only |
| Nature | Pitch experience (`ExperienceShell`, TENEGTA dark theme, multi-vendor narrative) |
| Week 2 treatment | **Keep separate. Do not modify. Do not convert. Do not merge.** |
| Routes in production | **None** — there is **no** `/vision` in Project B |

### Project B — RARE OUD production application

| Item | Detail |
|------|--------|
| Purpose | Production e-commerce storefront + Admin back office |
| Source of truth | `docs/week-1/*` + this architecture plan |
| Storefront | `/` only (production homepage) |
| Visual system | RARE OUD: `#0B080D` · `#32104F` · `#F2EEF4` · premium / cultural / intelligent |
| Languages | AR + EN · RTL + LTR |
| Business model | Client-owned catalog · no marketplace sellers · no payments in Week 2 |

### Asset reuse from Project A (deliberate only)

May inspect Project A **only** when needed to copy approved **assets**, for example:

- `Brand/` logo / identity files  
- Selected `public/instruments/` images (if still approved)

Reuse of an asset does **not** imply reuse of Vision architecture, routes, copy, business rules, marketplace concepts, commercial numbers, or the TENEGTA dark visual system.

### Current repository suitability

**The current working directory/repository IS Project A (the Vision prototype).**

It is **NOT** suitable as the Project B production application root.

**Phase 2 must NOT start inside this repository.**

A **separate Project B directory/repository** is required before any production coding. Candidate path must be confirmed explicitly (example pattern only — not created yet):

```text
D:\N I G H T\rare-oud-platform   (example — AWAITING CONFIRMATION)
```

Planning docs currently live under Project A’s `docs/week-1` and `docs/week-2`. When Project B is created, copy or re-home those docs into Project B as the production planning pack (mechanical copy — not Vision app merge).

---

## 1. What exists today (Project A inspection — reference only)

| Area | Finding |
|------|---------|
| Framework | Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion |
| App surface | Vision pitch at `/` — **not** a production store |
| Data / auth | **None** |
| Design | Dark TENEGTA vision theme — **not** RARE OUD product identity |
| Business copy | Multi-vendor pitch narrative — **not authoritative** |

This inspection informs the boundary only. It does not authorize converting Project A into Project B.

---

## 2. What Project B will use

**From Week 1 / this plan (authoritative):**

- Business rules, IA, wireframes, brand tokens  
- Approved architecture (currency OPEN, shipping extension point, etc.)

**From Project A (optional assets only):**

- Brand files / selected instrument photos if still approved  

**Not from Project A:**

- Routes, components architecture, ExperienceShell, marketplace copy, TENEGTA theme as product identity, old commercial numbers, seller concepts  

---

## 3. What Project B will contain (Week 2 only)

### 3.1 Application surfaces

| Route group | Purpose |
|-------------|---------|
| `/(storefront)/...` at `/` | Public RARE OUD store (home, catalog, PDP, cart, request) |
| `/(admin)/admin/...` | Single-Admin back office |

**There is NO `/vision` route in Project B.**

### 3.2 Data & API foundation

- Catalog CRUD (Admin)  
- Public catalog read (published only)  
- Cart validation on request submit  
- Retail request + handoff payload (`draft` \| `ready_for_handoff`)  
- Customer contact records (guest-compatible; phone **not** unique identity)  
- Minimal operational Admin dashboard  

### 3.3 Auth

One Admin (env credentials / session). No customer accounts. No Trader auth in Week 2.

### 3.4 Localization

AR + EN, RTL + LTR. Partial bilingual product content allowed (no dual-complete commercial publish mandate).

### 3.5 Design

RARE OUD tokens only on Project B. No TENEGTA dark product theme. No flash-sale chrome. No marketplace seller cues.

---

## 4. Domain answers (unchanged intent from approval patch)

### A. Product model

Identity, bilingual names/descriptions/specs (partial OK), category (one of two launch), `retailPrice`, configurable `currency` (**commercial default OPEN — not USD/SYP**), `draft|published|archived`, `available|unavailable` as **public retail flag only** (not stock), media 0+, `wholesaleEligible` flag only for later.

### B. Categories

1. String Musical Instruments  
2. Accessories  

Admin: edit labels/order only. **No** unrestricted create-category in Week 2.

### C–D. Ownership / wholesale

RARE OUD owns catalog. No trader ownership. Wholesale ordering is Week 3; flag only now.

### E–F. Search / cart

Simple DB filters; client cart + server revalidation; price+currency snapshot on lines; no payments.

### G. Retail request

Statuses Week 2 only: `draft` | `ready_for_handoff`. Structured handoff payload for Week 3 WhatsApp — **no send**.

### H. Customer

`name`, `phone`, `notes`, timestamps. Phone not unique. Guest supported. Accounts OPEN.

---

## 5. Proposed data model (conceptual) — Project B

```text
Category          // two launch only
Product           // currency configurable; availability = retail flag
ProductImage
Customer          // contact record; phone NOT unique
RetailRequest     // status: draft | ready_for_handoff
RetailRequestLine
AdminUser         // single
```

**Shipping:** destination country + optional nullable method fields; **code-level extension point only** (`resolveAvailableMethods` → `[]` for now). No shipping admin UI, seeds, maps, or prices in Week 2.

**Absent:** Deal, Negotiation, WholesaleRequest, WhatsAppThread, Payment, Vendor, Commission, inventory/stock, Vision routes.

---

## 6. Module boundaries — Project B (clean greenfield)

```text
app/
  (storefront)/     # `/` production storefront
  (admin)/admin/    # protected admin
  # NO (vision)/ and NO /vision

lib/
  db/ auth/ catalog/ cart/ retail-request/
  shipping/         # extension point only
  i18n/ validation/

components/
  storefront/ admin/ ui/
```

---

## 7. Persistence & stack (Project B)

| Choice | Recommendation |
|--------|----------------|
| DB | Prisma + SQLite (Week 2), Postgres-portable — confirm at Phase 2 kickoff |
| Validation | Zod server-side |
| Admin auth | Env single admin + session |
| Cart | localStorage + server validate |
| Media | local uploads path in DB |

---

## 8–9. Shipping & Admin (summary)

- Shipping: capture country; method null + team note if none approved; no rate engine / admin shipping product.  
- Dashboard: published/draft/unavailable counts; request counts by Week 2 status; recent requests. **No** WhatsApp/contacted metrics.  
- Categories: edit two launch only.  

---

## 10–12. UX / security / deps

RARE OUD visual system; AR+EN; server authZ; Zod; no WhatsApp/payment/shipping-rate packages.

---

## 13. Risks

| Risk | Mitigation |
|------|------------|
| Accidentally coding inside Vision repo | **Hard stop** — Project B directory required first |
| Carrying Vision marketplace/TENEGTA identity | Greenfield Project B; assets only if deliberate |
| Currency / shipping commercially OPEN | Configurable currency; shipping extension point |
| Week 3 scope creep | Boundary checklist each phase |

---

## 14. Open business decisions

Currency · shipping availability/prices · customer accounts · tax-in-price · non-catalog conversion · negotiation channel/states · trader classification/MOQs · WhatsApp template · deal fields · logo/type handoff · trader-as-shopper · dual-language commercial publish policy (if ever)

---

## 15. Technical assumptions (revised)

| ID | Assumption |
|----|------------|
| T-01 | Prisma + SQLite in **Project B** (Postgres-portable) |
| T-02 | Currency configurable; **no** USD/SYP commercial default |
| T-03 | Default UI locale Arabic; EN switcher |
| T-04 | ~~`/vision` relocate~~ **REMOVED.** Vision stays Project A only. Project B has **no** `/vision` |
| T-05 | localStorage cart + server validate |
| T-06 | Optional video media kind |
| T-07 | Availability = public retail flag only |
| T-08 | shippingMethod null when none approved; no shipping admin/seeds |
| T-09 | Single Admin via env |
| T-10 | No customer login; phone not unique |
| T-11 | Request status: `draft` \| `ready_for_handoff` only |
| T-12 | Partial bilingual OK |
| T-13 | No unrestricted create-category |
| T-14 | Phase 2 code lands **only** in confirmed Project B directory |

---

## 16. Pre-Phase-2 gates (must clear)

1. **Confirm Project B directory/repository path** (separate from Vision).  
2. Initialize Project B as clean Next.js production app (after explicit approval).  
3. Copy Week 1 + Week 2 planning docs into Project B.  
4. Then — and only then — Phase 2 coding may begin **inside Project B**.  

Still confirm if needed: Prisma+SQLite vs Postgres; admin env auth; extra product fields.

---

## 17. Intentionally NOT built / NOT done in Week 2

- Any modification of Project A (Vision) application code  
- `/vision` route in Project B  
- Merging or converting Vision into production  
- WhatsApp / deals / wholesale / payments  
- Shipping rate engine / shipping admin  
- Invented currency defaults / FX  
- Marketplace seller tools / trader inventory / commissions  
- Mandatory customer accounts  
- Vision redesign  

---

## 18. Implementation phases (only after Project B path approval)

| Phase | Work | Where |
|-------|------|--------|
| Gate | Create/confirm Project B directory; scaffold clean app; copy docs | Project B only |
| 2 | DB, seed 2 categories, Admin auth, Admin catalog CRUD | Project B |
| 3 | Storefront catalog + PDP | Project B |
| 4 | Search/filters + cart | Project B |
| 5 | Retail request + handoff payload | Project B |
| 6 | Hardening + Week 2 DoD | Project B |

---

## 19. Consistency audit

| Check | Result |
|-------|--------|
| Vision treated as production? | **No** — Project A only |
| `/vision` in production? | **No** |
| Marketplace / seller / commissions? | Absent |
| Payment gateway? | Absent |
| Shipping rate engine / invented prices? | Absent |
| Invented currency default? | Absent |
| Mandatory accounts / unique phone? | Absent |
| Week 3 WA / deals / wholesale? | Absent |
| TENEGTA dark identity as product? | Absent from Project B |
| Vision code modified this turn? | **No** (docs only) |

---

## Confirmation block

1. **Production project boundary:** Project B = new separate RARE OUD production app; storefront `/`; no Vision routes.  
2. **Vision treatment:** Project A remains separate presentation prototype; untouched for Week 2 product work.  
3. **Reuse from Vision:** Deliberate assets only (Brand / selected images) — not architecture or business rules.  
4. **Week 2 production code:** **NOT started.**  
5. **Vision application code:** **NOT modified** (architecture doc update only).  
6. **Current repository:** **IS the Vision prototype (Project A)** — **NOT suitable as Project B.** A **separate project directory is required.**

**STOP — awaiting explicit confirmation of the Project B directory path before any Phase 2 coding or scaffold.**
