/**
 * Application Constants
 * Shared constants used throughout the application
 */

/**
 * Tontine Types
 */
export const TONTINE_TYPES = {
  ROTATING: 'Rotating',
  ACCUMULATING: 'Accumulating',
  AUCTION: 'Auction',
} as const;

export type TontineType = (typeof TONTINE_TYPES)[keyof typeof TONTINE_TYPES];

/**
 * Tontine Categories
 */
export const TONTINE_CATEGORIES = {
  FAMILY: 'Family',
  FRIENDS: 'Friends',
  WORK: 'Work',
  COMMUNITY: 'Community',
  BUSINESS: 'Business',
  EDUCATION: 'Education',
  HEALTH: 'Health',
  EVENTS: 'Events',
} as const;

export type TontineCategory = (typeof TONTINE_CATEGORIES)[keyof typeof TONTINE_CATEGORIES];

/**
 * Tontine Status
 */
export const TONTINE_STATUS = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PAUSED: 'Paused',
} as const;

export type TontineStatus = (typeof TONTINE_STATUS)[keyof typeof TONTINE_STATUS];

/**
 * Member Roles
 */
export const MEMBER_ROLES = {
  ADMIN: 'Admin',
  TREASURER: 'Treasurer',
  MEMBER: 'Member',
  OBSERVER: 'Observer',
} as const;

export type MemberRole = (typeof MEMBER_ROLES)[keyof typeof MEMBER_ROLES];

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = {
  MOBILE_MONEY: 'MobileMoney',
  BANK_TRANSFER: 'BankTransfer',
  CASH: 'Cash',
  CARD: 'Card',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

/**
 * Payment Status
 */
export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/**
 * Transaction Types
 */
export const TRANSACTION_TYPES = {
  CONTRIBUTION: 'Contribution',
  DISTRIBUTION: 'Distribution',
  PENALTY: 'Penalty',
  BONUS: 'Bonus',
  REFUND: 'Refund',
  FEE: 'Fee',
} as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  CONTRIBUTION: 'Contribution',
  DISTRIBUTION: 'Distribution',
  PAYMENT_REMINDER: 'PaymentReminder',
  TONTINE_INVITE: 'TontineInvite',
  VOTE: 'Vote',
  CHAT: 'Chat',
  SYSTEM_UPDATE: 'SystemUpdate',
  PROMOTION: 'Promotion',
  ANNOUNCEMENT: 'Announcement',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/**
 * Vote Types
 */
export const VOTE_TYPES = {
  RULE_CHANGE: 'RuleChange',
  NEW_MEMBER: 'NewMember',
  REMOVE_MEMBER: 'RemoveMember',
  EARLY_DISTRIBUTION: 'EarlyDistribution',
  EXTEND_CYCLE: 'ExtendCycle',
  OTHER: 'Other',
} as const;

export type VoteType = (typeof VOTE_TYPES)[keyof typeof VOTE_TYPES];

/**
 * Vote Status
 */
export const VOTE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
} as const;

export type VoteStatus = (typeof VOTE_STATUS)[keyof typeof VOTE_STATUS];

/**
 * KYC Status
 */
export const KYC_STATUS = {
  NOT_STARTED: 'NotStarted',
  IN_PROGRESS: 'InProgress',
  PENDING_REVIEW: 'PendingReview',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
} as const;

export type KYCStatus = (typeof KYC_STATUS)[keyof typeof KYC_STATUS];

/**
 * KYC Levels
 */
export const KYC_LEVELS = {
  LEVEL_0: 0,
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
} as const;

export type KYCLevel = (typeof KYC_LEVELS)[keyof typeof KYC_LEVELS];

/**
 * Reputation Levels
 */
export const REPUTATION_LEVELS = {
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
  DIAMOND: 'Diamond',
} as const;

export type ReputationLevel = (typeof REPUTATION_LEVELS)[keyof typeof REPUTATION_LEVELS];

