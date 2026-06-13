/**
 * User and Authentication Types
 */

export enum ReputationLevel {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum',
  DIAMOND = 'Diamond',
}

export enum KYCLevel {
  LEVEL_1 = 1, // Basic (< 1000 USD/month)
  LEVEL_2 = 2, // Advanced (> 1000 USD/month)
}

export interface User {
  id: string;
  phoneNumber: string;
  /** Real legal name — kept private (KYC / EME / Atlas Studio). */
  fullName: string;
  /** Optional pseudonym shown to other members instead of the real name. */
  displayName?: string;
  email?: string;
  profilePhotoUrl?: string;
  /** Convenience alias for profilePhotoUrl used by some screens. */
  avatar?: string;
  reputationScore: number;
  reputationLevel: ReputationLevel;
  kycLevel: KYCLevel;
  isVerified: boolean;
  /** Convenience alias for isVerified. */
  verified?: boolean;
  city?: string;
  region?: string;
  dateOfBirth?: string;
  /** User preferences. */
  language?: string;
  preferredCurrency?: string;
  /** Denormalized stats (present on the demo user / profile payloads). */
  totalContributed?: number;
  totalReceived?: number;
  activeTontines?: number;
  completedTontines?: number;
  punctualityRate?: number;
  totalContributions?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  statistics: UserStatistics;
  mobileMoneyAccounts: MobileMoneyAccount[];
  ratings: Rating[];
  badges: Badge[];
}

export interface UserStatistics {
  tontinesCompleted: number;
  activeTontines: number;
  totalContributed: number;
  totalReceived: number;
  onTimePaymentRate: number; // Percentage
  latePaymentsCount: number;
  memberSince: string;
}

export interface MobileMoneyAccount {
  id: string;
  userId: string;
  operator: MobileMoneyOperator;
  accountNumber: string;
  accountName?: string;
  /** Display aliases used by payment/profile screens. */
  provider?: string;
  phoneNumber?: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

export enum MobileMoneyOperator {
  M_PESA = 'M-Pesa',
  ORANGE_MONEY = 'Orange Money',
  MTN_MONEY = 'MTN Money',
  MOOV_MONEY = 'Moov Money',
  WAVE = 'Wave',
  AIRTEL_MONEY = 'Airtel Money',
}

export interface Rating {
  id: string;
  tontineId: string;
  raterId: string;
  ratedId: string;
  rating: number; // 1-5
  punctualityScore: number; // 1-5
  communicationScore: number; // 1-5
  reliabilityScore: number; // 1-5
  comment?: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: string;
}

export interface ReputationEvent {
  id: string;
  userId: string;
  tontineId?: string;
  eventType: ReputationEventType;
  pointsChange: number;
  description?: string;
  createdAt: string;
}

export enum ReputationEventType {
  ON_TIME_PAYMENT = 'OnTimePayment',
  LATE_PAYMENT_1_3_DAYS = 'LatePayment1to3Days',
  LATE_PAYMENT_4_7_DAYS = 'LatePayment4to7Days',
  LATE_PAYMENT_BEYOND_7_DAYS = 'LatePaymentBeyond7Days',
  TONTINE_COMPLETED = 'TontineCompleted',
  POSITIVE_RATING = 'PositiveRating',
  REFERRAL_BONUS = 'ReferralBonus',
  COMMUNITY_HELP = 'CommunityHelp',
}

export interface AuthCredentials {
  phoneNumber: string;
  pin: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  phoneNumber: string;
  fullName: string;
  pin: string;
  email?: string;
  dateOfBirth?: string;
}

export interface OTPVerification {
  phoneNumber: string;
  otpCode: string;
}
