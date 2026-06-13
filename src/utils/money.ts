/**
 * Money — exact FCFA amounts in bigint (never float).
 * All monetary math in WeDo (fees, escrow, totals) must stay integer.
 */

/** Coerce a DB/JS amount to bigint FCFA. Throws on non-integer input. */
export const toFcfa = (v: bigint | number | string): bigint => {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'string') return BigInt(v);
  if (!Number.isInteger(v)) {
    throw new Error(`Montant non entier (float interdit): ${v}`);
  }
  return BigInt(v);
};

/** Format a bigint FCFA amount with French thousands separators. */
export const formatFcfa = (v: bigint, currency = 'FCFA'): string => {
  const s = (v < 0n ? -v : v).toString();
  const withSep = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${v < 0n ? '-' : ''}${withSep} ${currency}`;
};
