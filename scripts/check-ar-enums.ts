/**
 * Fails if Arabic dictionary values for known event/action/mode keys
 * still look like raw Latin enum tokens (snake_case / Mode:).
 */
import { getDictionary } from "../lib/i18n/dictionaries";

const LATIN_ENUM = /^(?:[a-z]+_)+[a-z]+$|^Mode:\s*[a-z_]+$/i;

const ar = getDictionary("ar");
const samples: Array<{ path: string; value: string }> = [];

for (const [k, v] of Object.entries(ar.adminUi.detail.retailEvent)) {
  samples.push({ path: `adminUi.detail.retailEvent.${k}`, value: v });
}
for (const [k, v] of Object.entries(ar.trader.dealAction)) {
  samples.push({ path: `trader.dealAction.${k}`, value: v });
}
for (const [k, v] of Object.entries(ar.trader.wholesaleEvent)) {
  samples.push({ path: `trader.wholesaleEvent.${k}`, value: v });
}
for (const [k, v] of Object.entries(ar.trader.requestMode ?? {})) {
  samples.push({ path: `trader.requestMode.${k}`, value: v });
}
for (const [k, v] of Object.entries(ar.adminUi.status.retail)) {
  samples.push({ path: `adminUi.status.retail.${k}`, value: v });
}
for (const [k, v] of Object.entries(ar.adminUi.status.deal)) {
  samples.push({ path: `adminUi.status.deal.${k}`, value: v });
}

const leaks = samples.filter(
  (s) => LATIN_ENUM.test(s.value.trim()) || s.value.trim() === s.path.split(".").pop()
);

if (leaks.length > 0) {
  console.error("Arabic UI enum leaks:");
  for (const l of leaks) console.error(`  ${l.path} = ${JSON.stringify(l.value)}`);
  process.exit(1);
}

console.log(`check-ar-enums: ok (${samples.length} labels)`);
