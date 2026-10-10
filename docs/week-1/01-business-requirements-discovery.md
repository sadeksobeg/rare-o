# Week 1 — Business & Requirements Discovery

**Brand:** RARE OUD  
**Client role:** Platform owner (catalog, retail fulfillment, wholesale fulfillment, admin operations)  
**Audience for this document:** Non-technical business owner + delivery team  
**Status:** Revised after client clarifications (Week 1 planning only — no engineering)  
**Revision:** Client Clarifications Update — source of truth for conflicting items

---

## 1. What this platform is (plain language)

RARE OUD is **not** a conventional multi-vendor marketplace where each trader runs a personal shop.

It is a **client-owned instrument commerce platform** with three commercial motions:

1. **Public retail storefront** — shoppers browse the RARE OUD catalog and submit a purchase request; the system prepares a complete WhatsApp message so the customer does not retype the order (no online payment).
2. **Trader commercial deal negotiation** — authorized traders propose commercial deals (related to a catalog product **or** a product/opportunity not yet listed). RARE OUD reviews and may accept **or** respond with different price/terms. Discussion continues until agreement or the opportunity is closed. This is **negotiation**, not a simple approve/reject gate. Public presentation of any agreed catalog offer remains under the **unified RARE OUD identity** (trader name not shown as a seller).
3. **Wholesale trader requests** — authorized traders request wholesale quantities from the client’s catalog; they specify quantity and may propose a price **or** ask RARE OUD for a quotation. Pricing varies with quantity. RARE OUD fulfills and ships from client inventory.

```text
RARE OUD PLATFORM
  → Client-owned catalog
  → Public retail storefront (unified brand)
  → Traders propose commercial deals (catalog or non-catalog opportunity)
  → RARE OUD negotiates (accept / counter-terms / continue / close)
  → Agreed catalog offers may appear as RARE OUD curated offers
  → Traders submit wholesale requests (qty + proposed price OR request quote)
  → Retail request details are prepared automatically for WhatsApp
  → Operational conversations continue via WhatsApp where applicable
```

---

## 2. Confirmed business rules

| # | Rule | Implication for design |
|---|------|------------------------|
| BR-01 | All platform catalog products managed by RARE OUD | Traders do not create seller listings or manage catalog inventory |
| BR-02 | Traders do not own products, inventory, or personal storefronts | No vendor shop pages; no trader stock screens |
| BR-03 | Product “source” / trader identity is not public seller identity | Do not expose trader as the seller on storefront |
| BR-04 | Admin/client controls base catalog product price | Store shows RARE OUD pricing unless an agreed offer changes the public commercial presentation |
| BR-05 | Trader may propose **any** commercial deal; may relate to catalog product **or** non-catalog opportunity | Propose-deal UX must support both paths; RARE OUD retains full control of outcome |
| BR-05a | A non-catalog opportunity does **not** automatically create, publish, or modify a catalog product | No trader “Create Product”; no auto-listing; any future catalog conversion is OPEN and Admin-controlled only |
| BR-06 | Deal handling is **negotiation** (accept, counter-terms, continue, or close) — not primary “Rejected” model | Deal UI = proposal + responses/history; avoid reject/resubmit as core concepts |
| BR-07 | Deal conditions matter and must fit premium RARE OUD marketing | Support serious commercial conditions; avoid flash-sale / bargain aesthetics and copy |
| BR-08 | Public store is primarily B2C retail | Guest-friendly retail path |
| BR-09 | Wholesale is a separate authenticated trader workflow | Separate trader area; not mixed into guest checkout |
| BR-10 | Retail fulfillment controlled by RARE OUD | Trader never fulfills retail customer orders |
| BR-11 | Wholesale uses client catalog | Same product database with wholesale eligibility — not a second product DB; no fixed static wholesale price list assumed |
| BR-12 | Wholesale request: quantity required; trader may propose price **or** request quotation | Form supports both commercial modes |
| BR-13 | Wholesale pricing varies according to quantity | Do not assume static wholesale unit prices |
| BR-14 | New traders: minimum quantity/order threshold exists and **varies by product**; regular traders: **no** minimum | Exact “new vs regular” definition OPEN; exact MOQ values not invented |
| BR-15 | Only approved/authorized traders submit wholesale | Trader status gating |
| BR-16 | No online payment gateway | Retail ends in WhatsApp handoff with auto-prepared message |
| BR-17 | One official WhatsApp Business channel (unless later changed) | Single-channel architecture |
| BR-18 | Launch admin: **one Admin user** | Do not build multi-admin/staff management as launch scope; keep architecture reasonably extensible only |
| BR-19 | Guest checkout supported; account not mandatory | Registration optional |
| BR-20 | Commercially Syria-first, **not Syria-only** — destinations include Syria and countries outside Syria | Architecture/design must support domestic + international destinations |
| BR-21 | Shipping methods are destination-dependent and may differ between Syria and countries outside Syria (examples of method types: air consolidation, land consolidation, Aramex, postal, hand delivery — **not** universally available) | Customer selects destination country → system presents methods configured/available for that destination; **exact availability, shipping charges, and packaging charges DEFERRED** — no rate engine |
| BR-22 | Roles at launch: Guest, Customer, Trader, Admin | No extra roles unless a real need appears |
| BR-23 | Languages confirmed: **Arabic (RTL)** and **English (LTR)**; localization-ready content | Language switcher in IA; no Arabic-only lock |
| BR-24 | Launch categories confirmed: **String musical instruments**, **Accessories** | Do not add categories unless client adds them later |
| BR-25 | Brand: RARE OUD — premium / cultural / intelligent | Curated deals; no discount-store visual language |

