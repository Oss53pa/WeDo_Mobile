/**
 * TontineDigital Spacing System
 * Based on 8px grid system for consistent spacing
 */

const BASE_SPACING = 8;

export const spacing = {
  xs: BASE_SPACING * 0.5, // 4px
  sm: BASE_SPACING, // 8px
  md: BASE_SPACING * 2, // 16px
  lg: BASE_SPACING * 3, // 24px
  xl: BASE_SPACING * 4, // 32px
  '2xl': BASE_SPACING * 5, // 40px
  '3xl': BASE_SPACING * 6, // 48px
  '4xl': BASE_SPACING * 8, // 64px
  '5xl': BASE_SPACING * 10, // 80px
} as const;

// Common padding/margin values
export const padding = {
  screen: spacing.md, // 16px - Standard screen padding
  card: spacing.md, // 16px - Card padding
  button: spacing.md, // 16px - Button padding
  input: spacing.md, // 16px - Input padding
  section: spacing.lg, // 24px - Section spacing
} as const;

// Border Radius
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999, // For circular elements
} as const;

// Icon Sizes
export const iconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  '2xl': 48,
  '3xl': 64,
} as const;

// Avatar Sizes
export const avatarSize = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  '2xl': 120,
} as const;

// Touch Target Size (minimum 48x48dp for accessibility)
export const touchTarget = {
  minimum: 48,
  comfortable: 56,
} as const;

// Elevation/Shadow Depths
export const elevation = {
  0: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  1: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  2: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  3: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  4: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  5: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  8: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
} as const;

// Premium soft shadows (large radius, low opacity).
// Pass a themed shadow color via `shadowColor` when consuming.
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#2A1D12',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#2A1D12',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  md: {
    shadowColor: '#2A1D12',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  lg: {
    shadowColor: '#2A1D12',
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 12,
  },
  xl: {
    shadowColor: '#2A1D12',
    shadowOffset: {width: 0, height: 22},
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 20,
  },
} as const;

/** Colored glow used under brand CTAs / hero cards. */
export const makeGlow = (color: string, intensity = 0.35) => ({
  shadowColor: color,
  shadowOffset: {width: 0, height: 10},
  shadowOpacity: intensity,
  shadowRadius: 24,
  elevation: 10,
});

export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;

export default {
  spacing,
  padding,
  borderRadius,
  iconSize,
  avatarSize,
  touchTarget,
  elevation,
};
