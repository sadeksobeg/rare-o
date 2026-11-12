/**
 * ISO 3166-1 alpha-2 codes (officially assigned). Names are NOT stored here:
 * the importer derives Arabic/English names from the runtime's CLDR data
 * (Intl.DisplayNames), and the admin can edit them afterwards.
 */
export const ISO_COUNTRY_CODES: string[] = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
  "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT " +
  "MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW " +
  "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ " +
  "UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW"
).split(" ");

const REGIONS: Record<string, string[]> = {
  syria: ["SY"],
  levant: ["LB", "JO", "IQ", "PS", "TR", "CY", "IL"],
  gulf: ["SA", "AE", "KW", "QA", "BH", "OM", "YE"],
  north_africa: ["EG", "LY", "TN", "DZ", "MA", "SD", "MR"],
  europe: (
    "AD AL AT AX BA BE BG BY CH CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT " +
    "NL NO PL PT RO RS RU SE SI SJ SK SM UA VA"
  ).split(" "),
  north_america: ["US", "CA", "MX"],
  asia: (
    "AF AM AZ BD BN BT CN GE HK ID IN IR JP KG KH KP KR KZ LA LK MM MN MO MV MY NP PH PK SG TH TJ TL TM TW UZ VN"
  ).split(" "),
};

const REGION_BY_CODE = new Map<string, string>();
for (const [region, codes] of Object.entries(REGIONS)) {
  for (const code of codes) REGION_BY_CODE.set(code, region);
}

export function regionForCountry(code: string): string {
  return REGION_BY_CODE.get(code.toUpperCase()) ?? "other";
}

export const REGION_ORDER = [
  "syria",
  "levant",
  "gulf",
  "north_africa",
  "europe",
  "north_america",
  "asia",
  "other",
] as const;
