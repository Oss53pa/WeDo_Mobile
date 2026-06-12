/**
 * Demo dataset
 * Served by the API layer when Supabase isn't configured (IS_SUPABASE_CONFIGURED
 * === false), so the whole app is explorable end-to-end in demo mode.
 */
import {
  Tontine,
  TontineDetail,
  TontineMember,
  TontineCategory,
  TontineType,
  TontineStatus,
  Frequency,
  DistributionOrder,
  MemberRole,
  MemberStatus,
  UserProfile,
  UserStatistics,
  MobileMoneyAccount,
  MobileMoneyOperator,
  ReputationLevel,
  KYCLevel,
  Rating,
  Badge,
  Notification,
  NotificationType,
} from '@types';

export const DEMO_USER_ID = 'demo-user';

const iso = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
};

// ---- People (used as members) ----
interface Person {
  id: string;
  fullName: string;
  reputationScore: number;
  reputationLevel: ReputationLevel;
}
const people: Person[] = [
  {id: DEMO_USER_ID, fullName: 'Awa Traoré', reputationScore: 680, reputationLevel: ReputationLevel.GOLD},
  {id: 'u-kofi', fullName: 'Kofi Mensah', reputationScore: 540, reputationLevel: ReputationLevel.GOLD},
  {id: 'u-fatou', fullName: 'Fatou Ndiaye', reputationScore: 910, reputationLevel: ReputationLevel.PLATINUM},
  {id: 'u-ibrahim', fullName: 'Ibrahim Diallo', reputationScore: 320, reputationLevel: ReputationLevel.SILVER},
  {id: 'u-aicha', fullName: 'Aïcha Camara', reputationScore: 760, reputationLevel: ReputationLevel.PLATINUM},
  {id: 'u-mariam', fullName: 'Mariam Koné', reputationScore: 450, reputationLevel: ReputationLevel.GOLD},
  {id: 'u-sekou', fullName: 'Sékou Touré', reputationScore: 280, reputationLevel: ReputationLevel.SILVER},
  {id: 'u-yaa', fullName: 'Yaa Asantewaa', reputationScore: 1020, reputationLevel: ReputationLevel.DIAMOND},
];

const makeMember = (
  tontineId: string,
  person: Person,
  order: number,
  opts: {role?: MemberRole; received?: boolean; current?: boolean; contributed: number; received_amount?: number; late?: number},
): TontineMember => ({
  id: `${tontineId}-m${order}`,
  tontineId,
  userId: person.id,
  user: {
    id: person.id,
    fullName: person.fullName,
    reputationScore: person.reputationScore,
    reputationLevel: person.reputationLevel as unknown as string,
  },
  role: opts.role ?? MemberRole.MEMBER,
  status: MemberStatus.ACTIVE,
  receptionOrder: order,
  joinedAt: iso(-90 + order),
  totalContributed: opts.contributed,
  totalReceived: opts.received_amount ?? 0,
  latePaymentsCount: opts.late ?? 0,
  isCurrentBeneficiary: !!opts.current,
  hasReceived: !!opts.received,
});

// ---- Tontines ----
const baseTontine = (over: Partial<Tontine> & Pick<Tontine, 'id' | 'name'>): Tontine => ({
  description: '',
  category: TontineCategory.FAMILY,
  type: TontineType.ROSCA,
  creatorId: DEMO_USER_ID,
  contributionAmount: 50000,
  currency: 'XOF',
  frequency: Frequency.MONTHLY,
  totalMembers: 8,
  currentMembers: 8,
  startDate: iso(-120),
  status: TontineStatus.ACTIVE,
  distributionOrder: DistributionOrder.FIXED,
  latePenaltyPercent: 5,
  gracePeriodDays: 3,
  minReputationRequired: 0,
  isPublic: false,
  depositAmount: 0,
  inviteCode: 'WEDODEMO',
  createdAt: iso(-120),
  updatedAt: iso(-2),
  ...over,
});

export const demoTontines: Tontine[] = [
  baseTontine({
    id: 't-famille',
    name: 'Tontine Famille Diallo',
    description: 'Épargne mensuelle de la famille pour les grands projets.',
    category: TontineCategory.FAMILY,
    contributionAmount: 50000,
    frequency: Frequency.MONTHLY,
    totalMembers: 8,
    currentMembers: 8,
    status: TontineStatus.ACTIVE,
  }),
  baseTontine({
    id: 't-amies',
    name: 'Cercle des Amies',
    description: 'Notre tontine hebdomadaire entre copines.',
    category: TontineCategory.FRIENDS,
    contributionAmount: 25000,
    frequency: Frequency.WEEKLY,
    totalMembers: 6,
    currentMembers: 6,
    status: TontineStatus.ACTIVE,
    distributionOrder: DistributionOrder.RANDOM,
  }),
  baseTontine({
    id: 't-marche',
    name: 'Coopérative du Marché',
    description: 'Tontine des commerçantes du grand marché. Places disponibles !',
    category: TontineCategory.COMMUNITY,
    contributionAmount: 100000,
    frequency: Frequency.MONTHLY,
    totalMembers: 12,
    currentMembers: 7,
    status: TontineStatus.OPEN,
    isPublic: true,
    distributionOrder: DistributionOrder.VOTE,
    creatorId: 'u-fatou',
  }),
  baseTontine({
    id: 't-bureau',
    name: 'Tontine Bureau 2025',
    description: 'Tontine annuelle entre collègues — clôturée.',
    category: TontineCategory.PROFESSIONAL,
    contributionAmount: 75000,
    frequency: Frequency.MONTHLY,
    totalMembers: 10,
    currentMembers: 10,
    status: TontineStatus.COMPLETED,
  }),
];

