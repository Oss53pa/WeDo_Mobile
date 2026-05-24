/**
 * Formatting Utilities
 * Helper functions for formatting data (numbers, dates, phone numbers, etc.)
 */

import {format, parseISO, formatDistanceToNow} from 'date-fns';
import {fr} from 'date-fns/locale';

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency: string = 'XOF'): string => {
  // Map FCFA to valid ISO code XOF
  const currencyCode = currency === 'FCFA' ? 'XOF' : currency;

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    // Fallback for invalid currency codes
    return `${amount.toLocaleString('fr-FR')} ${currency}`;
  }
};

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as +XXX XX XX XX XX XX
  if (cleaned.length >= 10) {
    const country = cleaned.substring(0, 3);
    const part1 = cleaned.substring(3, 5);
    const part2 = cleaned.substring(5, 7);
    const part3 = cleaned.substring(7, 9);
    const part4 = cleaned.substring(9, 11);
    const part5 = cleaned.substring(11);

    return `+${country} ${part1} ${part2} ${part3} ${part4}${part5 ? ' ' + part5 : ''}`.trim();
  }

  return phone;
};

/**
 * Format date
 */
export const formatDate = (date: string | Date, formatString: string = 'dd/MM/yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString, {locale: fr});
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date with time
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Format relative time (e.g., "il y a 2 heures")
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, {addSuffix: true, locale: fr});
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format tontine frequency
 */
export const formatFrequency = (frequency: string): string => {
  const frequencies: {[key: string]: string} = {
    Daily: 'Quotidien',
    Weekly: 'Hebdomadaire',
    BiWeekly: 'Bimensuel',
    Monthly: 'Mensuel',
  };
  return frequencies[frequency] || frequency;
};

export default {
  formatCurrency,
  formatNumber,
  formatPhoneNumber,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatPercentage,
  truncateText,
  capitalize,
  formatFrequency,
};
