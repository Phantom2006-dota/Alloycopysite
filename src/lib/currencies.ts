export interface Currency {
  code: string;
  name: string;
  symbol: string;
  country: string;
}

export const FLUTTERWAVE_CURRENCIES: Currency[] = [
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", country: "Nigeria" },
  { code: "USD", name: "US Dollar", symbol: "$", country: "United States" },
  { code: "GBP", name: "British Pound", symbol: "£", country: "United Kingdom" },
  { code: "EUR", name: "Euro", symbol: "€", country: "European Union" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", country: "Ghana" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", country: "Kenya" },
  { code: "ZAR", name: "South African Rand", symbol: "R", country: "South Africa" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", country: "Uganda" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", country: "Tanzania" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw", country: "Rwanda" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", country: "Zambia" },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA", country: "West Africa" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", country: "Central Africa" },
  { code: "MWK", name: "Malawian Kwacha", symbol: "MK", country: "Malawi" },
  { code: "SLL", name: "Sierra Leonean Leone", symbol: "Le", country: "Sierra Leone" },
  { code: "GMD", name: "Gambian Dalasi", symbol: "D", country: "Gambia" },
  { code: "LRD", name: "Liberian Dollar", symbol: "L$", country: "Liberia" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", country: "Canada" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", country: "Australia" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", country: "India" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", country: "United Arab Emirates" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", country: "Saudi Arabia" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", country: "Japan" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", country: "China" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", country: "Brazil" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", country: "Mexico" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", country: "Switzerland" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", country: "Sweden" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", country: "Norway" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", country: "Denmark" },
];

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return FLUTTERWAVE_CURRENCIES.find(c => c.code === code);
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currency = getCurrencyByCode(currencyCode);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
  }).format(amount);
};

export const DEFAULT_CURRENCY = "GBP";
