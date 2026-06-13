import {ambassadorReward} from '../money';

describe('ambassadorReward (bigint, 10%, demi vers le haut)', () => {
  it('exemples du brief', () => {
    expect(ambassadorReward(50000n)).toBe(5000n);
    expect(ambassadorReward(40000n)).toBe(4000n);
    expect(ambassadorReward(33333n)).toBe(3333n); // 3333,3 -> 3333
  });

  it('cas limites', () => {
    expect(ambassadorReward(0n)).toBe(0n);
    expect(ambassadorReward(5n)).toBe(1n);        // 0,5 -> 1 (demi vers le haut)
    expect(ambassadorReward(999999999999n)).toBe(100000000000n);
  });

  it('taux configurable (jamais en dur)', () => {
    expect(ambassadorReward(50000n, 15n)).toBe(7500n);
    expect(ambassadorReward(10000n, 0n)).toBe(0n);
  });

  it('refuse les valeurs négatives', () => {
    expect(() => ambassadorReward(-1n)).toThrow();
    expect(() => ambassadorReward(100n, -1n)).toThrow();
  });
});
