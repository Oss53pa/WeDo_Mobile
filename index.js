/**
 * Entry point for React Native application
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
// Also register under "main" so Expo (CNG/EAS) prebuilt native projects resolve the root component.
AppRegistry.registerComponent('main', () => App);
