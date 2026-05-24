/**
 * Configuration Module Exports
 * Central export point for all configuration files
 */

import appConfig from './appConfig';
import featureFlags from './featureFlags';
import constants from './constants';

export * from './appConfig';
export * from './featureFlags';
export * from './constants';
// Disambiguate the name exported by both appConfig and constants.
export {PAYMENT_METHODS} from './appConfig';

export {appConfig, featureFlags, constants};

export default {
  appConfig,
  featureFlags,
  constants,
};
