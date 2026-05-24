/**
 * React Native CLI config.
 * - Links custom fonts (Dosis + Grand Hotel) into the native projects when you
 *   run `npx react-native-asset`. Drop the .ttf files in ./assets/fonts first.
 */
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts'],
};
