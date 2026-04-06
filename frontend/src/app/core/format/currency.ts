/** Tunisian dinar — storefront, cart, admin, PDFs (backend uses matching format). */
export const APP_CURRENCY_CODE = 'TND';
export const APP_CURRENCY_LOCALE = 'fr-TN';

const formatter = new Intl.NumberFormat(APP_CURRENCY_LOCALE, {
  style: 'currency',
  currency: APP_CURRENCY_CODE,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return formatter.format(amount);
}
