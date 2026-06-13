/**
 * Tontine Types
 */

export enum TontineType {
  ROSCA = 'ROSCA', // Rotating Savings and Credit Association
  ASCRA = 'ASCRA', // Accumulating Savings and Credit Association
  COMMERCIAL = 'Commercial',
}

export enum TontineStatus {
  OPEN = 'Open', // Accepting members
  ACTIVE = 'Active', // Running
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum TontineCategory {
  FAMILY = 'Family',
  FRIENDS = 'Friends',
  PROFESSIONAL = 'Professional',
  COMMUNITY = 'Community',
}

export enum Frequency {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  BI_WEEKLY = 'BiWeekly',
  MONTHLY = 'Monthly',
}

export enum DistributionOrder {
  RANDOM = 'Random', // Tirage au sort
  FIXED = 'Fixed', // Ordre fixe
  AUCTION = 'Auction', // Enchères
  VOTE = 'Vote', // Vote des membres
}

export enum MemberRole {
  ADMIN = 'Admin', // Créateur/Président
  SECRETARY = 'Secretary',
  TREASURER = 'Treasurer',
  MEMBER = 'Member',
  OBSERVER = 'Observer',
}

export enum MemberStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  EXPELLED = 'Expelled',
}

export interface Tontine {
  id: string;
  name: string;
  description?: string;
  category: TontineCategory;
  type: TontineType;
  creatorId: string;
  contributionAmount: number;
  currency: string;
  frequency: Frequency;
  totalMembers: number;
  currentMembers: number;
  startDate: string;
  status: TontineStatus;
  distributionOrder: DistributionOrder;
  latePenaltyPercent: number;
  gracePeriodDays: number;
  minReputationRequired: number;
  isPublic: boolean;
  depositAmount: number;
  photoUrl?: string;
  inviteCode?: string;
  /** Service rate in basis points (80 = 0,80 %) for the one-time activation fee. */
  tauxServiceBps?: number;
  /** Total activation fee frozen at cycle launch (FCFA). */
  fraisTotal?: number;
  /** How many beneficiaries (têtes) receive in the same round (1 = classic). */
  beneficiairesParTour?: number;
  /** Number of rounds in the cycle (Σ têtes / beneficiairesParTour). */
  totalRounds?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TontineDetail extends Tontine {
  members: TontineMember[];
  currentRound: number;
  totalRounds: number;
  currentBalance: number;
  nextBeneficiary?: TontineMember;
  nextDistributionDate?: string;
}

export interface TontineMember {
  id: string;
  tontineId: string;
  userId: string;
  user?: {
    id: string;
    fullName: string;
    profilePhotoUrl?: string;
    reputationScore: number;
    reputationLevel: string;
  };
  role: MemberRole;
  status: MemberStatus;
  receptionOrder?: number;
  /** Number of shares ("têtes") this member holds (1 = classic). */
  nbTetes?: number;
  joinedAt: string;
  totalContributed: number;
  totalReceived: number;
  latePaymentsCount: number;
  isCurrentBeneficiary: boolean;
  hasReceived: boolean;
}

export interface CreateTontineData {
  // Step 1: Basic Info
  name: string;
  description?: string;
  category: TontineCategory;
  photoUrl?: string;

  // Step 2: Financial Config
  type: TontineType;
  contributionAmount: number;
  currency: string;
  totalMembers: number;
  frequency: Frequency;
  startDate: string;
  /** Beneficiaries (têtes) served per round — 1 = classic, ≥2 = multi-bénéficiaire. */
  beneficiairesParTour?: number;
  /** Shares ("têtes") the creator takes for themselves (default 1). */
  creatorTetes?: number;

  // Step 3: Distribution Rules
  distributionOrder: DistributionOrder;
  latePenaltyPercent: number;
  gracePeriodDays: number;
  managementFeePercent?: number;

  // Step 4: Membership Conditions
  minReputationRequired: number;
  autoApprove: boolean;
  depositAmount: number;

  // Step 5: Advanced Settings
  isPublic: boolean;
  enableChat: boolean;
  allowObservers: boolean;

  // Trust layer (MVP): EME escrow + portable reliability gate
  sequestreActive?: boolean; // funds held in the EME cantonnement (default true)
  scoreMinimum?: number; // minimum reliability score to join (0..100)
}

export interface TontineFilters {
  category?: TontineCategory;
  minAmount?: number;
  maxAmount?: number;
  frequency?: Frequency;
  minReputation?: number;
  search?: string;
}

export interface TontineInvitation {
  id: string;
  tontineId: string;
  tontine: Tontine;
  inviterId: string;
  inviteePhoneNumber: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
  expiresAt: string;
}

export interface JoinTontineRequest {
  tontineId: string;
  motivationMessage?: string;
}
