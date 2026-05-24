/**
 * Application Constants
 */

import Config from 'react-native-config';

// API Configuration
export const API_CONFIG = {
  BASE_URL: Config.API_BASE_URL || 'https://api.tontinedigital.com',
  VERSION: Config.API_VERSION || 'v1',
  TIMEOUT: parseInt(Config.API_TIMEOUT || '30000', 10),
};

// App Information
export const APP_INFO = {
  NAME: Config.APP_NAME || 'TontineDigital',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  SCHEME: Config.APP_SCHEME || 'tontinedigital',
};

// Feature Flags
export const FEATURES = {
  BIOMETRIC_AUTH: Config.ENABLE_BIOMETRIC_AUTH === 'true',
  OFFLINE_MODE: Config.ENABLE_OFFLINE_MODE === 'true',
  PUSH_NOTIFICATIONS: Config.ENABLE_PUSH_NOTIFICATIONS === 'true',
  ANALYTICS: Config.ENABLE_ANALYTICS === 'true',
};

// Reputation Score Thresholds
export const REPUTATION_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 201,
  GOLD: 401,
  PLATINUM: 651,
  DIAMOND: 851,
  MAX: 1000,
};

// Reputation Points
export const REPUTATION_POINTS = {
  ON_TIME_PAYMENT: 10,
  LATE_1_3_DAYS: -20,
  LATE_4_7_DAYS: -50,
  LATE_BEYOND_7_DAYS: -100,
  TONTINE_COMPLETED: 50,
  ACTIVE_NO_LATE: 25,
  REFERRAL: 5,
  CONFLICT_RESOLUTION: 10,
};

// Tontine Limits
export const TONTINE_LIMITS = {
  MIN_MEMBERS: 3,
  MAX_MEMBERS: 50,
  MIN_CONTRIBUTION: 1000, // In base currency
  MAX_CONTRIBUTION: 10000000,
  MAX_FREE_TONTINES: 3, // For free tier
};

// Payment
export const PAYMENT = {
  MAX_PENALTY_PERCENT: 50, // Maximum late penalty as percentage
  DEFAULT_GRACE_PERIOD_DAYS: 0,
  TRANSACTION_FEE_PERCENT: 1, // 1% service fee
  MAX_TRANSACTION_FEE: 500, // In base currency
};

// Validation
export const VALIDATION = {
  PIN_LENGTH_MIN: 4,
  PIN_LENGTH_MAX: 6,
  PHONE_NUMBER_MIN_LENGTH: 10,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  MESSAGE_MAX_LENGTH: 1000,
  TONTINE_NAME_MAX_LENGTH: 100,
  TONTINE_DESCRIPTION_MAX_LENGTH: 500,
};

// Notification Timing (in hours before event)
export const NOTIFICATION_TIMING = {
  PAYMENT_REMINDER_DAYS: [7, 3, 1],
  DISTRIBUTION_REMINDER_DAYS: [7, 3, 1],
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@tontinedigital:auth_token',
  REFRESH_TOKEN: '@tontinedigital:refresh_token',
  USER_DATA: '@tontinedigital:user_data',
  BIOMETRIC_ENABLED: '@tontinedigital:biometric_enabled',
  PIN_HASH: '@tontinedigital:pin_hash',
  LANGUAGE: '@tontinedigital:language',
  THEME: '@tontinedigital:theme',
  NOTIFICATIONS_SETTINGS: '@tontinedigital:notifications_settings',
};

// Supported Currencies
export const CURRENCIES = [
  {code: 'XOF', name: 'Franc CFA (BCEAO)', symbol: 'FCFA', countries: ['CI', 'SN', 'BF', 'ML']},
  {code: 'XAF', name: 'Franc CFA (BEAC)', symbol: 'FCFA', countries: ['CM', 'GA', 'CG']},
  {code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', countries: ['KE']},
  {code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', countries: ['UG']},
  {code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', countries: ['TZ']},
  {code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', countries: ['GH']},
  {code: 'NGN', name: 'Nigerian Naira', symbol: '₦', countries: ['NG']},
];

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  API: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  SHORT: 'dd MMM yyyy',
  MONTH_YEAR: 'MMMM yyyy',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// File Upload
export const FILE_UPLOAD = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
};

// Deep Link Prefixes
export const DEEP_LINK_PREFIXES = [
  `${APP_INFO.SCHEME}://`,
  `https://app.tontinedigital.com`,
];

// Social Sharing
export const SHARE_CONFIG = {
  INVITE_MESSAGE: 'Rejoignez-moi sur TontineDigital, la meilleure app de tontine ! ',
  TONTINE_SHARE_MESSAGE: "Rejoignez ma tontine sur TontineDigital : ",
};

export default {
  API_CONFIG,
  APP_INFO,
  FEATURES,
  REPUTATION_THRESHOLDS,
  REPUTATION_POINTS,
  TONTINE_LIMITS,
  PAYMENT,
  VALIDATION,
  NOTIFICATION_TIMING,
  STORAGE_KEYS,
  CURRENCIES,
  DATE_FORMATS,
  PAGINATION,
  FILE_UPLOAD,
  DEEP_LINK_PREFIXES,
  SHARE_CONFIG,
};
