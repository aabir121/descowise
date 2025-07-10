// Data sanitization and formatting utilities for DESCO service

export const formatDate = (date: Date): string => date.toISOString().split('T')[0];

export const formatMonth = (date: Date): string => date.toISOString().substring(0, 7);

export const sanitizeCurrency = (value: any): number => {
    if (value === null || value === undefined || isNaN(Number(value))) return 0.00;
    return parseFloat(Number(value).toFixed(2));
};

export const formatHumanDate = (date: Date): string => {
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  // Get ordinal suffix for the day
  const getOrdinal = (n: number) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  return `${day}${getOrdinal(day)} ${month}, ${year}`;
}; 