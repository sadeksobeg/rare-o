/**
 * Currency is commercially OPEN.
 * Store codes as strings; never assume USD/SYP as business default.
 * Dev/seed fixtures may use an explicitly labelled test currency.
 */
export const TEST_CURRENCY_CODE = "TEST" as const;

export function isCurrencyCode(value: string): boolean {
  return /^[A-Z]{3,8}$/.test(value.trim());
}
