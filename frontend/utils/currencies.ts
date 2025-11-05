/**
 * Available currencies for the excom platform
 */

export const AVAILABLE_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' }
];

export const getCurrencyByCode = (code: string) => {
  return AVAILABLE_CURRENCIES.find(c => c.code === code);
};

export const getCurrencySymbol = (code: string) => {
  const currency = getCurrencyByCode(code);
  return currency ? currency.symbol : code;
};