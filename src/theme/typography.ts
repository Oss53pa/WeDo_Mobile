/**
 * TontineDigital Typography System
 * Based on Material Design 3 and design specifications
 */

import {Platform, TextStyle} from 'react-native';

// Font Families — Grand Hotel for the brand title, Dosis for everything else.
const DOSIS_WEB = "'Dosis', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
export const fontFamily = {
  // Brand font for WeDo logo/title only — native name must match the bundled
  // file assets/fonts/GrandHotel-Regular.ttf (Android matches by filename,
  // iOS by PostScript name).
  brand: Platform.select({web: "'Grand Hotel', cursive", default: 'GrandHotel-Regular'}),
  // Main app font - Dosis (weights handled via fontWeight on web)
  regular: Platform.select({
    ios: 'Dosis',
    android: 'Dosis',
    web: DOSIS_WEB,
    default: 'Dosis',
  }),
  medium: Platform.select({
    ios: 'Dosis',
    android: 'Dosis-Medium',
    web: DOSIS_WEB,
    default: 'Dosis',
  }),
  semiBold: Platform.select({
    ios: 'Dosis',
    android: 'Dosis-SemiBold',
    web: DOSIS_WEB,
    default: 'Dosis',
  }),
  bold: Platform.select({
    ios: 'Dosis',
    android: 'Dosis-Bold',
    web: DOSIS_WEB,
    default: 'Dosis',
  }),
} as const;

// Font Weights
export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semiBold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
} as const;

// Font Sizes (in sp)
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 32,
  '4xl': 36,
  '5xl': 44,
  '6xl': 54,
  '7xl': 64,
} as const;

// Line Heights
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
} as const;

// Tabular figures — keeps money/numbers from shifting width
export const tabularNums = {
  fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
};

// Typography Variants (selon le cahier des charges)
export const typography = {
  // Display — hero numbers & splash headlines
  displayLarge: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: fontSize['7xl'], // 64
    lineHeight: fontSize['7xl'] * 1.02,
    letterSpacing: -1.5,
    ...tabularNums,
  },
  display: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: fontSize['6xl'], // 54
    lineHeight: fontSize['6xl'] * 1.04,
    letterSpacing: -1.2,
    ...tabularNums,
  },
  displaySmall: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: fontSize['5xl'], // 44
    lineHeight: fontSize['5xl'] * 1.06,
    letterSpacing: -1,
    ...tabularNums,
  },
  // Money figure (heavy, tabular)
  amount: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: fontSize['4xl'], // 36
    lineHeight: fontSize['4xl'] * 1.1,
    letterSpacing: -0.8,
    ...tabularNums,
  },
  // Headers
  h1: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: fontSize['2xl'], // 28sp
    lineHeight: fontSize['2xl'] * lineHeight.tight,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeight.semiBold,
    fontSize: fontSize.xl, // 22sp
    lineHeight: fontSize.xl * lineHeight.tight,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.lg, // 18sp
    lineHeight: fontSize.lg * lineHeight.normal,
    letterSpacing: -0.2,
  },

  // Body Text
  body: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    fontSize: fontSize.base, // 16sp
    lineHeight: fontSize.base * lineHeight.normal,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.base, // 16sp
    lineHeight: fontSize.base * lineHeight.normal,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    fontSize: fontSize.lg, // 18sp
    lineHeight: fontSize.lg * lineHeight.normal,
    letterSpacing: 0,
  },

  // Caption/Small Text
  caption: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    fontSize: fontSize.sm, // 14sp
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: 0.2,
  },
  captionMedium: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm, // 14sp
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: 0.2,
  },
  small: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    fontSize: fontSize.xs, // 12sp
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: 0.3,
  },

  // Button Text
  button: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeight.semiBold,
    fontSize: fontSize.base, // 16sp
    lineHeight: fontSize.base * lineHeight.tight,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
  buttonSmall: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeight.semiBold,
    fontSize: fontSize.sm, // 14sp
    lineHeight: fontSize.sm * lineHeight.tight,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },

  // Special
  label: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm, // 14sp
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: 0.3,
  },
  overline: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs, // 12sp
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: 1,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
} as const;

export type Typography = typeof typography;
export type TypographyVariant = keyof Typography;

export default typography;
