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

/**
 * Ambassador reward = `ratePct` % of the activation fee, rounded to the FCFA,
 * half up. 100 % bigint, no float, never an LLM. The rate is NOT hardcoded:
 * callers pass it from `program_settings` (default 10 % only as a safety net).
 *
 * Half-up with denominator 100: (fee*rate + 50) / 100.
 *   50 000 → 5 000 · 40 000 → 4 000 · 33 333 → 3 333 (3 333,3 → 3 333).
 */
export const ambassadorReward = (
  activationFeeFcfa: bigint,
  ratePct: bigint = 10n,
): bigint => {
  if (activationFeeFcfa < 0n) throw new Error('Frais négatif interdit');
  if (ratePct < 0n) throw new Error('Taux négatif interdit');
  const DEN = 100n;
  return (activationFeeFcfa * ratePct + DEN / 2n) / DEN;
};

/** Format a bigint FCFA amount with French thousands separators. */
export const formatFcfa = (v: bigint, currency = 'FCFA'): string => {
  const s = (v < 0n ? -v : v).toString();
  const withSep = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${v < 0n ? '-' : ''}${withSep} ${currency}`;
};
