/**
 * Commercial currencies for catalog / deals / wholesale UI:
 * USD (dollar) and SYP (Syrian pound) only.
 * TEST remains valid for fixtures and regression scripts.
 */
export const PLATFORM_CURRENCY_CODES = ["USD", "SYP"] as const;
export type PlatformCurrencyCode = (typeof PLATFORM_CURRENCY_CODES)[number];

export const TEST_CURRENCY_CODE = "TEST" as const;

export function isPlatformCurrency(value: string): boolean {
  const c = value.trim().toUpperCase();
  return (PLATFORM_CURRENCY_CODES as readonly string[]).includes(c);
}

export function isCurrencyCode(value: string): boolean {
  const c = value.trim().toUpperCase();
  return isPlatformCurrency(c) || c === TEST_CURRENCY_CODE;
}

/** Normalize to a platform currency for selects; unknown → USD. */
export function coercePlatformCurrency(
  value: string | null | undefined
): PlatformCurrencyCode {
  const c = (value ?? "").trim().toUpperCase();
  if ((PLATFORM_CURRENCY_CODES as readonly string[]).includes(c)) {
    return c as PlatformCurrencyCode;
  }
  return "USD";
}
