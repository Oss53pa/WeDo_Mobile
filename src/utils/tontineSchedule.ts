/**
 * Tontine schedule projection — answers "qui touche quoi, et quand".
 *
 * Works BEFORE activation (projection from members + têtes + K + start + fréquence)
 * and after (same math, consistent with wedo.activer_cycle's rotation). Drives the
 * calendar / Gantt / Kanban views and the "prochain bénéficiaire".
 */
import type {Frequency} from '@types';

export interface ScheduleMemberInput {
  userId: string;
  name: string;
  receptionOrder?: number | null;
  nbTetes?: number | null;
}

export interface ScheduleBeneficiary {
  userId: string;
  name: string;
  tetes: number;
  amount: number; // approx payout for this member this round (FCFA)
}

export interface ScheduleRound {
  round: number;
  date: Date | null;
  beneficiaries: ScheduleBeneficiary[];
  pot: number; // total collected that round
  status: 'past' | 'current' | 'upcoming';
}

const addInterval = (start: Date, freq: Frequency, n: number): Date => {
  const d = new Date(start.getTime());
  switch (freq) {
    case 'Daily': d.setDate(d.getDate() + n); break;
    case 'Weekly': d.setDate(d.getDate() + 7 * n); break;
    case 'BiWeekly': d.setDate(d.getDate() + 14 * n); break;
    case 'Monthly': default: d.setMonth(d.getMonth() + n); break;
  }
  return d;
};

/** Date of a given round (round 1 = start date). */
export const roundDate = (
  startDate: string | null | undefined,
  freq: Frequency,
  round: number,
): Date | null => {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return null;
  return addInterval(start, freq, round - 1);
};

/**
 * Build the full schedule. Members are expanded into têtes, ordered by
 * receptionOrder (then input order), and packed K (beneficiairesParTour) per round.
 */
export const buildSchedule = (
  opts: {
    members: ScheduleMemberInput[];
    contributionAmount: number;
    frequency: Frequency;
    startDate?: string | null;
    beneficiairesParTour?: number | null;
    currentRound?: number | null;
    status?: string;
  },
): ScheduleRound[] => {
  const K = Math.max(1, opts.beneficiairesParTour ?? 1);
  const cotisation = Math.max(0, opts.contributionAmount ?? 0);

  // Ordered list of "têtes" (one entry per share), in reception order.
  const ordered = [...opts.members]
    .map((m, i) => ({...m, _i: i, tetes: Math.max(1, m.nbTetes ?? 1)}))
    .sort((a, b) => {
      const ra = a.receptionOrder ?? Number.MAX_SAFE_INTEGER;
      const rb = b.receptionOrder ?? Number.MAX_SAFE_INTEGER;
      return ra !== rb ? ra - rb : a._i - b._i;
    });

  const tetes: ScheduleMemberInput[] = [];
  ordered.forEach(m => {
    for (let t = 0; t < (m as any).tetes; t++) tetes.push(m);
  });

  const totalTetes = tetes.length;
  if (totalTetes === 0) return [];
  const pot = totalTetes * cotisation; // everyone's têtes contribute each round
  const perTete = K > 0 ? Math.floor(pot / K) : pot;
  const rounds = Math.ceil(totalTetes / K);
  const cur = opts.currentRound ?? 0;
  const completed = opts.status === 'Completed';

  const out: ScheduleRound[] = [];
  for (let r = 1; r <= rounds; r++) {
    const slice = tetes.slice((r - 1) * K, r * K);
    // group by member
    const byMember = new Map<string, ScheduleBeneficiary>();
    slice.forEach(m => {
      const ex = byMember.get(m.userId);
      if (ex) ex.tetes += 1;
      else byMember.set(m.userId, {userId: m.userId, name: m.name, tetes: 1, amount: 0});
    });
    const beneficiaries = [...byMember.values()].map(b => ({...b, amount: b.tetes * perTete}));
    const status: ScheduleRound['status'] =
      completed || (cur > 0 && r < cur) ? 'past' : cur > 0 && r === cur ? 'current' : 'upcoming';
    out.push({round: r, date: roundDate(opts.startDate, opts.frequency, r), beneficiaries, pot, status});
  }
  return out;
};

/** The next beneficiaries (current round, else first upcoming). */
export const nextBeneficiaries = (schedule: ScheduleRound[]): ScheduleRound | null =>
  schedule.find(r => r.status === 'current') ??
  schedule.find(r => r.status === 'upcoming') ??
  null;
