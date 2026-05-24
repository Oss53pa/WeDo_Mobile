/**
 * Biometric Authentication Utility
 * Handle fingerprint and Face ID authentication
 */

import {Platform, Alert} from 'react-native';
// import ReactNativeBiometrics, {BiometryTypes} from 'react-native-biometrics';

export type BiometricType = 'TouchID' | 'FaceID' | 'Biometrics' | null;

export interface BiometricResult {
  success: boolean;
  error?: string;
  signature?: string;
}

class BiometricAuth {
  // private rnBiometrics: ReactNativeBiometrics;

  constructor() {
    // this.rnBiometrics = new ReactNativeBiometrics();
  }

  /**
   * Check if biometric hardware is available
   */
  async isSensorAvailable(): Promise<{
    available: boolean;
    biometryType: BiometricType;
  }> {
    try {
      // TODO: Uncomment when react-native-biometrics is installed
      /*
      const {available, biometryType} = await this.rnBiometrics.isSensorAvailable();

      let type: BiometricType = null;
      if (available) {
        if (biometryType === BiometryTypes.TouchID) {
          type = 'TouchID';
        } else if (biometryType === BiometryTypes.FaceID) {
          type = 'FaceID';
        } else if (biometryType === BiometryTypes.Biometrics) {
          type = 'Biometrics';
        }
      }

      return {available, biometryType: type};
      */

      // Placeholder response
      return {
        available: true,
        biometryType: Platform.OS === 'ios' ? 'FaceID' : 'Biometrics',
      };
    } catch (error) {
      console.error('Biometric sensor check error:', error);
      return {available: false, biometryType: null};
    }
  }

  /**
   * Get user-friendly name for biometric type
   */
  getBiometricTypeName(type: BiometricType): string {
    switch (type) {
      case 'TouchID':
        return 'Touch ID';
      case 'FaceID':
        return 'Face ID';
      case 'Biometrics':
        return 'Empreinte digitale';
      default:
        return 'Biométrie';
    }
  }

  /**
   * Prompt user for biometric authentication
   */
  async authenticate(promptMessage?: string): Promise<BiometricResult> {
    try {
      const {available, biometryType} = await this.isSensorAvailable();

      if (!available) {
        return {
          success: false,
          error: 'Authentification biométrique non disponible sur cet appareil',
        };
      }

      const message =
        promptMessage ||
        `Authentifiez-vous avec ${this.getBiometricTypeName(biometryType)}`;

      // TODO: Uncomment when react-native-biometrics is installed
      /*
      const {success, error} = await this.rnBiometrics.simplePrompt({
        promptMessage: message,
        cancelButtonText: 'Annuler',
      });

      if (success) {
        return {success: true};
      }

      return {
        success: false,
        error: error || 'Authentification échouée',
      };
      */

      // Placeholder response
      console.log('Biometric authentication prompted:', message);
      return {success: true};
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: error.message || 'Une erreur est survenue',
      };
    }
  }

  /**
   * Create biometric signature (for secure transactions)
   */
  async createSignature(
    payload: string,
    promptMessage?: string
  ): Promise<BiometricResult> {
    try {
      const {available} = await this.isSensorAvailable();

      if (!available) {
        return {
          success: false,
          error: 'Authentification biométrique non disponible',
        };
      }

      // TODO: Uncomment when react-native-biometrics is installed
      /*
      const {success, signature, error} = await this.rnBiometrics.createSignature({
        promptMessage: promptMessage || 'Signez avec votre biométrie',
        payload,
        cancelButtonText: 'Annuler',
      });

      if (success && signature) {
        return {success: true, signature};
      }

      return {
        success: false,
        error: error || 'Signature échouée',
      };
      */

      // Placeholder response
      console.log('Biometric signature created for payload:', payload);
      return {success: true, signature: 'mock_signature'};
    } catch (error: any) {
      console.error('Biometric signature error:', error);
      return {
        success: false,
        error: error.message || 'Une erreur est survenue',
      };
    }
  }

  /**
   * Create encryption keys
   */
  async createKeys(): Promise<{success: boolean; publicKey?: string}> {
    try {
      // TODO: Uncomment when react-native-biometrics is installed
      /*
      const {publicKey} = await this.rnBiometrics.createKeys();
      return {success: true, publicKey};
      */

      // Placeholder response
      console.log('Biometric keys created');
      return {success: true, publicKey: 'mock_public_key'};
    } catch (error: any) {
      console.error('Create keys error:', error);
      return {success: false};
    }
  }

  /**
   * Delete encryption keys
   */
  async deleteKeys(): Promise<{success: boolean}> {
    try {
      // TODO: Uncomment when react-native-biometrics is installed
      /*
      const {keysDeleted} = await this.rnBiometrics.deleteKeys();
      return {success: keysDeleted};
      */

      // Placeholder response
      console.log('Biometric keys deleted');
      return {success: true};
    } catch (error: any) {
      console.error('Delete keys error:', error);
      return {success: false};
    }
  }

  /**
   * Check if biometric keys exist
   */
  async biometricKeysExist(): Promise<{exist: boolean; publicKey?: string}> {
    // TODO: Uncomment when react-native-biometrics is installed
    // const {keysExist, publicKey} = await this.rnBiometrics.biometricKeysExist();
    // return {exist: keysExist, publicKey};

    // Placeholder response
    return {exist: true, publicKey: 'mock_public_key'};
  }

  /**
   * Setup biometric authentication for user
   */
  async setupBiometric(): Promise<{success: boolean; error?: string}> {
    try {
      const {available, biometryType} = await this.isSensorAvailable();

      if (!available) {
        Alert.alert(
          'Non disponible',
          'L\'authentification biométrique n\'est pas disponible sur cet appareil.'
        );
        return {success: false, error: 'Not available'};
      }

      // Show confirmation dialog
      return new Promise(resolve => {
        Alert.alert(
          'Activer la biométrie',
          `Voulez-vous activer ${this.getBiometricTypeName(
            biometryType
          )} pour vous connecter plus rapidement ?`,
          [
            {
              text: 'Non',
              style: 'cancel',
              onPress: () => resolve({success: false}),
            },
            {
              text: 'Oui',
              onPress: async () => {
                const result = await this.authenticate(
                  'Authentifiez-vous pour activer'
                );
                if (result.success) {
                  // Create keys for future use
                  await this.createKeys();
                  resolve({success: true});
                } else {
                  resolve({success: false, error: result.error});
                }
              },
            },
          ]
        );
      });
    } catch (error: any) {
      return {success: false, error: error.message};
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<{success: boolean}> {
    try {
      await this.deleteKeys();
      return {success: true};
    } catch (error) {
      console.error('Disable biometric error:', error);
      return {success: false};
    }
  }

  /**
   * Login with biometric
   */
  async loginWithBiometric(): Promise<BiometricResult> {
    try {
      const {exist} = await this.biometricKeysExist();

      if (!exist) {
        return {
          success: false,
          error: 'Authentification biométrique non configurée',
        };
      }

      const result = await this.authenticate('Authentifiez-vous pour vous connecter');

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Authentification échouée',
      };
    }
  }

  /**
   * Verify transaction with biometric
   */
  async verifyTransaction(amount: number, currency: string): Promise<BiometricResult> {
    try {
      const message = `Confirmez la transaction de ${amount} ${currency}`;
      const payload = JSON.stringify({amount, currency, timestamp: Date.now()});

      return await this.createSignature(payload, message);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Vérification échouée',
      };
    }
  }
}

// Export singleton instance
export default new BiometricAuth();