/**
 * Document Types
 */
export const DOCUMENT_TYPES = {
  ID_CARD: 'id_card',
  PASSPORT: 'passport',
  SELFIE: 'selfie',
  PROOF_OF_ADDRESS: 'proof_of_address',
  BANK_STATEMENT: 'bank_statement',
} as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];

/**
 * Mobile Money Providers
 */
export const MOBILE_MONEY_PROVIDERS = {
  ORANGE_MONEY: 'orange-money',
  WAVE: 'wave',
  FREE_MONEY: 'free-money',
  MTN_MONEY: 'mtn-money',
  MOOV_MONEY: 'moov-money',
} as const;

export type MobileMoneyProvider =
  (typeof MOBILE_MONEY_PROVIDERS)[keyof typeof MOBILE_MONEY_PROVIDERS];

/**
 * Frequency Types
 */
export const FREQUENCY_TYPES = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Biweekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
} as const;

export type FrequencyType = (typeof FREQUENCY_TYPES)[keyof typeof FREQUENCY_TYPES];

/**
 * Day of Week
 */
export const DAYS_OF_WEEK = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
} as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[keyof typeof DAYS_OF_WEEK];

/**
 * Chat Message Types
 */
export const CHAT_MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  SYSTEM: 'system',
} as const;

export type ChatMessageType = (typeof CHAT_MESSAGE_TYPES)[keyof typeof CHAT_MESSAGE_TYPES];

/**
 * Dispute Status
 */
export const DISPUTE_STATUS = {
  OPEN: 'Open',
  IN_REVIEW: 'InReview',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
} as const;

export type DisputeStatus = (typeof DISPUTE_STATUS)[keyof typeof DISPUTE_STATUS];

/**
 * Report Reasons
 */
export const REPORT_REASONS = {
  SPAM: 'Spam',
  FRAUD: 'Fraud',
  HARASSMENT: 'Harassment',
  INAPPROPRIATE_CONTENT: 'InappropriateContent',
  OTHER: 'Other',
} as const;

export type ReportReason = (typeof REPORT_REASONS)[keyof typeof REPORT_REASONS];

/**
 * Theme Types
 */
export const THEME_TYPES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type ThemeType = (typeof THEME_TYPES)[keyof typeof THEME_TYPES];

/**
 * Language Codes
 */
export const LANGUAGE_CODES = {
  FRENCH: 'fr',
  ENGLISH: 'en',
  WOLOF: 'wo',
  ARABIC: 'ar',
} as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[keyof typeof LANGUAGE_CODES];

/**
 * Currency Codes
 */
export const CURRENCY_CODES = {
  XOF: 'XOF',
  EUR: 'EUR',
  USD: 'USD',
  GBP: 'GBP',
} as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[keyof typeof CURRENCY_CODES];

/**
 * Sort Options
 */
export const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  AMOUNT_HIGH: 'amount_high',
  AMOUNT_LOW: 'amount_low',
  NAME_AZ: 'name_az',
  NAME_ZA: 'name_za',
  POPULAR: 'popular',
} as const;

export type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

/**
 * Filter Options
 */
export const FILTER_OPTIONS = {
  ALL: 'all',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PENDING: 'pending',
} as const;

export type FilterOption = (typeof FILTER_OPTIONS)[keyof typeof FILTER_OPTIONS];

/**
 * Achievement Types
 */
export const ACHIEVEMENT_TYPES = {
  FIRST_TONTINE: 'first_tontine',
  FIRST_CONTRIBUTION: 'first_contribution',
  PERFECT_ATTENDANCE: 'perfect_attendance',
  REFERRAL_MASTER: 'referral_master',
  SAVINGS_CHAMPION: 'savings_champion',
  COMMUNITY_BUILDER: 'community_builder',
} as const;

export type AchievementType = (typeof ACHIEVEMENT_TYPES)[keyof typeof ACHIEVEMENT_TYPES];

