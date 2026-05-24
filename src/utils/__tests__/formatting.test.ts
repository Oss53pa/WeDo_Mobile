import {
  formatNumber,
  formatFrequency,
  formatPercentage,
  truncateText,
  capitalize,
  formatPhoneNumber,
  formatCurrency,
} from '../formatting';

describe('formatNumber', () => {
  it('abbreviates thousands, millions and billions', () => {
    expect(formatNumber(500)).toBe('500');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(2_000_000)).toBe('2.0M');
    expect(formatNumber(3_200_000_000)).toBe('3.2B');
  });
});

describe('formatFrequency', () => {
  it('maps known frequencies to French labels', () => {
    expect(formatFrequency('Daily')).toBe('Quotidien');
    expect(formatFrequency('Weekly')).toBe('Hebdomadaire');
    expect(formatFrequency('BiWeekly')).toBe('Bimensuel');
    expect(formatFrequency('Monthly')).toBe('Mensuel');
  });

  it('returns the input for unknown frequencies', () => {
    expect(formatFrequency('Yearly')).toBe('Yearly');
  });
});

describe('formatPercentage', () => {
  it('formats with the given decimals', () => {
    expect(formatPercentage(96)).toBe('96%');
    expect(formatPercentage(33.333, 1)).toBe('33.3%');
  });
});

describe('truncateText', () => {
  it('truncates only when longer than max length', () => {
    expect(truncateText('hello', 10)).toBe('hello');
    expect(truncateText('hello world', 5)).toBe('hello...');
  });
});

describe('capitalize', () => {
  it('capitalizes the first letter and lowercases the rest', () => {
    expect(capitalize('bONJOUR')).toBe('Bonjour');
    expect(capitalize('')).toBe('');
  });
});

describe('formatPhoneNumber', () => {
  it('groups a long number with a country prefix', () => {
    expect(formatPhoneNumber('+2250712345678')).toBe('+225 07 12 34 56 78');
  });

  it('returns short inputs unchanged', () => {
    expect(formatPhoneNumber('123')).toBe('123');
  });
});

describe('formatCurrency', () => {
  it('includes the grouped amount', () => {
    const out = formatCurrency(450000, 'XOF');
    expect(out.replace(/\s| | /g, '')).toContain('450000');
  });

  it('falls back gracefully for FCFA alias', () => {
    expect(typeof formatCurrency(1000, 'FCFA')).toBe('string');
  });
});