export const demoPublicTontines: Tontine[] = [
  demoTontines[2],
  baseTontine({
    id: 't-jeunes',
    name: 'Tontine des Jeunes Entrepreneurs',
    description: 'Pour financer vos projets. Réputation 300+ requise.',
    category: TontineCategory.PROFESSIONAL,
    contributionAmount: 150000,
    frequency: Frequency.MONTHLY,
    totalMembers: 10,
    currentMembers: 6,
    status: TontineStatus.OPEN,
    isPublic: true,
    minReputationRequired: 300,
    creatorId: 'u-yaa',
  }),
  baseTontine({
    id: 't-quartier',
    name: 'Solidarité du Quartier',
    description: 'Entraide communautaire, petite cotisation.',
    category: TontineCategory.COMMUNITY,
    contributionAmount: 10000,
    frequency: Frequency.WEEKLY,
    totalMembers: 20,
    currentMembers: 14,
    status: TontineStatus.OPEN,
    isPublic: true,
    creatorId: 'u-sekou',
  }),
];

// ---- Tontine details (members + rounds) ----
const familyMembers = (): TontineMember[] => {
  const amount = 50000;
  const order = [
    {p: people[1], role: MemberRole.MEMBER},
    {p: people[2], role: MemberRole.TREASURER},
    {p: people[3], role: MemberRole.MEMBER},
    {p: people[4], role: MemberRole.MEMBER},
    {p: people[0], role: MemberRole.ADMIN},
    {p: people[5], role: MemberRole.MEMBER},
    {p: people[6], role: MemberRole.SECRETARY},
    {p: people[7], role: MemberRole.MEMBER},
  ];
  const currentRound = 4;
  return order.map((o, i) => {
    const pos = i + 1;
    const received = pos < currentRound;
    const current = pos === currentRound;
    return makeMember('t-famille', o.p, pos, {
      role: o.role,
      received,
      current,
      contributed: currentRound * amount,
      received_amount: received ? o.p && o.p.id ? 8 * amount : 0 : 0,
      late: pos === 4 ? 1 : 0,
    });
  });
};

export const demoTontineDetails: Record<string, TontineDetail> = {
  't-famille': {
    ...demoTontines[0],
    members: familyMembers(),
    currentRound: 4,
    totalRounds: 8,
    currentBalance: 8 * 50000,
    nextBeneficiary: familyMembers().find(m => m.isCurrentBeneficiary),
    nextDistributionDate: iso(6),
  },
  't-amies': {
    ...demoTontines[1],
    members: people.slice(0, 6).map((p, i) =>
      makeMember('t-amies', p, i + 1, {
        received: i < 2,
        current: i === 2,
        contributed: 3 * 25000,
        received_amount: i < 2 ? 6 * 25000 : 0,
      }),
    ),
    currentRound: 3,
    totalRounds: 6,
    currentBalance: 6 * 25000,
    nextBeneficiary: undefined,
    nextDistributionDate: iso(3),
  },
  't-marche': {
    ...demoTontines[2],
    members: people.slice(1, 8).map((p, i) =>
      makeMember('t-marche', p, i + 1, {contributed: 0, role: i === 0 ? MemberRole.ADMIN : MemberRole.MEMBER}),
    ),
    currentRound: 0,
    totalRounds: 12,
    currentBalance: 0,
  },
  't-bureau': {
    ...demoTontines[3],
    members: people.map((p, i) =>
      makeMember('t-bureau', p, i + 1, {received: true, contributed: 10 * 75000, received_amount: 10 * 75000}),
    ),
    currentRound: 10,
    totalRounds: 10,
    currentBalance: 0,
  },
};

// ---- Profile / stats / accounts ----
export const demoStatistics: UserStatistics = {
  tontinesCompleted: 2,
  activeTontines: 3,
  totalContributed: 450000,
  totalReceived: 300000,
  onTimePaymentRate: 96,
  latePaymentsCount: 1,
  memberSince: iso(-400),
};

