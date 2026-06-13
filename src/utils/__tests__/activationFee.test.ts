import {computeActivationFee, DEFAULT_TAUX_SERVICE_BPS} from '../activationFee';

const sum = (xs: bigint[]) => xs.reduce((a, b) => a + b, 0n);

describe('computeActivationFee', () => {
  it('matches the brief example (10 000 × 10 × 10 @ 80 bps)', () => {
    const f = computeActivationFee(10000, 10, 10, 80);
    expect(f.mts).toBe(1000000n);
    expect(f.fraisTotal).toBe(8000n);
    expect(f.base).toBe(800n);
    expect(f.reste).toBe(0n);
    expect(f.perMember.every(x => x === 800n)).toBe(true);
  });

  it('keeps Σ perMember === fraisTotal even when not divisible', () => {
    const cases: Array<[number, number, number, number]> = [
      [25000, 4, 8, 80],
      [10000, 7, 7, 80],
      [3333, 9, 11, 80],
      [12345, 13, 13, 95],
      [777, 3, 5, 80],
      [1, 1000, 1, 80],
      [9999991, 17, 23, 137],
    ];
    for (const [cot, n, tours, taux] of cases) {
      const f = computeActivationFee(cot, n, tours, taux);
      expect(f.perMember).toHaveLength(n);
      // Acceptance #1: exact reconciliation
      expect(sum(f.perMember)).toBe(f.fraisTotal);
      // Acceptance #2: max spread between two members is 1 FCFA
      const max = f.perMember.reduce((a, b) => (b > a ? b : a), 0n);
      const min = f.perMember.reduce((a, b) => (b < a ? b : a), f.perMember[0]);
      expect(max - min <= 1n).toBe(true);
    }
  });

  it('uses bigint everywhere (no float artifacts)', () => {
    const f = computeActivationFee(10000, 10, 10);
    expect(typeof f.fraisTotal).toBe('bigint');
    f.perMember.forEach(x => expect(typeof x).toBe('bigint'));
  });

  it('rejects non-integer (float) amounts', () => {
    expect(() => computeActivationFee(1000.5, 3, 3)).toThrow();
  });

  it('defaults to 80 bps', () => {
    expect(DEFAULT_TAUX_SERVICE_BPS).toBe(80);
    const a = computeActivationFee(10000, 5, 5);
    const b = computeActivationFee(10000, 5, 5, 80);
    expect(a.fraisTotal).toBe(b.fraisTotal);
  });

  it('handles zero participants gracefully', () => {
    const f = computeActivationFee(10000, 0, 10);
    expect(f.perMember).toHaveLength(0);
    expect(f.fraisTotal).toBe(0n);
  });
});
