/**
 * Formats a number for currency display using Indian compact notation.
 * Values under ₹1,000 use standard Indian digit grouping (e.g. "500");
 * ₹1,000+ switches to "k" notation, ₹1,00,000+ to lakh ("L"), and
 * ₹1,00,00,000+ to crore ("Cr") — each rounded to 2 decimal places with
 * trailing zeros trimmed (e.g. "12k" not "12.00k", but "14.85k").
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

  const trimmed = (n) => parseFloat(n.toFixed(2)).toString();

  if (abs >= 10000000) {
    return `${sign}${trimmed(abs / 10000000)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}${trimmed(abs / 100000)}L`;
  }
  if (abs >= 1000) {
    return `${sign}${trimmed(abs / 1000)}k`;
  }
  return num.toLocaleString("en-IN");
};