---

## 3. Actors & jobs-to-be-done

### 3.1 Guest / Customer (retail)

- Browse catalog (String musical instruments; Accessories).
- Filter/search; open product detail (images, video, specs).
- See curated RARE OUD offers when an agreed catalog deal is presented publicly (no trader seller name).
- Add to cart; complete request as **guest** with contact + notes; provide/select destination country; see destination-dependent shipping methods when configured (**shipping/packaging pricing OPEN/DEFERRED**).
- System prepares WhatsApp message with complete request details; customer continues without rewriting the order.

### 3.2 Trader

- Register / onboarding (admin approval assumed for full access).
- Propose a commercial deal: link to catalog product **or** describe a non-catalog opportunity (description only — does **not** create a catalog product).
- Negotiate with RARE OUD (view responses/counter-terms; continue discussion until agreement or closed — exact closure states OPEN).
- Receive notifications about deal and wholesale status.
- Submit wholesale requests: quantity + proposed price **or** request quote; respect new-trader minimums when applicable (rules OPEN for exact values/definition).
- See own wholesale requests and shipping/tracking updates.
- **Does not:** manage inventory, own a storefront, see other traders’ retail business, fulfill retail, collect payment online, earn platform commissions.

### 3.3 Admin (single launch user)

- Manage catalog (products in the two launch categories, media, base price, wholesale-related fields as needed without inventing a fixed price list).
- Review trader onboarding.
- Negotiate trader deals (accept, respond with different terms, continue, close opportunity).
- Manage retail requests through operational status lifecycle.
- Unified WhatsApp conversations inbox; link conversations to requests.
- Fulfill wholesale; enter shipping/tracking.
- Manage customers (if accounts exist) and light settings — **not** multi-staff admin management at launch.

---

## 4. Core domain objects (conceptual — not a database schema)

| Object | Owned by | Public visibility | Notes |
|--------|----------|-------------------|-------|
| Product | RARE OUD | Yes (if published) | Categories: String instruments, Accessories |
| Category | RARE OUD | Yes | Launch set confirmed (2 categories) |
| Deal Proposal / Negotiation | Trader ↔ RARE OUD | Only agreed catalog outcomes may appear as RARE OUD curated offers | May reference catalog product **or** non-catalog opportunity; non-catalog ≠ auto catalog product; trader not shown as seller |
| Retail Request | Customer → Admin ops | Via WhatsApp / optional account | Auto-prepared WA message; no payment |
| Wholesale Request | Trader → Admin ops | Trader portal only | Qty + proposed price or quote request; qty-sensitive pricing |
| Conversation (WhatsApp) | Admin ops | Admin inbox | Linkable to retail/wholesale request |
| User | Platform | Role-based | One Admin at launch; Guest allowed for retail |

---

## 5. End-to-end flows (business level)

### Flow A — Retail request → WhatsApp

