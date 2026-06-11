module.exports = function (api) {
  api.cache(true);
  return {
    // Expo SDK toolchain (the native android/ is generated via `expo prebuild`).
    // babel-preset-expo bundles the react-native-reanimated plugin automatically,
    // so it must NOT be listed again below (a double-add breaks the build).
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@services': './src/services',
            '@store': './src/store',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@types': './src/types',
            '@theme': './src/theme',
            '@assets': './src/assets',
            '@constants': './src/constants',
          },
        },
      ],
    ],
  };
};
