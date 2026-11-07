/** Prices are shown in UAE dirhams. Material prices are indicative guides, not quotes. */
export const CURRENCY = "AED";

export function formatAED(amount: number): string {
  return `AED ${Math.round(amount).toLocaleString("en-AE")}`;
}
