/** Arabic-aware request count label (طلب واحد / طلباً / طلبات). */
export function formatRequestCountLabel(
  count: number,
  locale: string,
  fallbackPlural: string
): string {
  if (locale !== "ar") {
    if (count === 1) return "1 request";
    return `${count} ${fallbackPlural.toLowerCase().includes("request") ? "requests" : fallbackPlural}`;
  }
  if (count === 0) return "لا طلبات";
  if (count === 1) return "طلب واحد";
  if (count === 2) return "طلبان";
  if (count >= 3 && count <= 10) return `${count} طلبات`;
  return `${count} طلباً`;
}
