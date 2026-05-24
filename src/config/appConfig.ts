/**
 * App Configuration
 * Central configuration file for the application
 */

import {Platform} from 'react-native';
import Config from 'react-native-config';

/**
 * Supabase Configuration
 * Sourced from the environment (.env via react-native-config) with a safe
 * placeholder fallback. Set SUPABASE_URL / SUPABASE_ANON_KEY in your .env.
 */
const PLACEHOLDER_URL = 'https://your-project.supabase.co';
// Default to the connected WeDo project; overridable via .env (react-native-config).
const DEFAULT_URL = 'https://easoqoswtmvtkdwwkqtc.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhc29xb3N3dG12dGtkd3drcXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTE1MTMsImV4cCI6MjA5MTQ2NzUxM30.uOcZAHEwu-pGr07HsHPVxzO0CSrbAPtye2b6JUdkwpk';
export const SUPABASE_URL = (Config as any)?.SUPABASE_URL || DEFAULT_URL;
export const SUPABASE_ANON_KEY = (Config as any)?.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

/** All WeDo objects live in the dedicated `wedo` Postgres schema (isolated from
 * other apps that may share this Supabase project). */
export const SUPABASE_SCHEMA = 'wedo';

/** True when the backend hasn't been configured yet (demo / preview mode). */
export const IS_SUPABASE_CONFIGURED = SUPABASE_URL !== PLACEHOLDER_URL;

if (__DEV__ && !IS_SUPABASE_CONFIGURED) {
  // eslint-disable-next-line no-console
  console.warn(
    '[WeDo] Supabase non configuré — définissez SUPABASE_URL et SUPABASE_ANON_KEY dans .env. ' +
      'L\'app fonctionne en mode démo (authentification réelle désactivée).',
  );
}

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Get current environment
 */
export const getEnvironment = (): Environment => {
  // TODO: Set this based on your build configuration
  // You can use react-native-config or similar library
  // return Config.ENVIRONMENT as Environment;
  return __DEV__ ? 'development' : 'production';
};

/**
 * App Information
 */
export const APP_INFO = {
  name: 'Tontine Digital',
  version: '1.0.0',
  buildNumber: '1',
  bundleId: Platform.select({
    ios: 'com.tontinedigital.app',
    android: 'com.tontinedigital.app',
  }),
};

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  // Settings
  LANGUAGE: '@language',
  CURRENCY: '@currency',
  THEME: '@theme',
  NOTIFICATIONS_ENABLED: '@notifications_enabled',
  PUSH_TOKEN: '@push_token',

  // Onboarding
  ONBOARDING_COMPLETE: '@onboarding_complete',
  FIRST_LAUNCH: '@first_launch',

  // Cache
  TONTINES_CACHE: '@tontines_cache',
  USER_PROFILE_CACHE: '@user_profile_cache',
  CACHE_TIMESTAMP: '@cache_timestamp',
};

/**
 * Pagination Configuration
 */
export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
  pageSizeOptions: [10, 20, 50, 100],
};

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  // Time in milliseconds
  userProfile: 5 * 60 * 1000, // 5 minutes
  tontinesList: 2 * 60 * 1000, // 2 minutes
  notifications: 1 * 60 * 1000, // 1 minute
  statistics: 10 * 60 * 1000, // 10 minutes
};

/**
 * Network Configuration
 */
export const NETWORK_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000, // ms
  connectionTimeout: 10000, // ms
  enableOfflineMode: true,
};

/**
 * Validation Rules
 */
export const VALIDATION_RULES = {
  // Phone number
  phoneMinLength: 8,
  phoneMaxLength: 15,

  // Password
  passwordMinLength: 8,
  passwordMaxLength: 128,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecial: true,

  // Name
  nameMinLength: 2,
  nameMaxLength: 100,

  // Tontine
  tontineNameMinLength: 3,
  tontineNameMaxLength: 100,
  tontineDescriptionMaxLength: 500,
  tontineMinMembers: 2,
  tontineMaxMembers: 100,

  // Contribution
  contributionMinAmount: 1000, // XOF
  contributionMaxAmount: 10000000, // XOF

  // Image upload
  imageMaxSizeMB: 5,
  imageAllowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
};

/**
 * Date & Time Configuration
 */
