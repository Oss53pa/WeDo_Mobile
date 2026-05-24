/**
 * Feature Flags
 * Manage feature toggles for gradual rollout and A/B testing
 */

import {getEnvironment} from './appConfig';

/**
 * Feature flag types
 */
export type FeatureFlagKey =
  // Core Features
  | 'biometric_authentication'
  | 'pin_authentication'
  | 'two_factor_authentication'
  | 'offline_mode'

  // Tontine Features
  | 'tontine_creation'
  | 'tontine_chat'
  | 'tontine_voting'
  | 'tontine_goals'
  | 'tontine_insurance'
  | 'recurring_tontines'
  | 'tontine_templates'

  // Payment Features
  | 'mobile_money_payment'
  | 'bank_transfer_payment'
  | 'card_payment'
  | 'cash_payment'
  | 'auto_payment'
  | 'payment_reminders'
  | 'payment_installments'

  // Social Features
  | 'referral_program'
  | 'reputation_system'
  | 'achievements_badges'
  | 'leaderboards'
  | 'social_sharing'
  | 'user_profiles'

  // Communication Features
  | 'push_notifications'
  | 'in_app_messaging'
  | 'email_notifications'
  | 'sms_notifications'
  | 'voice_calls'
  | 'video_calls'

  // KYC & Verification
  | 'kyc_verification'
  | 'document_upload'
  | 'selfie_verification'
  | 'liveness_detection'

  // Analytics & Tracking
  | 'analytics_tracking'
  | 'crash_reporting'
  | 'performance_monitoring'
  | 'user_feedback'

  // Admin Features
  | 'dispute_resolution'
  | 'user_support_chat'
  | 'admin_dashboard'
  | 'user_reporting'

  // Experimental Features
  | 'dark_mode'
  | 'ai_recommendations'
  | 'voice_commands'
  | 'nfc_payments'
  | 'qr_code_payments'
  | 'crypto_payments';

/**
 * Feature flag configuration
 */
export interface FeatureFlag {
  key: FeatureFlagKey;
  enabled: boolean;
  description: string;
  environments?: Array<'development' | 'staging' | 'production'>;
  minAppVersion?: string;
  maxAppVersion?: string;
  rolloutPercentage?: number; // 0-100
  userSegments?: string[]; // Target specific user segments
  countryRestrictions?: string[]; // ISO country codes
}

/**
 * Feature flags definition
 */