1. Guest browses catalog / curated offer.  
2. Adds items to cart.  
3. Enters contact + notes; provides/selects **destination country** (Syria or outside Syria).  
4. Sees **destination-dependent** shipping methods configured/available for that destination (examples of method types may include air consolidation, land consolidation, Aramex, postal, hand delivery — not all methods in every country).  
5. System creates request reference. Shipping/packaging **prices are not calculated** here (**DEFERRED**).  
6. System **automatically prepares** WhatsApp message with complete order/request details (incl. country + selected method when chosen).  
7. Customer opens WhatsApp without rewriting the order.  
8. Admin continues commercially in WhatsApp + updates status in admin.  
**Exact message template:** OPEN (finalize later).  
**Shipping wording lock:** Shipping methods are destination-dependent and may differ between Syria and countries outside Syria. Exact availability, shipping charges, and packaging charges are deferred pending client confirmation.

### Flow B — Trader deal negotiation

1. Trader proposes a deal (catalog product **or** non-catalog opportunity) with commercial terms/conditions.  
2. Status enters review / negotiation (exact state names OPEN where not yet needed).  
3. RARE OUD may **accept**, **respond with different price/terms**, or continue discussion until agreement or opportunity closed.  
4. If an agreed outcome involves a public catalog offer → present under RARE OUD curated identity.  
5. **Invariant:** a non-catalog proposal never auto-creates/publishes/modifies a catalog product; any future conversion is Admin-controlled and **OPEN** (not designed in Week 1).  
6. **Do not** model the primary outcome as “Rejected” + mandatory rejection reason + resubmit.  
**OPEN:** exact workflow when converting a non-catalog opportunity into a catalog product (if ever); whether negotiation stays fully in-platform or moves to WhatsApp/other channels; final closure state set.

### Flow C — Wholesale request → fulfillment

1. Approved trader opens wholesale-eligible catalog.  
2. Submits quantity; optionally proposes a price **or** requests RARE OUD quotation.  
3. Pricing expected to vary with quantity (no fixed invented price list).  
4. If trader is “new,” minimum quantity/order threshold may apply per product; if “regular,” no minimum — **definition of new vs regular OPEN; exact MOQ values not invented**.  
5. Admin confirms / prepares / ships; tracking recorded.  
6. Trader sees status + tracking.

---

## 6. Functional requirements mapped to program weeks

| Capability | Week | Notes |
|------------|------|-------|
| Planning & design (this pack) | 1 | No code |
| Core storefront (catalog, PDP, search, cart, responsive) | 2 | Handoff UI may be stubbed; full handoff payload Week 3 |
| Admin & reporting | 2 | Single admin; inbox shell; live WA API Week 4 |
| Orders & WhatsApp handoff | 3 | Auto-prepared message |
| Trader deals & negotiation | 3 | |
| Wholesale trader ordering | 3 | |
| WhatsApp Business integration | 4 | |
| Security & launch | 4 | Always last |

**Dependency note:** Week 2 may reserve placeholders for request reference, shipping method selection shell, and WhatsApp CTA — must not implement negotiation, wholesale, or WA API early.

---

## 7. Explicit non-goals (out of scope)

- Online payment gateway  
- Trader-owned products / seller storefronts / marketplace vendor model  
- Trader inventory management  
- Trader personal sales / commission dashboards  
- Trader checkout or trader payment collection  
- Loyalty programs / automated marketing / advanced BI beyond scoped admin  
- Complex shipping **pricing** engine or invented rates/packaging formulas  
- Advanced promotion / flash-sale engines  
- Multi-admin/staff management as a launch feature  

If a dependency seems to need any of the above → **Scope clarification required**.

---

## 8. Assumptions still labeled for client review (not confirmed)

> Only items still useful as working assumptions — **not** treated as confirmed requirements.

| ID | Topic | Working assumption | Notes |
|----|-------|--------------------|-------|
| A-01 | Deal commercial fields | Flexible terms fields (price/terms + conditions + free-text commercial note) without inventing a promotion engine | Exact field set still refineable |
| A-02 | Public offer window | If a deal becomes a public catalog offer, an optional visibility window may apply | Not a countdown flash-sale mechanic |
| A-03 | Customer accounts | Optional “save my details”; guest remains primary | Still not confirmed as required |
| A-04 | Retail request statuses | New → In discussion → Confirmed → Preparing → Shipped/Ready → Closed / Cancelled | Refine with client if needed |
| A-05 | Offers nav | Dedicated Offers section **and** quiet catalog markers for curated offers | Prefer curated language over “SALE” |
| A-06 | Languages default | Default locale Arabic; English available via switcher | Both languages confirmed |
| A-TYPO | Typefaces | Pending logo/brand font handoff | Unchanged |