export const DATE_TIME_CONFIG = {
  defaultDateFormat: 'DD/MM/YYYY',
  defaultTimeFormat: 'HH:mm',
  defaultDateTimeFormat: 'DD/MM/YYYY HH:mm',
  defaultLocale: 'fr',
  timezone: 'Africa/Dakar',
};

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = {
  mobileMoney: {
    enabled: true,
    providers: [
      {
        id: 'orange-money',
        name: 'Orange Money',
        icon: 'cellphone-wireless',
        color: '#FF6600',
        countries: ['SN', 'CI', 'ML', 'BF'],
      },
      {
        id: 'wave',
        name: 'Wave',
        icon: 'water',
        color: '#00D9A5',
        countries: ['SN', 'CI', 'ML', 'BF'],
      },
      {
        id: 'free-money',
        name: 'Free Money',
        icon: 'star',
        color: '#FF0000',
        countries: ['SN'],
      },
      {
        id: 'mtn-money',
        name: 'MTN Mobile Money',
        icon: 'cellphone',
        color: '#FFCC00',
        countries: ['CI', 'BF', 'ML'],
      },
      {
        id: 'moov-money',
        name: 'Moov Money',
        icon: 'cellphone-check',
        color: '#0099CC',
        countries: ['CI', 'BF'],
      },
    ],
  },
  bankTransfer: {
    enabled: true,
    processingTime: '1-3 jours ouvrables',
  },
  cash: {
    enabled: true,
    requireVerification: true,
  },
  card: {
    enabled: false, // Future feature
    providers: ['visa', 'mastercard'],
  },
};

/**
 * Notification Configuration
 */