const FEATURE_FLAGS: Record<FeatureFlagKey, FeatureFlag> = {
  // Core Features
  biometric_authentication: {
    key: 'biometric_authentication',
    enabled: true,
    description: 'Enable biometric authentication (Face ID, Touch ID, Fingerprint)',
    environments: ['development', 'staging', 'production'],
  },
  pin_authentication: {
    key: 'pin_authentication',
    enabled: true,
    description: 'Enable PIN code authentication',
    environments: ['development', 'staging', 'production'],
  },
  two_factor_authentication: {
    key: 'two_factor_authentication',
    enabled: false,
    description: 'Enable two-factor authentication',
    environments: ['development', 'staging'],
    minAppVersion: '1.1.0',
  },
  offline_mode: {
    key: 'offline_mode',
    enabled: true,
    description: 'Enable offline mode with data synchronization',
    environments: ['development', 'staging', 'production'],
  },

  // Tontine Features
  tontine_creation: {
    key: 'tontine_creation',
    enabled: true,
    description: 'Allow users to create new tontines',
    environments: ['development', 'staging', 'production'],
  },
  tontine_chat: {
    key: 'tontine_chat',
    enabled: true,
    description: 'Enable chat feature within tontines',
    environments: ['development', 'staging', 'production'],
  },
  tontine_voting: {
    key: 'tontine_voting',
    enabled: true,
    description: 'Enable voting system for tontine decisions',
    environments: ['development', 'staging', 'production'],
  },
  tontine_goals: {
    key: 'tontine_goals',
    enabled: true,
    description: 'Enable goal-based tontines',
    environments: ['development', 'staging', 'production'],
  },
  tontine_insurance: {
    key: 'tontine_insurance',
    enabled: false,
    description: 'Enable insurance-linked tontines',
    environments: ['development'],
    minAppVersion: '2.0.0',
  },
  recurring_tontines: {
    key: 'recurring_tontines',
    enabled: true,
    description: 'Enable recurring tontines (monthly, quarterly)',
    environments: ['development', 'staging', 'production'],
  },
  tontine_templates: {
    key: 'tontine_templates',
    enabled: true,
    description: 'Enable pre-configured tontine templates',
    environments: ['development', 'staging', 'production'],
  },

  // Payment Features
  mobile_money_payment: {
    key: 'mobile_money_payment',
    enabled: true,
    description: 'Enable mobile money payments',
    environments: ['development', 'staging', 'production'],
  },
  bank_transfer_payment: {
    key: 'bank_transfer_payment',
    enabled: true,
    description: 'Enable bank transfer payments',
    environments: ['development', 'staging', 'production'],
  },
  card_payment: {
    key: 'card_payment',
    enabled: false,
    description: 'Enable credit/debit card payments',
    environments: ['development', 'staging'],
    minAppVersion: '1.2.0',
  },
  cash_payment: {
    key: 'cash_payment',
    enabled: true,
    description: 'Enable cash payment recording',
    environments: ['development', 'staging', 'production'],
  },
  auto_payment: {
    key: 'auto_payment',
    enabled: false,
    description: 'Enable automatic recurring payments',
    environments: ['development'],
    minAppVersion: '1.3.0',
  },
  payment_reminders: {
    key: 'payment_reminders',
    enabled: true,
    description: 'Enable payment reminder notifications',
    environments: ['development', 'staging', 'production'],
  },
  payment_installments: {
    key: 'payment_installments',
    enabled: false,
    description: 'Enable payment installments',
    environments: ['development'],
    minAppVersion: '1.5.0',
  },

  // Social Features
  referral_program: {
    key: 'referral_program',
    enabled: true,
    description: 'Enable user referral program with rewards',
    environments: ['development', 'staging', 'production'],
    rolloutPercentage: 100,
  },
  reputation_system: {
    key: 'reputation_system',
    enabled: true,
    description: 'Enable reputation scoring system',
    environments: ['development', 'staging', 'production'],
  },
  achievements_badges: {
    key: 'achievements_badges',
    enabled: true,
    description: 'Enable achievements and badges',
    environments: ['development', 'staging', 'production'],
  },
  leaderboards: {
    key: 'leaderboards',
    enabled: false,
    description: 'Enable community leaderboards',
    environments: ['development', 'staging'],
    rolloutPercentage: 50,
  },
  social_sharing: {
    key: 'social_sharing',
    enabled: true,
    description: 'Enable social media sharing',
    environments: ['development', 'staging', 'production'],
  },
  user_profiles: {
    key: 'user_profiles',
    enabled: true,
    description: 'Enable public user profiles',
    environments: ['development', 'staging', 'production'],
  },

  // Communication Features
  push_notifications: {
    key: 'push_notifications',
    enabled: true,
    description: 'Enable push notifications',
    environments: ['development', 'staging', 'production'],
  },
  in_app_messaging: {
    key: 'in_app_messaging',
    enabled: true,
    description: 'Enable in-app messaging',
    environments: ['development', 'staging', 'production'],
  },
  email_notifications: {
    key: 'email_notifications',
    enabled: false,
    description: 'Enable email notifications',
    environments: ['staging', 'production'],
    minAppVersion: '1.2.0',
  },
  sms_notifications: {
    key: 'sms_notifications',
    enabled: false,
    description: 'Enable SMS notifications',
    environments: ['development', 'staging'],
    minAppVersion: '1.3.0',
  },
  voice_calls: {
    key: 'voice_calls',
    enabled: false,
    description: 'Enable voice calls within app',
    environments: ['development'],
    minAppVersion: '2.0.0',
  },
  video_calls: {
    key: 'video_calls',
    enabled: false,
    description: 'Enable video calls within app',
    environments: ['development'],
    minAppVersion: '2.0.0',
  },

  // KYC & Verification
  kyc_verification: {
    key: 'kyc_verification',
    enabled: true,
    description: 'Enable KYC verification process',
    environments: ['development', 'staging', 'production'],
  },
  document_upload: {
    key: 'document_upload',
    enabled: true,
    description: 'Enable document upload for KYC',
    environments: ['development', 'staging', 'production'],
  },
  selfie_verification: {
    key: 'selfie_verification',
    enabled: true,
    description: 'Enable selfie verification for KYC',
    environments: ['development', 'staging', 'production'],
  },
  liveness_detection: {
    key: 'liveness_detection',
    enabled: false,
    description: 'Enable liveness detection for selfie verification',
    environments: ['development', 'staging'],
    minAppVersion: '1.4.0',
  },

  // Analytics & Tracking
  analytics_tracking: {
    key: 'analytics_tracking',
    enabled: true,
    description: 'Enable analytics and event tracking',
    environments: ['staging', 'production'],
  },
  crash_reporting: {
    key: 'crash_reporting',
    enabled: true,
    description: 'Enable crash reporting',
    environments: ['staging', 'production'],
  },
  performance_monitoring: {
    key: 'performance_monitoring',
    enabled: true,
    description: 'Enable performance monitoring',
    environments: ['staging', 'production'],
  },
  user_feedback: {
    key: 'user_feedback',
    enabled: true,
    description: 'Enable in-app user feedback',
    environments: ['development', 'staging', 'production'],
  },

  // Admin Features
  dispute_resolution: {
    key: 'dispute_resolution',
    enabled: true,
    description: 'Enable dispute resolution system',
    environments: ['development', 'staging', 'production'],
  },
  user_support_chat: {
    key: 'user_support_chat',
    enabled: false,
    description: 'Enable live chat with support',
    environments: ['development', 'staging'],
    minAppVersion: '1.2.0',
  },
  admin_dashboard: {
    key: 'admin_dashboard',
    enabled: false,
    description: 'Enable admin dashboard access',
    environments: ['development'],
    userSegments: ['admin', 'moderator'],
  },
  user_reporting: {
    key: 'user_reporting',
    enabled: true,
    description: 'Enable user reporting system',
    environments: ['development', 'staging', 'production'],
  },

  // Experimental Features
  dark_mode: {
    key: 'dark_mode',
    enabled: false,
    description: 'Enable dark mode theme',
    environments: ['development'],
    rolloutPercentage: 25,
    minAppVersion: '1.3.0',
  },
  ai_recommendations: {
    key: 'ai_recommendations',
    enabled: false,
    description: 'Enable AI-powered tontine recommendations',
    environments: ['development'],
    rolloutPercentage: 10,
    minAppVersion: '2.0.0',
  },
  voice_commands: {
    key: 'voice_commands',
    enabled: false,
    description: 'Enable voice commands',
    environments: ['development'],
    minAppVersion: '2.0.0',
  },
  nfc_payments: {
    key: 'nfc_payments',
    enabled: false,
    description: 'Enable NFC-based payments',
    environments: ['development'],
    minAppVersion: '2.0.0',
  },
  qr_code_payments: {
    key: 'qr_code_payments',
    enabled: false,
    description: 'Enable QR code payments',
    environments: ['development', 'staging'],
    rolloutPercentage: 50,
    minAppVersion: '1.4.0',
  },
  crypto_payments: {
    key: 'crypto_payments',
    enabled: false,
    description: 'Enable cryptocurrency payments',
    environments: [],
    minAppVersion: '3.0.0',
  },
};

