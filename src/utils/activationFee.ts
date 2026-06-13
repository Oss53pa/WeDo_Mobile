/**
 * Activation fee — paid once at cycle launch, equal for every member
 * (organizer included). Mirrors the authoritative wedo.activer_cycle SQL.
 *
 *   MTS          = cotisation × nbParticipants × nbTours
 *   fraisTotal   = tauxBps × MTS / 10000          (integer division)
 *   base         = fraisTotal / nbParticipants
 *   reste        = fraisTotal - base × nbParticipants    (0 .. N-1)
 *   per member   = base, with +1 FCFA for the first `reste` members
 *
 * Invariant: Σ perMember === fraisTotal (exact, no float).
 */
import {toFcfa} from './money';

export const DEFAULT_TAUX_SERVICE_BPS = 80; // 0,80 %

export interface ActivationFee {
  mts: bigint;
  fraisTotal: bigint;
  base: bigint;
  reste: bigint;
  /** length = nbParticipants; sums to fraisTotal; max−min ≤ 1 */
  perMember: bigint[];
}

export const computeActivationFee = (
  cotisation: bigint | number,
  nbParticipants: number,
  nbTours: number,
  tauxBps: number = DEFAULT_TAUX_SERVICE_BPS,
): ActivationFee => {
  const n = BigInt(Math.max(0, Math.trunc(nbParticipants)));
  if (n <= 0n) {
    return {mts: 0n, fraisTotal: 0n, base: 0n, reste: 0n, perMember: []};
  }
  const cot = toFcfa(cotisation);
  const tours = BigInt(Math.max(0, Math.trunc(nbTours)));
  const taux = BigInt(Math.max(0, Math.trunc(tauxBps)));

  const mts = cot * n * tours;
  const fraisTotal = (mts * taux) / 10000n;
  const base = fraisTotal / n;
  const reste = fraisTotal - base * n;

  const perMember = Array.from({length: Number(n)}, (_, i) =>
    base + (BigInt(i) < reste ? 1n : 0n),
  );
  return {mts, fraisTotal, base, reste, perMember};
};
