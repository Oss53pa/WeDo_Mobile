const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const appDirectory = path.resolve(__dirname);

const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  include: [
    path.resolve(appDirectory, 'index.web.js'),
    path.resolve(appDirectory, 'App.tsx'),
    path.resolve(appDirectory, 'src'),
    path.resolve(appDirectory, 'node_modules/@react-navigation'),
    path.resolve(appDirectory, 'node_modules/react-native-web'),
    path.resolve(appDirectory, 'node_modules/react-native-vector-icons'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      cacheCompression: false,
      presets: [
        ['@babel/preset-env', { modules: false, loose: true }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
      plugins: [
        ['module-resolver', {
          root: ['./src'],
          extensions: ['.web.js', '.web.tsx', '.js', '.ts', '.tsx', '.json'],
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
            '@config': './src/config',
          },
        }],
      ],
    },
  },
};

const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  type: 'asset',
};

const fontLoaderConfiguration = {
  test: /\.(woff|woff2|eot|ttf|otf)$/,
  type: 'asset/resource',
};

const jsonLoaderConfiguration = {
  test: /\.json$/,
  type: 'json',
};

module.exports = {
  mode: 'development',
  entry: path.resolve(appDirectory, 'index.web.js'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(appDirectory, 'dist'),
    publicPath: '/',
  },
  devtool: 'eval-cheap-module-source-map',
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native-svg': 'react-native-svg-web',
      'react-native-linear-gradient': 'react-native-web-linear-gradient',
      'react-native-vector-icons/MaterialCommunityIcons': path.resolve(appDirectory, 'src/mocks/vector-icons.js'),
      'react-native-vector-icons': path.resolve(appDirectory, 'src/mocks/vector-icons.js'),
      'react-native-gesture-handler': path.resolve(appDirectory, 'src/mocks/gesture-handler.js'),
      'react-native-reanimated': path.resolve(appDirectory, 'src/mocks/reanimated.js'),
      'react-native-screens': path.resolve(appDirectory, 'src/mocks/screens.js'),
      '@react-native-firebase/app': path.resolve(appDirectory, 'src/mocks/firebase.js'),
      '@react-native-firebase/messaging': path.resolve(appDirectory, 'src/mocks/firebase.js'),
      'react-native-keychain': path.resolve(appDirectory, 'src/mocks/keychain.js'),
      'react-native-biometrics': path.resolve(appDirectory, 'src/mocks/biometrics.js'),
      'react-native-config': path.resolve(appDirectory, 'src/mocks/config.js'),
      'react-native-fast-image': path.resolve(appDirectory, 'src/mocks/fast-image.js'),
      '@': path.resolve(appDirectory, 'src'),
      '@components': path.resolve(appDirectory, 'src/components'),
      '@screens': path.resolve(appDirectory, 'src/screens'),
      '@navigation': path.resolve(appDirectory, 'src/navigation'),
      '@services': path.resolve(appDirectory, 'src/services'),
      '@store': path.resolve(appDirectory, 'src/store'),
      '@hooks': path.resolve(appDirectory, 'src/hooks'),
      '@utils': path.resolve(appDirectory, 'src/utils'),
      '@types': path.resolve(appDirectory, 'src/types'),
      '@theme': path.resolve(appDirectory, 'src/theme'),
      '@assets': path.resolve(appDirectory, 'src/assets'),
      '@constants': path.resolve(appDirectory, 'src/constants'),
      '@config': path.resolve(appDirectory, 'src/config'),
    },
  },
  module: {
    rules: [
      babelLoaderConfiguration,
      imageLoaderConfiguration,
      fontLoaderConfiguration,
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(appDirectory, 'public/index.html'),
    }),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(true),
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
  ],
  devServer: {
    static: {
      directory: path.join(appDirectory, 'public'),
    },
    compress: true,
    port: 5555,
    host: '0.0.0.0', // reachable from a phone on the same Wi‑Fi
    allowedHosts: 'all',
    hot: true,
    historyApiFallback: true,
    client: {
      overlay: false,
    },
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
};