/**
 * Feature Flags Service
 */
class FeatureFlagsService {
  private flags: Record<FeatureFlagKey, FeatureFlag> = FEATURE_FLAGS;
  private remoteFlags: Partial<Record<FeatureFlagKey, boolean>> = {};
  private userId: string | null = null;
  private userSegment: string | null = null;
  private countryCode: string | null = null;

  /**
   * Initialize feature flags
   */
  async initialize(userId?: string, userSegment?: string, countryCode?: string): Promise<void> {
    this.userId = userId || null;
    this.userSegment = userSegment || null;
    this.countryCode = countryCode || null;

    // TODO: Fetch remote flags from backend or Firebase Remote Config
    await this.fetchRemoteFlags();
  }

  /**
   * Fetch remote feature flags
   */
  private async fetchRemoteFlags(): Promise<void> {
    try {
      // TODO: Implement remote config fetching
      // Example with Firebase Remote Config:
      // await remoteConfig().fetchAndActivate();
      // const flags = remoteConfig().getAll();
      // this.remoteFlags = this.parseRemoteFlags(flags);

      console.log('Feature flags fetched from remote config');
    } catch (error) {
      console.error('Failed to fetch remote flags:', error);
      // Fall back to local flags
    }
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(key: FeatureFlagKey): boolean {
    // Check remote flag first
    if (this.remoteFlags[key] !== undefined) {
      return this.remoteFlags[key]!;
    }

    const flag = this.flags[key];

    if (!flag) {
      console.warn(`Feature flag not found: ${key}`);
      return false;
    }

    // Check environment
    const currentEnv = getEnvironment();
    if (flag.environments && !flag.environments.includes(currentEnv)) {
      return false;
    }

    // Check version constraints (TODO: implement version comparison)
    // if (flag.minAppVersion && !this.meetsMinVersion(flag.minAppVersion)) {
    //   return false;
    // }
    // if (flag.maxAppVersion && !this.meetsMaxVersion(flag.maxAppVersion)) {
    //   return false;
    // }

    // Check user segment
    if (flag.userSegments && this.userSegment) {
      if (!flag.userSegments.includes(this.userSegment)) {
        return false;
      }
    }

    // Check country restrictions
    if (flag.countryRestrictions && this.countryCode) {
      if (!flag.countryRestrictions.includes(this.countryCode)) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && this.userId) {
      const hash = this.hashUserId(this.userId, key);
      const userPercentage = hash % 100;
      if (userPercentage >= flag.rolloutPercentage) {
        return false;
      }
    }

    return flag.enabled;
  }

  /**
   * Get all enabled features
   */
  getEnabledFeatures(): FeatureFlagKey[] {
    return Object.keys(this.flags).filter(key =>
      this.isEnabled(key as FeatureFlagKey)
    ) as FeatureFlagKey[];
  }

  /**
   * Get feature flag configuration
   */
  getFlag(key: FeatureFlagKey): FeatureFlag | undefined {
    return this.flags[key];
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): Record<FeatureFlagKey, FeatureFlag> {
    return this.flags;
  }

  /**
   * Override a feature flag (for testing)
   */
  override(key: FeatureFlagKey, enabled: boolean): void {
    if (__DEV__) {
      this.remoteFlags[key] = enabled;
      console.log(`Feature flag overridden: ${key} = ${enabled}`);
    } else {
      console.warn('Feature flag overrides are only allowed in development mode');
    }
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.remoteFlags = {};
    console.log('All feature flag overrides cleared');
  }

  /**
   * Set user context
   */
  setUserContext(userId: string, userSegment?: string, countryCode?: string): void {
    this.userId = userId;
    this.userSegment = userSegment || null;
    this.countryCode = countryCode || null;
  }

  /**
   * Clear user context (on logout)
   */
  clearUserContext(): void {
    this.userId = null;
    this.userSegment = null;
    this.countryCode = null;
  }

  /**
   * Hash user ID for consistent rollout percentage
   */
  private hashUserId(userId: string, key: FeatureFlagKey): number {
    const str = `${userId}-${key}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Refresh feature flags
   */
  async refresh(): Promise<void> {
    await this.fetchRemoteFlags();
  }

  /**
   * Export flags for debugging
   */
  debugExport(): Record<FeatureFlagKey, boolean> {
    const result: Partial<Record<FeatureFlagKey, boolean>> = {};
    Object.keys(this.flags).forEach(key => {
      result[key as FeatureFlagKey] = this.isEnabled(key as FeatureFlagKey);
    });
    return result as Record<FeatureFlagKey, boolean>;
  }
}

// Export singleton instance
export default new FeatureFlagsService();

// Export feature flags for reference
export {FEATURE_FLAGS};
