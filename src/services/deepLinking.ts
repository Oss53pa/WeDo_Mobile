/**
 * Deep Linking Service
 * Handle deep links and universal links
 */

import {Linking} from 'react-native';
import {NavigationContainerRef} from '@react-navigation/native';

export type DeepLinkParams = {
  [key: string]: string | undefined;
};

export interface DeepLinkConfig {
  scheme: string;
  prefixes: string[];
  config: {
    screens: {
      [key: string]: string | {path?: string; screens?: any};
    };
  };
}

class DeepLinkingService {
  private navigationRef: NavigationContainerRef<any> | null = null;

  /**
   * Deep link configuration
   */
  private config: DeepLinkConfig = {
    scheme: 'tontinedigital',
    prefixes: ['tontinedigital://', 'https://tontinedigital.app'],
    config: {
      screens: {
        Auth: {
          screens: {
            Login: 'login',
            Register: 'register',
            VerifyOTP: 'verify-otp',
          },
        },
        Main: {
          screens: {
            Home: 'home',
            Tontines: {
              screens: {
                TontinesList: 'tontines',
                TontineDetail: 'tontines/:tontineId',
              },
            },
            Profile: 'profile',
            Notifications: 'notifications',
          },
        },
        TontineDetail: 'tontines/:tontineId',
        CreateTontine: 'tontines/create',
        PaymentFlow: 'payments/:contributionId',
        Chat: 'chat/:tontineId',
        VoteDetail: 'votes/:voteId',
        Settings: 'settings',
        EditProfile: 'profile/edit',
      },
    },
  };

  /**
   * Initialize deep linking
   */
  async initialize(navigationRef: NavigationContainerRef<any>): Promise<void> {
    this.navigationRef = navigationRef;

    // Handle initial URL (when app is opened from a deep link)
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      this.handleDeepLink(initialUrl);
    }

