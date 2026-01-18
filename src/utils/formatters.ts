/**
 * Data Formatting Utilities
 * Safe formatting functions for common data types
 */

/**
 * Safely format a number to fixed decimal places
 * @param value - Value to format (can be undefined, null, or number)
 * @param decimals - Number of decimal places
 * @param fallback - Fallback string if value is invalid
 */
export const safeToFixed = (
  value: number | undefined | null,
  decimals: number = 2,
  fallback: string = 'N/A'
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  try {
    return parseFloat(value.toString()).toFixed(decimals);
  } catch (e) {
    return fallback;
  }
};

/**
 * Safely format currency
 */
export const safeFormatCurrency = (
  value: number | undefined | null,
  decimals: number = 2,
  currency: string = '₹'
): string => {
  const formatted = safeToFixed(value, decimals);
  return formatted === 'N/A' ? formatted : `${currency}${formatted}`;
};

/**
 * Safely format percentage
 */
export const safeFormatPercent = (
  value: number | undefined | null,
  decimals: number = 1,
): string => {
  const formatted = safeToFixed(value, decimals);
  return formatted === 'N/A' ? formatted : `${formatted}%`;
};

/**
 * Safely calculate total with null checks
 */
export const safeCalculate = (
  amount: number | undefined | null,
  pricePerUnit: number | undefined | null
): number => {
  const amt = typeof amount === 'number' ? amount : 0;
  const price = typeof pricePerUnit === 'number' ? pricePerUnit : 0;
  return amt * price;
};
