import {buildSchedule, roundDate, nextBeneficiaries} from '../tontineSchedule';

const members = [
  {userId: 'A', name: 'Awa', receptionOrder: 1, nbTetes: 2},
  {userId: 'B', name: 'Bori', receptionOrder: 2, nbTetes: 1},
  {userId: 'C', name: 'Coda', receptionOrder: 3, nbTetes: 1},
  {userId: 'D', name: 'Dia', receptionOrder: 4, nbTetes: 2},
];

describe('buildSchedule', () => {
  const sched = buildSchedule({
    members,
    contributionAmount: 10000,
    frequency: 'Monthly',
    startDate: '2026-07-01',
    beneficiairesParTour: 2,
    currentRound: 2,
    status: 'Active',
  });

  it('packs têtes K per round → ceil(Σtêtes/K) rounds', () => {
    expect(sched.length).toBe(3); // 6 têtes / 2
  });

  it('round 1 = A with 2 têtes (full pot), round 2 = B + C sharing', () => {
    expect(sched[0].beneficiaries).toEqual([{userId: 'A', name: 'Awa', tetes: 2, amount: 60000}]);
    expect(sched[1].beneficiaries.map(b => b.userId)).toEqual(['B', 'C']);
    expect(sched[1].beneficiaries[0].amount).toBe(30000);
    expect(sched[2].beneficiaries).toEqual([{userId: 'D', name: 'Dia', tetes: 2, amount: 60000}]);
  });

  it('pot = Σtêtes × cotisation', () => {
    expect(sched[0].pot).toBe(60000);
  });

  it('dates follow the frequency (monthly)', () => {
    expect(sched[0].date?.toISOString().slice(0, 10)).toBe('2026-07-01');
    expect(sched[1].date?.toISOString().slice(0, 10)).toBe('2026-08-01');
    expect(sched[2].date?.toISOString().slice(0, 10)).toBe('2026-09-01');
  });

  it('status reflects currentRound', () => {
    expect(sched.map(r => r.status)).toEqual(['past', 'current', 'upcoming']);
    expect(nextBeneficiaries(sched)?.round).toBe(2);
  });

  it('weekly spacing', () => {
    expect(roundDate('2026-07-01', 'Weekly', 3)?.toISOString().slice(0, 10)).toBe('2026-07-15');
  });
});
