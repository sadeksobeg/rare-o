/**
 * Regression checks for lib/shipping/rates.ts against the owner-supplied
 * rate sheet (2026-11-06). No DB, no network.
 */
import assert from "node:assert/strict";
import {
  calculateOudShipmentWeightKg,
  findZoneByCountryCode,
  listDomesticCarriersFor,
  quoteDomesticShipping,
  quoteInternationalShipping,
} from "../lib/shipping/rates";

function main() {
  // --- oud shipment weight: paired boxing (every 2 ouds share a 25kg box) ---
  assert.equal(calculateOudShipmentWeightKg(1), 20, "1 oud = 20kg");
  assert.equal(calculateOudShipmentWeightKg(2), 25, "2 ouds = 25kg");
  assert.equal(calculateOudShipmentWeightKg(3), 45, "3 ouds = 25+20=45kg");
  assert.equal(calculateOudShipmentWeightKg(4), 50, "4 ouds = 25+25=50kg");
  assert.equal(calculateOudShipmentWeightKg(5), 70, "5 ouds = 25+25+20=70kg");
  assert.equal(calculateOudShipmentWeightKg(0), 0, "0 ouds = 0kg");

  // --- zone lookup ---
  assert.equal(findZoneByCountryCode("DE")?.id, "germany");
  assert.equal(findZoneByCountryCode("nl")?.id, "germany", "case-insensitive");
  assert.equal(findZoneByCountryCode("FR")?.id, "austria");
  assert.equal(findZoneByCountryCode("GB")?.id, "britain");
  assert.equal(findZoneByCountryCode("CH")?.id, "norway");
  assert.equal(findZoneByCountryCode("US")?.id, "america");
  assert.equal(findZoneByCountryCode("AE")?.id, "uae");
  assert.equal(findZoneByCountryCode("XX"), null, "unknown country");

  // --- Germany: tiered by weight, land + air ---
  let q = quoteInternationalShipping("germany", "land", 20); // 1 oud, boundary
  assert.ok(q);
  assert.equal(q!.currency, "USD");
  assert.equal(q!.amount, 20 * 6.5, "Germany land 11-20kg tier: $6.5/kg");
  assert.equal(q!.alternate?.currency, "EUR");
  assert.equal(q!.alternate?.amount, 20 * 5.5);

  q = quoteInternationalShipping("germany", "land", 25); // 2 ouds, next tier
  assert.equal(q!.amount, 25 * 5.5, "Germany land 21+kg tier: $5.5/kg");
  assert.equal(q!.alternate?.amount, 25 * 5);

  q = quoteInternationalShipping("germany", "air", 20);
  assert.equal(q!.amount, 20 * 7.5, "Germany air 11-20kg: $7.5/kg");
  q = quoteInternationalShipping("germany", "air", 30); // 3 ouds
  assert.equal(q!.amount, 30 * 7, "Germany air 21+kg: $7/kg");

  // --- flat-rate zones (no tiers) ---
  q = quoteInternationalShipping("austria", "land", 20);
  assert.equal(q!.amount, 20 * 6.25);
  assert.equal(q!.alternate?.amount, 20 * 5.5);
  q = quoteInternationalShipping("austria", "air", 25);
  assert.equal(q!.amount, 25 * 9);

  q = quoteInternationalShipping("sweden", "land", 20);
  assert.equal(q!.amount, 20 * 7);
  q = quoteInternationalShipping("sweden", "air", 20);
  assert.equal(q!.amount, 20 * 9.5);

  q = quoteInternationalShipping("britain", "land", 20);
  assert.equal(q!.amount, 20 * 7.5);
  q = quoteInternationalShipping("britain", "air", 20);
  assert.equal(q!.amount, 20 * 10.5);

  q = quoteInternationalShipping("norway", "land", 20);
  assert.equal(q!.amount, 20 * 8);
  q = quoteInternationalShipping("norway", "air", 20);
  assert.equal(q!.amount, 20 * 11);

  q = quoteInternationalShipping("america", "land", 20);
  assert.equal(q!.amount, 20 * 11);
  q = quoteInternationalShipping("america", "air", 20);
  assert.equal(q!.amount, 20 * 19);

  // --- UAE/Oman/Iraq: air only, destination-currency primary ---
  q = quoteInternationalShipping("uae", "air", 20);
  assert.ok(q);
  assert.equal(q!.currency, "AED", "UAE has no USD leg — AED is primary");
  assert.equal(q!.amount, 20 * 7.5);
  assert.equal(q!.alternate, null, "SYP leg intentionally not modeled");

  q = quoteInternationalShipping("oman", "air", 20);
  assert.equal(q!.currency, "USD");
  assert.equal(q!.amount, 20 * 3);

  q = quoteInternationalShipping("iraq", "air", 20);
  assert.equal(q!.currency, "USD");
  assert.equal(q!.amount, 20 * 3);

  // UAE/Oman/Iraq have no land leg
  assert.equal(quoteInternationalShipping("uae", "land", 20), null);

  // unknown zone / zero weight
  assert.equal(quoteInternationalShipping("mars", "air", 20), null);
  assert.equal(quoteInternationalShipping("germany", "air", 0), null);

  // --- domestic Syria network ---
  const damascus = listDomesticCarriersFor("damascus").map((c) => c.carrierId);
  assert.deepEqual(damascus, ["bus", "babel"], "Damascus: bus + Babel, cheapest first");
  assert.equal(quoteDomesticShipping("damascus", "bus"), 2);
  assert.equal(quoteDomesticShipping("damascus", "babel"), 10);
  assert.equal(quoteDomesticShipping("damascus", "al-mufti"), null, "Al-Mufti not in Damascus");

  const raqqa = listDomesticCarriersFor("raqqa").map((c) => c.carrierId);
  assert.deepEqual(raqqa, ["bus"], "Raqqa: bus only — Babel excludes it");

  const idlib = listDomesticCarriersFor("idlib").map((c) => c.carrierId);
  assert.deepEqual(idlib, ["bus"], "Idlib: bus only — Babel excludes it");

  const daraa = listDomesticCarriersFor("daraa").map((c) => c.carrierId);
  assert.deepEqual(
    daraa,
    ["al-mufti", "babel"],
    "Daraa: both Al-Mufti ($5) and Babel ($10), cheapest first"
  );
  assert.equal(quoteDomesticShipping("daraa", "al-mufti"), 5);
  assert.equal(quoteDomesticShipping("daraa", "babel"), 10);
  assert.equal(quoteDomesticShipping("daraa", "bus"), null, "Daraa not in the bus list");

  const suwayda = listDomesticCarriersFor("suwayda").map((c) => c.carrierId);
  assert.deepEqual(suwayda, ["al-mufti"], "Suwayda: Al-Mufti only");
  assert.equal(quoteDomesticShipping("suwayda", "babel"), null);

  assert.deepEqual(listDomesticCarriersFor("unknown"), []);

  console.log("PASS: shipping-rates-checks");
}

main();