export const NOTIFICATION_CONFIG = {
  // Notification types configuration
  types: {
    contribution: {enabled: true, sound: true, vibrate: true},
    distribution: {enabled: true, sound: true, vibrate: true},
    paymentReminder: {enabled: true, sound: true, vibrate: true},
    tontineInvite: {enabled: true, sound: true, vibrate: true},
    vote: {enabled: true, sound: true, vibrate: true},
    chat: {enabled: true, sound: true, vibrate: false},
    systemUpdate: {enabled: true, sound: false, vibrate: false},
    promotion: {enabled: true, sound: false, vibrate: false},
    announcement: {enabled: true, sound: false, vibrate: false},
  },

  // Push notification settings
  enablePushNotifications: true,
  enableInAppNotifications: true,
  enableEmailNotifications: false,

  // Quiet hours
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

/**
 * Social Features Configuration
 */
export const SOCIAL_CONFIG = {
  // Sharing
  enableSharing: true,
  shareableContent: ['tontine', 'profile', 'achievement'],

  // Referral
  enableReferralProgram: true,
  referralBonusAmount: 5000, // XOF
  referralMinContributions: 3,

  // Chat
  enableChat: true,
  maxMessageLength: 1000,
  enableMediaSharing: true,
  maxMediaSizeMB: 10,

  // Reputation
  enableReputationSystem: true,
  reputationLevels: [
    {level: 'Bronze', minScore: 0, maxScore: 99, color: '#CD7F32'},
    {level: 'Silver', minScore: 100, maxScore: 499, color: '#C0C0C0'},
    {level: 'Gold', minScore: 500, maxScore: 999, color: '#FFD700'},
    {level: 'Platinum', minScore: 1000, maxScore: 4999, color: '#E5E4E2'},
    {level: 'Diamond', minScore: 5000, maxScore: Infinity, color: '#B9F2FF'},
  ],
};

/**
 * Security Configuration
 */
export const SECURITY_CONFIG = {
  // Biometric
  enableBiometric: true,
  biometricFallbackEnabled: true,

  // PIN
  enablePIN: true,
  pinLength: 4,
  maxPINAttempts: 3,
  pinLockoutDuration: 5 * 60 * 1000, // 5 minutes

  // Session
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  enableAutoLogout: true,

  // 2FA
  enable2FA: false, // Future feature

  // Encryption
  enableDataEncryption: true,
  encryptionAlgorithm: 'AES-256',
};

/**
 * KYC Configuration
 */
export const KYC_CONFIG = {
  levels: [
    {
      level: 0,
      name: 'Non vérifié',
      maxTransactionAmount: 50000, // XOF
      maxDailyAmount: 200000, // XOF
      requiresDocuments: false,
    },
    {
      level: 1,
      name: 'Basique',
      maxTransactionAmount: 500000, // XOF
      maxDailyAmount: 2000000, // XOF
      requiresDocuments: ['id_card', 'selfie'],
    },
    {
      level: 2,
      name: 'Avancé',
      maxTransactionAmount: 5000000, // XOF
      maxDailyAmount: 20000000, // XOF
      requiresDocuments: ['id_card', 'selfie', 'proof_of_address'],
    },
    {
      level: 3,
      name: 'Premium',
      maxTransactionAmount: Infinity,
      maxDailyAmount: Infinity,
      requiresDocuments: ['id_card', 'selfie', 'proof_of_address', 'bank_statement'],
    },
  ],
  documentTypes: [
    {id: 'id_card', name: 'Carte d\'identité', required: true},
    {id: 'passport', name: 'Passeport', required: false},
    {id: 'selfie', name: 'Photo selfie', required: true},
    {id: 'proof_of_address', name: 'Justificatif de domicile', required: false},
    {id: 'bank_statement', name: 'Relevé bancaire', required: false},
  ],
};

/**
 * Analytics Configuration
 */
export const ANALYTICS_CONFIG = {
  enableAnalytics: !__DEV__,
  enableCrashReporting: !__DEV__,
  enablePerformanceMonitoring: !__DEV__,

  // Events to track
  trackScreenViews: true,
  trackUserActions: true,
  trackErrors: true,
  trackPerformance: true,

  // Sampling
  sessionSamplingRate: 1.0, // 100%
  errorSamplingRate: 1.0, // 100%
};

/**
 * Supported Languages
 */
export const SUPPORTED_LANGUAGES = [
  {code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷'},
  {code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧'},
  {code: 'wo', name: 'Wolof', nativeName: 'Wolof', flag: '🇸🇳'},
  {code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦'},
];

/**
 * Supported Currencies
 */
export const SUPPORTED_CURRENCIES = [
  {code: 'XOF', symbol: 'CFA', name: 'Franc CFA', flag: '🇸🇳'},
  {code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺'},
  {code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸'},
  {code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧'},
];

/**
 * Support & Help Configuration
 */
export const SUPPORT_CONFIG = {
  email: 'support@tontinedigital.app',
  phone: '+221 XX XXX XX XX',
  whatsapp: '+221XXXXXXXXX',
  website: 'https://tontinedigital.app',
  faq: 'https://tontinedigital.app/faq',
  termsOfService: 'https://tontinedigital.app/terms',
  privacyPolicy: 'https://tontinedigital.app/privacy',

  // Social media
  facebook: 'https://facebook.com/tontinedigital',
  twitter: 'https://twitter.com/tontinedigital',
  instagram: 'https://instagram.com/tontinedigital',
  linkedin: 'https://linkedin.com/company/tontinedigital',
};

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMIT_CONFIG = {
  // API rate limits (requests per minute)
  apiRequestsPerMinute: 60,

  // OTP rate limits
  otpRequestsPerHour: 5,
  otpRequestCooldown: 60 * 1000, // 1 minute

  // Login attempts
  maxLoginAttempts: 5,
  loginLockoutDuration: 15 * 60 * 1000, // 15 minutes
};

/**
 * Default Configuration
 */
export const DEFAULT_CONFIG = {
  language: 'fr',
  currency: 'XOF',
  theme: 'light',
  notificationsEnabled: true,
  biometricEnabled: false,
  pinEnabled: false,
};

/**
 * Export all configurations
 */
export default {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  APP_INFO,
  getEnvironment,
  STORAGE_KEYS,
  PAGINATION,
  CACHE_CONFIG,
  NETWORK_CONFIG,
  VALIDATION_RULES,
  DATE_TIME_CONFIG,
  PAYMENT_METHODS,
  NOTIFICATION_CONFIG,
  SOCIAL_CONFIG,
  SECURITY_CONFIG,
  KYC_CONFIG,
  ANALYTICS_CONFIG,
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  SUPPORT_CONFIG,
  RATE_LIMIT_CONFIG,
  DEFAULT_CONFIG,
};
