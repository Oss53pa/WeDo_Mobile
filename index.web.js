/**
 * Web entry point for TontineDigital
 * Uses react-native-web for browser rendering
 */

import {AppRegistry} from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('TontineDigital', () => App);

// Run the app in the browser
AppRegistry.runApplication('TontineDigital', {
  rootTag: document.getElementById('root'),
});