export const demoMobileMoneyAccounts: MobileMoneyAccount[] = [
  {
    id: 'mm-1',
    userId: DEMO_USER_ID,
    operator: MobileMoneyOperator.ORANGE_MONEY,
    provider: 'Orange Money',
    accountNumber: '+225 07 12 34 56 78',
    phoneNumber: '+225 07 12 34 56 78',
    accountName: 'Awa Traoré',
    isDefault: true,
    isVerified: true,
    createdAt: iso(-300),
  },
  {
    id: 'mm-2',
    userId: DEMO_USER_ID,
    operator: MobileMoneyOperator.WAVE,
    provider: 'Wave',
    accountNumber: '+225 05 98 76 54 32',
    phoneNumber: '+225 05 98 76 54 32',
    accountName: 'Awa Traoré',
    isDefault: false,
    isVerified: false,
    createdAt: iso(-120),
  },
];

const demoRatings: Rating[] = [
  {
    id: 'r-1',
    tontineId: 't-bureau',
    raterId: 'u-fatou',
    ratedId: DEMO_USER_ID,
    rating: 5,
    punctualityScore: 5,
    communicationScore: 5,
    reliabilityScore: 5,
    comment: 'Toujours à l’heure et de bon conseil. Une vraie référence !',
    createdAt: iso(-30),
  },
  {
    id: 'r-2',
    tontineId: 't-famille',
    raterId: 'u-yaa',
    ratedId: DEMO_USER_ID,
    rating: 4,
    punctualityScore: 4,
    communicationScore: 5,
    reliabilityScore: 4,
    comment: 'Très fiable, communication parfaite.',
    createdAt: iso(-12),
  },
];

const demoBadges: Badge[] = [
  {id: 'b-1', name: 'Ponctuelle', description: '12 paiements à temps consécutifs', iconUrl: '', earnedAt: iso(-60)},
  {id: 'b-2', name: 'Pilier', description: 'Membre de 3+ tontines actives', iconUrl: '', earnedAt: iso(-45)},
  {id: 'b-3', name: 'Marraine', description: 'A invité 5 nouveaux membres', iconUrl: '', earnedAt: iso(-20)},
];

export const demoProfile: UserProfile = {
  id: DEMO_USER_ID,
  phoneNumber: '+225 07 00 00 00',
  fullName: 'Awa Traoré',
  email: 'awa@wedo.app',
  reputationScore: 680,
  reputationLevel: ReputationLevel.GOLD,
  kycLevel: KYCLevel.LEVEL_1,
  isVerified: true,
  verified: true,
  city: 'Abidjan',
  region: "Côte d'Ivoire",
  preferredCurrency: 'XOF',
  language: 'fr',
  totalContributed: 450000,
  totalReceived: 300000,
  activeTontines: 3,
  completedTontines: 2,
  punctualityRate: 96,
  totalContributions: 24,
  createdAt: iso(-400),
  updatedAt: iso(-1),
  statistics: demoStatistics,
  mobileMoneyAccounts: demoMobileMoneyAccounts,
  ratings: demoRatings,
  badges: demoBadges,
};

// ---- Notifications ----
export const demoNotifications: Notification[] = [
  {
    id: 'n-1',
    userId: DEMO_USER_ID,
    title: 'Cotisation à venir',
    body: 'Votre cotisation de 50 000 FCFA pour « Tontine Famille Diallo » est due dans 3 jours.',
    type: NotificationType.PAYMENT_DUE,
    relatedId: 't-famille',
    isRead: false,
    sentAt: iso(0),
  },
  {
    id: 'n-2',
    userId: DEMO_USER_ID,
    title: 'Nouveau membre',
    body: 'Mariam Koné a rejoint « Cercle des Amies ».',
    type: NotificationType.MEMBER_JOINED,
    relatedId: 't-amies',
    isRead: false,
    sentAt: iso(-1),
  },
  {
    id: 'n-3',
    userId: DEMO_USER_ID,
    title: 'Distribution reçue',
    body: 'Vous avez reçu 600 000 FCFA de « Tontine Bureau 2025 ». Félicitations !',
    type: NotificationType.DISTRIBUTION_RECEIVED,
    relatedId: 't-bureau',
    isRead: true,
    sentAt: iso(-5),
    readAt: iso(-5),
  },
  {
    id: 'n-4',
    userId: DEMO_USER_ID,
    title: 'Réputation en hausse',
    body: 'Votre score a augmenté de +15 points grâce à vos paiements ponctuels.',
    type: NotificationType.REPUTATION_CHANGE,
    isRead: true,
    sentAt: iso(-8),
    readAt: iso(-7),
  },
];

export const demoMemberById = (userId: string): Person | undefined =>
  people.find(p => p.id === userId);

export default {
  demoTontines,
  demoPublicTontines,
  demoTontineDetails,
  demoProfile,
  demoStatistics,
  demoMobileMoneyAccounts,
  demoNotifications,
};
