/**
 * Single global currency formatting helper.
 *
 * The CELJOE platform serves Nigeria exclusively.
 * Currency: NGN (₦) — Nigerian Naira.
 *
 * Use this everywhere currency is displayed. No duplication.
 */

const LOCALE = "en-NG";
const CURRENCY_CODE = "NGN";
const CURRENCY = "₦";

/**
 * Format a number as Nigerian Naira.
 *   - 1500 → "₦1,500"
 *   - 0 → "₦0"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options?: { showDecimals?: boolean },
): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return `${CURRENCY}0`;

  if (options?.showDecimals) {
    return n.toLocaleString(LOCALE, {
      style: "currency",
      currency: CURRENCY_CODE,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return n.toLocaleString(LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    maximumFractionDigits: 0,
  });
}

/**
 * Format cents/subunit amount as Naira.
 * Paystack uses kobo; call this to display.
 */
export function fromSubunit(
  subunit: number,
  options?: { showDecimals?: boolean },
): string {
  return formatCurrency(subunit / 100, options);
}

export { CURRENCY, CURRENCY_CODE, LOCALE };