    // Listen for deep links when app is running
    Linking.addEventListener('url', ({url}) => {
      this.handleDeepLink(url);
    });
  }

  /**
   * Get deep link configuration for React Navigation
   */
  getLinkingConfig() {
    return {
      prefixes: this.config.prefixes,
      config: this.config.config,
    };
  }

  /**
   * Handle incoming deep link
   */
  private async handleDeepLink(url: string): Promise<void> {
    try {
      console.log('Deep link received:', url);

      const route = this.parseDeepLink(url);
      if (!route) {
        console.warn('Could not parse deep link:', url);
        return;
      }

      // Wait for navigation to be ready
      if (!this.navigationRef?.isReady()) {
        setTimeout(() => this.handleDeepLink(url), 100);
        return;
      }

      // Navigate to the route
      this.navigate(route.screen, route.params);
    } catch (error) {
      console.error('Deep link handling error:', error);
    }
  }

  /**
   * Parse deep link URL to extract screen and params
   */
  private parseDeepLink(url: string): {screen: string; params?: DeepLinkParams} | null {
    try {
      // Remove scheme and prefix
      let path = url;
      this.config.prefixes.forEach(prefix => {
        path = path.replace(prefix, '');
      });

      // Remove leading slash
      path = path.replace(/^\//, '');

      // Parse path and query params
      const [pathname, queryString] = path.split('?');
      const pathParts = pathname.split('/');

      // Extract query parameters
      const params: DeepLinkParams = {};
      if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        searchParams.forEach((value, key) => {
          params[key] = value;
        });
      }

      // Route matching
      if (pathParts[0] === 'tontines') {
        if (pathParts[1] === 'create') {
          return {screen: 'CreateTontine'};
        } else if (pathParts[1]) {
          return {screen: 'TontineDetail', params: {tontineId: pathParts[1]}};
        }
        return {screen: 'TontinesList'};
      }

      if (pathParts[0] === 'payments' && pathParts[1]) {
        return {screen: 'PaymentFlow', params: {contributionId: pathParts[1]}};
      }

      if (pathParts[0] === 'chat' && pathParts[1]) {
        return {screen: 'Chat', params: {tontineId: pathParts[1]}};
      }

      if (pathParts[0] === 'votes' && pathParts[1]) {
        return {screen: 'VoteDetail', params: {voteId: pathParts[1]}};
      }

      if (pathParts[0] === 'profile') {
        if (pathParts[1] === 'edit') {
          return {screen: 'EditProfile'};
        }
        return {screen: 'Profile'};
      }

      if (pathParts[0] === 'notifications') {
        return {screen: 'Notifications'};
      }

      if (pathParts[0] === 'settings') {
        return {screen: 'Settings'};
      }

      if (pathParts[0] === 'login') {
        return {screen: 'Login'};
      }

      if (pathParts[0] === 'register') {
        return {screen: 'Register'};
      }

      // Default to home
      return {screen: 'Home'};
    } catch (error) {
      console.error('Parse deep link error:', error);
      return null;
    }
  }

  /**
   * Navigate to a screen
   */
  private navigate(screen: string, params?: DeepLinkParams): void {
    if (!this.navigationRef) {
      console.warn('Navigation ref not set');
      return;
    }

    try {
      this.navigationRef.navigate(screen as any, params);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  /**
   * Generate deep link URL
   */
  generateDeepLink(screen: string, params?: DeepLinkParams): string {
    const baseUrl = this.config.prefixes[0];

    let path = '';
    switch (screen) {
      case 'TontineDetail':
        path = `tontines/${params?.tontineId}`;
        break;
      case 'CreateTontine':
        path = 'tontines/create';
        break;
      case 'PaymentFlow':
        path = `payments/${params?.contributionId}`;
        break;
      case 'Chat':
        path = `chat/${params?.tontineId}`;
        break;
      case 'VoteDetail':
        path = `votes/${params?.voteId}`;
        break;
      case 'Profile':
        path = 'profile';
        break;
      case 'EditProfile':
        path = 'profile/edit';
        break;
      case 'Notifications':
        path = 'notifications';
        break;
      case 'Settings':
        path = 'settings';
        break;
      case 'Login':
        path = 'login';
        break;
      case 'Register':
        path = 'register';
        break;
      default:
        path = 'home';
    }

    // Add query parameters
    if (params) {
      const filteredParams = Object.entries(params).filter(
        ([key]) => !['tontineId', 'contributionId', 'voteId'].includes(key)
      );
      if (filteredParams.length > 0) {
        const queryString = new URLSearchParams(
          Object.fromEntries(
            filteredParams.filter(([, v]) => v != null) as [string, string][],
          ),
        ).toString();
        path += `?${queryString}`;
      }
    }

    return `${baseUrl}${path}`;
  }

  /**
   * Share deep link
   */
  async shareDeepLink(screen: string, params?: DeepLinkParams): Promise<void> {
    const url = this.generateDeepLink(screen, params);

    try {
      // TODO: Use Share API
      /*
      import {Share} from 'react-native';
      await Share.share({
        message: url,
        url: url,
      });
      */
      console.log('Share deep link:', url);
    } catch (error) {
      console.error('Share deep link error:', error);
    }
  }

  /**
   * Open external URL
   */
  async openURL(url: string): Promise<boolean> {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        console.warn('Cannot open URL:', url);
        return false;
      }
    } catch (error) {
      console.error('Open URL error:', error);
      return false;
    }
  }

  /**
   * Open settings
   */
  async openSettings(): Promise<void> {
    await Linking.openSettings();
  }

  /**
   * Generate invite link for tontine
   */
  generateTontineInviteLink(tontineId: string, inviterName: string): string {
    return this.generateDeepLink('TontineDetail', {
      tontineId,
      inviter: inviterName,
      action: 'join',
    });
  }

  /**
   * Generate referral link
   */
  generateReferralLink(userId: string, userName: string): string {
    return this.generateDeepLink('Register', {
      ref: userId,
      inviter: userName,
    });
  }
}

// Export singleton instance
export default new DeepLinkingService();
