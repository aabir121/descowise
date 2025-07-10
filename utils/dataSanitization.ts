// Data sanitization and formatting utilities for DESCO service

export const formatDate = (date: Date): string => date.toISOString().split('T')[0];

export const formatMonth = (date: Date): string => date.toISOString().substring(0, 7);

export const sanitizeCurrency = (value: any): number => {
    if (value === null || value === undefined || isNaN(Number(value))) return 0.00;
    return parseFloat(Number(value).toFixed(2));
}; 