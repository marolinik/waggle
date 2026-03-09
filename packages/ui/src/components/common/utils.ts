/**
 * Utility functions for common components.
 */

/**
 * Format a token count for compact display.
 * <1000: raw number, <1M: Xk, >=1M: XM
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) return String(tokens);
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${(tokens / 1000000).toFixed(1)}M`;
}

/**
 * Format a dollar cost for compact display.
 * <$0.01: shows in cents, otherwise $X.XXX
 */
export function formatCost(dollars: number): string {
  if (dollars < 0.01) return `$${(dollars * 100).toFixed(2)}\u00A2`;
  return `$${dollars.toFixed(3)}`;
}
