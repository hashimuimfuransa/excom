/**
 * Currency utilities for formatting prices with proper symbols and localization
 */

const currencySymbols: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  NGN: '₦',
  RWF: 'FRw'
};

const currencyNames: { [key: string]: string } = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  NGN: 'Nigerian Naira',
  RWF: 'Rwandan Franc'
};

/**
 * Get the symbol for a currency code
 * @param currencyCode - The currency code (e.g., 'USD', 'RWF')
 * @returns The currency symbol (e.g., '$', 'FRw')
 */
export function getCurrencySymbol(currencyCode: string): string {
  return currencySymbols[currencyCode] || currencyCode;
}

/**
 * Get the full name for a currency code
 * @param currencyCode - The currency code (e.g., 'USD', 'RWF')
 * @returns The currency name (e.g., 'US Dollar', 'Rwandan Franc')
 */
export function getCurrencyName(currencyCode: string): string {
  return currencyNames[currencyCode] || currencyCode;
}

/**
 * Format price with currency symbol
 * @param price - The price value
 * @param currencyCode - The currency code (e.g., 'USD', 'RWF')
 * @param decimalPlaces - Number of decimal places to show (default: 2)
 * @returns Formatted price string (e.g., '$99.99', 'FRw 50,000')
 */
export function formatPrice(
  price: number,
  currencyCode: string = 'USD',
  decimalPlaces: number = 2
): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = price.toFixed(decimalPlaces);
  
  // For currencies with no decimals like JPY and RWF
  if (currencyCode === 'JPY' || currencyCode === 'RWF') {
    return `${symbol} ${Math.round(price).toLocaleString()}`;
  }
  
  return `${symbol} ${formatted}`;
}

/**
 * Format price for display with full details
 * @param price - The price value
 * @param currencyCode - The currency code (e.g., 'USD', 'RWF')
 * @returns Object with price, symbol, and code
 */
export function formatPriceDetailed(price: number, currencyCode: string = 'USD') {
  return {
    price: price.toFixed(2),
    symbol: getCurrencySymbol(currencyCode),
    code: currencyCode,
    name: getCurrencyName(currencyCode),
    formatted: formatPrice(price, currencyCode)
  };
}

/**
 * Check if a currency requires no decimal places
 * @param currencyCode - The currency code
 * @returns True if the currency has no decimal places
 */
export function hasNoDecimals(currencyCode: string): boolean {
  return currencyCode === 'JPY' || currencyCode === 'RWF';
}