/**
 * WeDo Theme System
 * Centralized theme configuration — "Kente Vibrant" premium afro-fintech.
 */

import colors, {
  lightColors,
  darkColors,
  schemes,
  palette,
} from './colors';
import typography, {tabularNums, fontFamily, fontWeight, fontSize} from './typography';
import {
  spacing,
  padding,
  borderRadius,
  iconSize,
  avatarSize,
  touchTarget,
  elevation,
  shadows,
  makeGlow,
} from './spacing';
import gradients, {
  lightGradients,
  darkGradients,
  gradientSchemes,
} from './gradients';
import motion, {duration, easing, spring, stagger} from './motion';

export const theme = {
  colors,
  gradients,
  typography,
  spacing,
  padding,
  borderRadius,
  iconSize,
  avatarSize,
  touchTarget,
  elevation,
  shadows,
  motion,
} as const;

export type Theme = typeof theme;

export {
  // colors
  colors,
  lightColors,
  darkColors,
  schemes,
  palette,
  // gradients
  gradients,
  lightGradients,
  darkGradients,
  gradientSchemes,
  // typography
  typography,
  tabularNums,
  fontFamily,
  fontWeight,
  fontSize,
  // spacing & elevation
  spacing,
  padding,
  borderRadius,
  iconSize,
  avatarSize,
  touchTarget,
  elevation,
  shadows,
  makeGlow,
  // motion
  motion,
  duration,
  easing,
  spring,
  stagger,
};

export type {AppColors, ColorScheme} from './colors';
export type {AppGradients, GradientName} from './gradients';

export {AMBIANCES, AMBIANCE_LIST, applyAmbiance} from './ambiances';
export type {AmbianceKey, AmbianceDef, AdinkraKey} from './ambiances';

export {ThemeProvider, useTheme, useThemedStyles} from './ThemeProvider';
export type {ThemeContextValue, ThemedTokens} from './ThemeProvider';

export default theme;
