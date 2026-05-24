/**
 * Analytics Service
 * Track user events, screen views, and errors for analytics
 */

// import analytics from '@react-native-firebase/analytics';
// import crashlytics from '@react-native-firebase/crashlytics';

interface EventParams {
  [key: string]: string | number | boolean;
}

interface UserProperties {
  userId?: string;
  userType?: string;
  reputationLevel?: string;
  kycLevel?: number;
  [key: string]: any;
}

class AnalyticsService {
  private isEnabled: boolean = true;

  /**
   * Initialize analytics
   */
  async initialize(): Promise<void> {
    try {
      // TODO: Initialize Firebase Analytics
      // await analytics().setAnalyticsCollectionEnabled(true);
      console.log('Analytics initialized');
    } catch (error) {
      console.error('Analytics initialization error:', error);
    }
  }

  /**
   * Enable/disable analytics collection
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    // analytics().setAnalyticsCollectionEnabled(enabled);
  }

  /**
   * Track screen view
   */
  async trackScreenView(screenName: string, screenClass?: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // await analytics().logScreenView({
      //   screen_name: screenName,
      //   screen_class: screenClass || screenName,
      // });

      console.log(`Screen view tracked: ${screenName}`);
    } catch (error) {
      console.error('Track screen view error:', error);
    }
  }

  /**
   * Track custom event
   */
  async trackEvent(eventName: string, params?: EventParams): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // await analytics().logEvent(eventName, params);
      console.log(`Event tracked: ${eventName}`, params);
    } catch (error) {
      console.error('Track event error:', error);
    }
  }

  /**
   * Track user login
   */
  async trackLogin(method: string = 'phone'): Promise<void> {
    await this.trackEvent('login', {method});
  }

  /**
   * Track user registration
   */
  async trackSignUp(method: string = 'phone'): Promise<void> {
    await this.trackEvent('sign_up', {method});
  }

  /**
   * Track tontine creation
   */
  async trackTontineCreated(tontineId: string, category: string, type: string): Promise<void> {
    await this.trackEvent('tontine_created', {
      tontine_id: tontineId,
      category,
      type,
    });
  }

  /**
   * Track tontine join
   */
  async trackTontineJoined(tontineId: string, category: string): Promise<void> {
    await this.trackEvent('tontine_joined', {
      tontine_id: tontineId,
      category,
    });
  }

  /**
   * Track contribution made
   */
  async trackContribution(
    tontineId: string,
    amount: number,
    paymentMethod: string
  ): Promise<void> {
    await this.trackEvent('contribution_made', {
      tontine_id: tontineId,
      amount,
      payment_method: paymentMethod,
    });
  }

  /**
   * Track payment initiated
   */
  async trackPaymentInitiated(
    amount: number,
    currency: string,
    method: string
  ): Promise<void> {
    await this.trackEvent('payment_initiated', {
      amount,
      currency,
      method,
    });
  }

  /**
   * Track payment completed
   */
  async trackPaymentCompleted(
    amount: number,
    currency: string,
    method: string
  ): Promise<void> {
    await this.trackEvent('payment_completed', {
      amount,
      currency,
      method,
    });
  }

  /**
   * Track payment failed
   */
  async trackPaymentFailed(
    amount: number,
    currency: string,
    method: string,
    reason: string
  ): Promise<void> {
    await this.trackEvent('payment_failed', {
      amount,
      currency,
      method,
      reason,
    });
  }

  /**
   * Track search
   */
  async trackSearch(searchTerm: string, category?: string): Promise<void> {
    await this.trackEvent('search', {
      search_term: searchTerm,
      category: category || 'all',
    });
  }

  /**
   * Track share
   */
  async trackShare(contentType: string, contentId: string): Promise<void> {
    await this.trackEvent('share', {
      content_type: contentType,
      content_id: contentId,
    });
  }

  /**
   * Track notification opened
   */
  async trackNotificationOpened(notificationType: string): Promise<void> {
    await this.trackEvent('notification_opened', {
      notification_type: notificationType,
    });
  }

  /**
   * Set user ID
   */
  async setUserId(userId: string): Promise<void> {
    try {
      // await analytics().setUserId(userId);
      // await crashlytics().setUserId(userId);
      console.log(`User ID set: ${userId}`);
    } catch (error) {
      console.error('Set user ID error:', error);
    }
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: UserProperties): Promise<void> {
    try {
      // await analytics().setUserProperties(properties);
      console.log('User properties set:', properties);
    } catch (error) {
      console.error('Set user properties error:', error);
    }
  }

  /**
   * Clear user data (on logout)
   */
  async clearUserData(): Promise<void> {
    try {
      // await analytics().resetAnalyticsData();
      // await crashlytics().setUserId('');
      console.log('User data cleared');
    } catch (error) {
      console.error('Clear user data error:', error);
    }
  }

  /**
   * Track error (non-fatal)
   */
  async trackError(error: Error, context?: string): Promise<void> {
    try {
      // await crashlytics().recordError(error);
      console.error('Error tracked:', error, context);

      await this.trackEvent('error', {
        error_message: error.message,
        context: context || 'unknown',
      });
    } catch (err) {
      console.error('Track error failed:', err);
    }
  }

  /**
   * Set custom log
   */
  async log(message: string): Promise<void> {
    try {
      // await crashlytics().log(message);
      console.log(`Analytics log: ${message}`);
    } catch (error) {
      console.error('Log error:', error);
    }
  }

  /**
   * Track app open
   */
  async trackAppOpen(): Promise<void> {
    await this.trackEvent('app_open');
  }

  /**
   * Track app background
   */
  async trackAppBackground(): Promise<void> {
    await this.trackEvent('app_background');
  }

  /**
   * Track tutorial begin
   */
  async trackTutorialBegin(): Promise<void> {
    await this.trackEvent('tutorial_begin');
  }

  /**
   * Track tutorial complete
   */
  async trackTutorialComplete(): Promise<void> {
    await this.trackEvent('tutorial_complete');
  }

  /**
   * Track level up (reputation)
   */
  async trackLevelUp(level: string, score: number): Promise<void> {
    await this.trackEvent('level_up', {
      level,
      score,
    });
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsed(featureName: string): Promise<void> {
    await this.trackEvent('feature_used', {
      feature_name: featureName,
    });
  }

  /**
   * Track settings changed
   */
  async trackSettingsChanged(setting: string, value: string | boolean): Promise<void> {
    await this.trackEvent('settings_changed', {
      setting,
      value: String(value),
    });
  }

  /**
   * Track referral
   */
  async trackReferral(referralCode: string): Promise<void> {
    await this.trackEvent('referral', {
      referral_code: referralCode,
    });
  }

  /**
   * Track conversion
   */
  async trackConversion(conversionType: string, value?: number): Promise<void> {
    await this.trackEvent('conversion', {
      conversion_type: conversionType,
      value: value || 0,
    });
  }
}

// Export singleton instance
export default new AnalyticsService();
