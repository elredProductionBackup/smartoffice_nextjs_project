/**
 * Formats a number for currency display using Indian compact notation.
 * Values under ₹1,00,000 use standard Indian digit grouping (e.g. "12,000");
 * ₹1,00,000+ switches to lakh notation (e.g. "6.20L") and ₹1,00,00,000+
 * switches to crore notation (e.g. "1.00Cr"), both to 2 decimal places.
 *
 * Does not include the ₹ symbol — callers prepend it.
 *
 * @param {number} value
 * @returns {string}
 */
export const formatCompactAmount = (value) => {
  const num = Number(value) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (abs >= 10000000) {
    return `${sign}${(abs / 10000000).toFixed(2)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}${(abs / 100000).toFixed(2)}L`;
  }
  return num.toLocaleString("en-IN");
};