### Removed / superseded assumptions (conflicted with client)

| Former | Why removed |
|--------|-------------|
| A-10 Rejection reason required | Negotiation model replaces reject-primary flow |
| A-11 Resubmit after reject | Replaced by continued negotiation / counter-terms |
| A-12 Multiple admin users at launch | Client: **one** Admin at launch |
| A-14 Deal statuses including Rejected as primary | Negotiation lifecycle; final states OPEN |
| A-15 Categories as “Oud + String + optional Accessories” | Replaced by confirmed: String instruments + Accessories |
| A-05/A-06 as “fixed wholesale list price / static MOQ fields” | Replaced by qty-variable pricing; propose price or quote; new vs regular MOQ rules |
| A-07 Arabic-only option | Languages confirmed AR + EN |
| A-08 “Syria-only shipping” | Replaced: Syria-first but not Syria-only; destination-dependent methods; costs deferred |

---

## 9. Open / Deferred Client Decisions

> Do not resolve these by assumption.

1. **Exact workflow** for a deal involving a product/opportunity **not currently** in the RARE OUD catalog — including any future Admin-only conversion to a catalog product (not automatic; not designed in Week 1).  
2. Whether trader **negotiation happens fully inside the platform** or transitions to WhatsApp/other communication.  
3. Exact definition/rules for **“new trader” vs “regular trader.”**  
4. Exact **wholesale minimum quantity** rules per product (values).  
5. Exact **shipping method availability** and **shipping/packaging pricing** by destination (Syria and countries outside Syria) — client session pending.  
6. **Final WhatsApp message template**/content.  
7. Any final **negotiation lifecycle / closure states** if needed beyond: propose → review → accept / counter-terms → continue → agree or close.  
8. Whether **customer accounts** exist at all (even optional).  
9. Exact **deal condition field list** appropriate to premium positioning (without becoming a promo engine).  
10. Logo/type asset handoff for brand implementation fidelity.  
11. Whether a **Trader** may also place retail requests as a shopper (**OPEN / NOT LOCKED** — no special Trader retail workflow).

---

## 10. Risks & open flags

| Risk | Severity | Mitigation |
|------|----------|------------|
| Non-catalog deal workflow unclear | High for Week 3 | Keep propose form dual-path; mark ops rules OPEN |
| Negotiation channel (in-app vs WhatsApp) unclear | Medium–High | Wireframes show in-platform response thread + optional WA link; do not lock |
| New vs regular trader undefined | Medium | Gate MOQ logic behind trader classification field TBD |
| Shipping pricing deferred | Medium | Method structure only; no rate engine |
| Temptation to use “Rejected” / marketplace seller language | High | Terminology audit below |
| Flash-sale visual drift | Medium | Brand rules + curated offer language |

---

## 11. Terminology glossary (use consistently)

| Prefer | Avoid |
|--------|--------|
| Catalog product (RARE OUD-owned) | Vendor product / seller listing |
| Commercial deal proposal / negotiation | Seller offer / vendor campaign / rejected deal (as primary model) |
| Counter-terms / RARE OUD response | Hard reject as the default verb |
| Agreed / curated RARE OUD offer | Sold by [trader] / SALE / flash deal |
| Retail request | Paid checkout / payment |
| Auto-prepared WhatsApp message | Customer manually retypes order |
| Wholesale request (propose price or request quote) | Fixed wholesale price list / trader buys from own stock |
| Trader portal | Trader storefront / vendor shop |
| One Admin (launch) | Multi-staff admin management (launch scope) |

---

## Stage 1 summary (revised)

**Confirmed:** Client-owned catalog; categories String instruments + Accessories; traders negotiate deals (catalog or non-catalog opportunity — non-catalog ≠ auto product); wholesale qty + propose price or quote; qty-sensitive pricing; new vs regular MOQ concept without invented values; AR+EN; one Admin; auto WhatsApp prep; Syria-first but not Syria-only shipping with destination-dependent methods and pricing deferred; no payments; no marketplace seller model; premium curated deals.  
**Assumptions retained (limited):** optional accounts; retail status set; flexible deal fields; Arabic default locale.  
**Open/Deferred:** Section 9.  
**Plain-language takeaway:** RARE OUD remains one brand house. Traders bring commercial opportunities and wholesale needs into a negotiation with RARE OUD — they do not run shops inside the site.
