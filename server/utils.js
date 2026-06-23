/**
 * Shared utility functions for Spread Sniper API
 */

/**
 * Compute 21-day annualized realized volatility from price array.
 * Expects prices in chronological order (oldest first).
 *
 * @param {number[]} prices - Array of closing prices (at least 22 for 21 returns)
 * @returns {number|null} - Annualized RV as percentage, or null if insufficient data
 */
export function computeRealizedVol(prices) {
  if (!prices || prices.length < 2) {
    return null;
  }

  // Compute log returns
  const logReturns = [];
  for (let i = 1; i < prices.length; i++) {
    logReturns.push(Math.log(prices[i] / prices[i - 1]));
  }

  // Compute variance (population variance)
  const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
  const variance = logReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / logReturns.length;

  // Annualize: sqrt(variance) * sqrt(252) * 100 for percentage
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

/**
 * Compute IV-RV spread (implied volatility minus realized volatility).
 *
 * @param {number} iv - Implied volatility (e.g., VIX value)
 * @param {number[]} prices - Array of closing prices in chronological order
 * @returns {{ rv: number|null, ivRvSpread: number|null }} - RV and spread in percentage points
 */
export function computeIvRvSpread(iv, prices) {
  if (iv === null || iv === undefined) {
    return { rv: null, ivRvSpread: null };
  }

  const rv = computeRealizedVol(prices);
  if (rv === null) {
    return { rv: null, ivRvSpread: null };
  }

  return {
    rv,
    ivRvSpread: iv - rv,
  };
}