/**
 * Error Codes
 */
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HTTPStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

/**
 * Animation Durations (ms)
 */
export const ANIMATION_DURATION = {
  INSTANT: 0,
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

/**
 * Debounce/Throttle Delays (ms)
 */
export const DELAYS = {
  SEARCH: 500,
  INPUT: 300,
  SCROLL: 100,
  RESIZE: 200,
} as const;

/**
 * Image Sizes
 */
export const IMAGE_SIZES = {
  THUMBNAIL: {width: 100, height: 100},
  SMALL: {width: 200, height: 200},
  MEDIUM: {width: 400, height: 400},
  LARGE: {width: 800, height: 800},
  FULL: {width: 1200, height: 1200},
} as const;

/**
 * Icon Sizes
 */
export const ICON_SIZES = {
  XS: 12,
  SM: 16,
  MD: 24,
  LG: 32,
  XL: 48,
  XXL: 64,
} as const;

/**
 * Breakpoints (for responsive design)
 */
export const BREAKPOINTS = {
  XS: 0,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
} as const;

/**
 * Z-Index Layers
 */
export const Z_INDEX = {
  BACKGROUND: -1,
  BASE: 0,
  DROPDOWN: 1000,
  STICKY: 1100,
  FIXED: 1200,
  MODAL_BACKDROP: 1300,
  MODAL: 1400,
  POPOVER: 1500,
  TOOLTIP: 1600,
  NOTIFICATION: 1700,
} as const;

/**
 * Max Lengths
 */
export const MAX_LENGTH = {
  NAME: 100,
  DESCRIPTION: 500,
  MESSAGE: 1000,
  BIO: 200,
  COMMENT: 500,
} as const;

/**
 * Regex Patterns
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/.+/,
  NUMBERS_ONLY: /^\d+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
} as const;

/**
 * Default Values
 */
export const DEFAULTS = {
  PAGINATION_SIZE: 20,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  CACHE_TTL: 300000, // 5 minutes
  OTP_LENGTH: 6,
  PIN_LENGTH: 4,
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_SIZE_MB: 5,
} as const;

/**
 * Supabase Table Names (for reference)
 */
export const TABLES = {
  PROFILES: 'profiles',
  USER_STATISTICS: 'user_statistics',
  MOBILE_MONEY_ACCOUNTS: 'mobile_money_accounts',
  TONTINES: 'tontines',
  TONTINE_MEMBERS: 'tontine_members',
  CONTRIBUTIONS: 'contributions',
  DISTRIBUTIONS: 'distributions',
  TRANSACTIONS: 'transactions',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
} as const;

/**
 * Export all constants
 */
export default {
  TONTINE_TYPES,
  TONTINE_CATEGORIES,
  TONTINE_STATUS,
  MEMBER_ROLES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  TRANSACTION_TYPES,
  NOTIFICATION_TYPES,
  VOTE_TYPES,
  VOTE_STATUS,
  KYC_STATUS,
  KYC_LEVELS,
  REPUTATION_LEVELS,
  DOCUMENT_TYPES,
  MOBILE_MONEY_PROVIDERS,
  FREQUENCY_TYPES,
  DAYS_OF_WEEK,
  CHAT_MESSAGE_TYPES,
  DISPUTE_STATUS,
  REPORT_REASONS,
  THEME_TYPES,
  LANGUAGE_CODES,
  CURRENCY_CODES,
  SORT_OPTIONS,
  FILTER_OPTIONS,
  ACHIEVEMENT_TYPES,
  ERROR_CODES,
  HTTP_STATUS,
  ANIMATION_DURATION,
  DELAYS,
  IMAGE_SIZES,
  ICON_SIZES,
  BREAKPOINTS,
  Z_INDEX,
  MAX_LENGTH,
  REGEX_PATTERNS,
  DEFAULTS,
  TABLES,
};
