/**
 * Format a number with commas for thousands separators
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format currency values with proper commas and dollar sign
 * @param value - The numeric value to format
 * @param showSign - Whether to show +/- sign for positive/negative values
 * @param decimals - Number of decimal places (default 0)
 */
export function formatCurrency(value: number, showSign = false, decimals = 0): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : (showSign && value > 0 ? '+' : '');

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(absValue);

  return `${sign}$${formatted}`;
}

/**
 * Format currency in compact form (M for millions, K for thousands)
 * Used for graphs and tight spaces
 */
export function formatCurrencyCompact(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1000000) {
    return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
  } else if (absValue >= 1000) {
    return `${sign}$${(absValue / 1000).toFixed(0)}K`;
  } else {
    return `${sign}$${absValue.toFixed(0)}`;
  }
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}
