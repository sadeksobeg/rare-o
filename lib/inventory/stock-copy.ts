/** Client-safe copy for stock errors (no server imports). */
/** Arabic/English sentence for an insufficient-stock error. */
export function stockShortMessage(productName: string, available: number, ar: boolean): string {
  if (ar) {
    return available > 0
      ? `المتوفر من «${productName}» ${available} قطعة فقط. عدّل الكمية للمتابعة.`
      : `«${productName}» نفدت كميته حالياً.`;
  }
  return available > 0
    ? `Only ${available} left of “${productName}”. Adjust the quantity to continue.`
    : `“${productName}” is currently out of stock.`;
}
