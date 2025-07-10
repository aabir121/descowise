// Shared currency formatting utility
export function formatCurrency(value: number | string | null | undefined): string {
  let num = Number(value);
  if (value === null || value === undefined || isNaN(num)) {
    num = 0;
  }
  return `৳${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Sanitize currency value: null/undefined/NaN to 0.00, else to two decimals
export function sanitizeCurrency(value: any): number {
  if (value === null || value === undefined || isNaN(Number(value))) return 0.00;
  return parseFloat(Number(value).toFixed(2));
} 