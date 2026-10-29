// Per PLAN.md D5: Western digits (0-9) everywhere, in every locale — digits
// in prices, phone numbers, references, and dates are data, not prose, and
// stay legible/sortable/copy-pasteable regardless of UI language. Arabic
// locales (ar-SY, etc.) default to the Arabic-Indic numbering system unless
// the `-u-nu-latn` Unicode extension is appended, so every Intl call in this
// app must go through these helpers rather than calling Intl directly.

const AR_LATN = "ar-SY-u-nu-latn";

export function formatDateAr(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(AR_LATN, options).format(date);
}

export function formatNumberAr(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(AR_LATN, options).format(value);
}

export function formatCurrencyUsd(value: number) {
  return new Intl.NumberFormat(AR_LATN, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
