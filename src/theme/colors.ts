/**
 * WeDo Color System — "Kente Héritage" premium afro-fintech
 * ----------------------------------------------------------
 * Sober luxury: a warm neutral base (espresso ink + cream) with the four
 * Kente accents desaturated to earth tones (ochre gold, soft terracotta,
 * forest emerald, bordeaux) and a muted night indigo. Light + dark schemes
 * share the same semantic shape so any `theme.colors.x` reference works in both.
 *
 * Legacy keys (primary/secondary/accent/neutral/background/text/...) are kept
 * so existing imports of `colors` keep resolving while screens migrate to the
 * richer semantic tokens (brand/bg/surface/border/status).
 */

// ============================================================
// RAW PALETTE — Kente brand hues (scheme-independent reference)
// ============================================================
export const palette = {
  // Kente gold — prosperity (muted ochre, premium restraint)
  gold: '#D4A03C',
  goldLight: '#E6C172',
  goldDark: '#9E7320',

  // Terracotta — heritage anchor (softened earth tone)
  terracotta: '#C2683C',
  terracottaLight: '#D98D63',
  terracottaDark: '#9C4E26',

  // Emerald — growth / trust (deep forest)
  emerald: '#1F7A58',
  emeraldLight: '#4FA382',
  emeraldDark: '#155640',

  // Crimson — energy / alerts (toward bordeaux)
  crimson: '#B23A4E',
  crimsonLight: '#CD6376',
  crimsonDark: '#832435',

  // Royal indigo — depth / premium (desaturated night blue)
  indigo: '#3A3E7C',
  indigoLight: '#666BB3',
  indigoDark: '#252856',

  // Warm neutrals (espresso ink → cream)
  ink900: '#1A1410',
  ink800: '#241C16',
  ink700: '#3A2F27',
  ink600: '#574A40',
  ink500: '#7A6B5E',
  ink400: '#9C8E81',
  ink300: '#C2B6A8',
  ink200: '#E2D9CC',
  ink100: '#F1EADD',
  cream: '#FBF6EC',
  creamDeep: '#F4ECDD',
  white: '#FFFFFF',
} as const;

// ============================================================
// SHARED — vibrant accents stay vivid across both schemes
// ============================================================
const sharedReputation = {
  bronze: '#B08D57',
  silver: '#A8A6B0',
  gold: palette.gold,
  platinum: '#7FB7C9',
  diamond: palette.indigoLight,
} as const;

// ============================================================
// LIGHT SCHEME
// ============================================================
export const lightColors = {
  // --- brand accents (the Kente band) ---
  brand: {
    gold: palette.gold,
    goldSoft: '#F5EBD3',
    terracotta: palette.terracotta,
    terracottaSoft: '#F4E4D8',
    emerald: palette.emerald,
    emeraldSoft: '#DCEBE3',
    crimson: palette.crimson,
    crimsonSoft: '#F3E0E3',
    indigo: palette.indigo,
    indigoSoft: '#E2E3EF',
  },

  // --- primary action (warm espresso) ---
  primary: {
    main: palette.ink800,
    light: palette.ink600,
    dark: palette.ink900,
    contrast: palette.cream,
    50: '#F6F2EC',
    100: palette.ink100,
    200: palette.ink200,
    300: palette.ink300,
    400: palette.ink400,
    500: palette.ink500,
    600: palette.ink600,
    700: palette.ink700,
    800: palette.ink800,
    900: palette.ink900,
  },

  // --- accent (terracotta heritage) ---
  accent: {
    main: palette.terracotta,
    orange: palette.terracotta,
    light: palette.terracottaLight,
    dark: palette.terracottaDark,
    contrast: palette.white,
    50: '#FAF1EA',
    100: '#F4E4D8',
    200: '#EACDB9',
    300: '#E2B294',
    400: palette.terracottaLight,
    500: palette.terracotta,
    600: palette.terracottaDark,
    700: '#7E3E1E',
    800: '#643017',
    900: '#46210F',
  },

  // --- secondary (warm surfaces) ---
  secondary: {
    main: palette.creamDeep,
    light: palette.cream,
    dark: palette.ink200,
    50: palette.white,
    100: palette.cream,
    200: palette.creamDeep,
    300: palette.ink100,
    400: palette.ink200,
    500: palette.ink300,
    600: palette.ink400,
    700: palette.ink500,
    800: palette.ink600,
    900: palette.ink800,
  },

  // --- neutrals ---
  neutral: {
    black: palette.ink900,
    gray: palette.ink500,
    lightGray: palette.creamDeep,
    white: palette.white,
    50: '#FCF9F4',
    100: palette.cream,
    200: palette.creamDeep,
    300: palette.ink200,
    400: palette.ink300,
    500: palette.ink400,
    600: palette.ink500,
    700: palette.ink600,
    800: palette.ink700,
    900: palette.ink900,
  },

  reputation: sharedReputation,

  // --- functional ---
  success: palette.emerald,
  error: palette.crimson,
  warning: palette.gold,
  info: palette.indigo,

  // --- background layers ---
  bg: {
    base: palette.cream,
    subtle: palette.creamDeep,
    elevated: palette.white,
    sunken: '#EFE6D6',
    inverse: palette.ink900,
  },

  // --- surfaces / cards / glass ---
  surface: {
    default: palette.white,
    raised: palette.white,
    sunken: palette.cream,
    glass: 'rgba(255,255,255,0.62)',
    glassBorder: 'rgba(255,255,255,0.7)',
    onBrand: 'rgba(255,255,255,0.16)',
    onBrandBorder: 'rgba(255,255,255,0.24)',
  },

  // legacy card alias
  card: {
    background: palette.white,
    elevated: palette.white,
    shadow: 'rgba(36,28,22,0.06)',
    border: palette.ink200,
  },

  // --- borders ---
  border: {
    subtle: '#EFE6D7',
    default: palette.ink200,
    strong: palette.ink300,
  },

  // --- status (semantic + legacy) ---
  status: {
    active: palette.terracotta,
    pending: palette.gold,
    completed: palette.emerald,
    failed: palette.crimson,
    online: palette.emerald,
    offline: palette.ink300,
    successBg: '#DCEBE3',
    warningBg: '#F5EBD3',
    errorBg: '#F3E0E3',
    infoBg: '#E2E3EF',
  },

  // --- legacy background alias ---
  background: {
    default: palette.cream,
    paper: palette.white,
    card: palette.white,
    dark: palette.ink900,
    elevated: palette.white,
  },

  // --- text ---
  text: {
    primary: palette.ink900,
    secondary: palette.ink500,
    tertiary: palette.ink400,
    disabled: palette.ink300,
    hint: palette.ink400,
    inverse: palette.cream,
    onBrand: palette.white,
  },

  // --- buttons (legacy) ---
  button: {
    primary: palette.ink800,
    primaryText: palette.cream,
    secondary: palette.creamDeep,
    secondaryText: palette.ink900,
    accent: palette.terracotta,
    accentText: palette.white,
  },

  // --- overlays & shadows ---
  overlay: 'rgba(26,20,16,0.45)',
  scrim: 'rgba(26,20,16,0.7)',
  shadowColor: '#2A1D12',
  shadow: 'rgba(42,29,18,0.06)',
  shadowMedium: 'rgba(42,29,18,0.1)',
  shadowDark: 'rgba(42,29,18,0.16)',
  transparent: 'transparent',
} as const;

// ============================================================
// DARK SCHEME (warm near-black, brightened Kente accents)
// ============================================================
export const darkColors = {
  brand: {
    gold: '#DDB05E',
    goldSoft: 'rgba(221,176,94,0.16)',
    terracotta: '#D98D63',
    terracottaSoft: 'rgba(217,141,99,0.16)',
    emerald: '#4FA382',
    emeraldSoft: 'rgba(79,163,130,0.16)',
    crimson: '#CD6376',
    crimsonSoft: 'rgba(205,99,118,0.18)',
    indigo: '#8A8ECC',
    indigoSoft: 'rgba(138,142,204,0.18)',
  },

  primary: {
    main: palette.cream,
    light: palette.ink100,
    dark: palette.ink200,
    contrast: palette.ink900,
    50: '#1E1813',
    100: '#241C16',
    200: '#2C231B',
    300: '#3A2F27',
    400: '#574A40',
    500: '#7A6B5E',
    600: '#9C8E81',
    700: '#C2B6A8',
    800: '#E2D9CC',
    900: palette.cream,
  },

  accent: {
    main: '#D98D63',
    orange: '#D98D63',
    light: '#E6AC8C',
    dark: palette.terracotta,
    contrast: '#1A1410',
    50: 'rgba(217,141,99,0.12)',
    100: 'rgba(217,141,99,0.18)',
    200: 'rgba(217,141,99,0.28)',
    300: '#C85A1B',
    400: palette.terracottaLight,
    500: '#D98D63',
    600: '#E6AC8C',
    700: '#EDC4AB',
    800: '#F4DCCC',
    900: '#FAEEE6',
  },

  secondary: {
    main: '#2C231B',
    light: '#3A2F27',
    dark: '#1E1813',
    50: '#15110E',
    100: '#1E1813',
    200: '#2C231B',
    300: '#3A2F27',
    400: '#574A40',
    500: '#7A6B5E',
    600: '#9C8E81',
    700: '#C2B6A8',
    800: '#E2D9CC',
    900: palette.cream,
  },

  neutral: {
    black: palette.white,
    gray: '#9C8E81',
    lightGray: '#2C231B',
    white: '#15110E',
    50: '#1A1410',
    100: '#1E1813',
    200: '#2C231B',
    300: '#3A2F27',
    400: '#574A40',
    500: '#7A6B5E',
    600: '#9C8E81',
    700: '#C2B6A8',
    800: '#E2D9CC',
    900: palette.cream,
  },

  reputation: sharedReputation,

  success: '#4FA382',
  error: '#CD6376',
  warning: '#DDB05E',
  info: '#8A8ECC',

  bg: {
    base: '#15110E',
    subtle: '#1E1813',
    elevated: '#241C16',
    sunken: '#100C0A',
    inverse: palette.cream,
  },

  surface: {
    default: '#221B15',
    raised: '#2C231B',
    sunken: '#1A1410',
    glass: 'rgba(44,35,27,0.55)',
    glassBorder: 'rgba(255,255,255,0.08)',
    onBrand: 'rgba(255,255,255,0.1)',
    onBrandBorder: 'rgba(255,255,255,0.16)',
  },

  card: {
    background: '#221B15',
    elevated: '#2C231B',
    shadow: 'rgba(0,0,0,0.5)',
    border: '#3A2F27',
  },

  border: {
    subtle: '#2C231B',
    default: '#3A2F27',
    strong: '#574A40',
  },

  status: {
    active: '#D98D63',
    pending: '#DDB05E',
    completed: '#4FA382',
    failed: '#CD6376',
    online: '#4FA382',
    offline: '#574A40',
    successBg: 'rgba(79,163,130,0.16)',
    warningBg: 'rgba(221,176,94,0.16)',
    errorBg: 'rgba(205,99,118,0.18)',
    infoBg: 'rgba(138,142,204,0.18)',
  },

  background: {
    default: '#15110E',
    paper: '#221B15',
    card: '#2C231B',
    dark: '#100C0A',
    elevated: '#2C231B',
  },

  text: {
    primary: '#F7F1E6',
    secondary: '#B8AC9D',
    tertiary: '#8A7E70',
    disabled: '#6A5E52',
    hint: '#8A7E70',
    inverse: palette.ink900,
    onBrand: '#FFFFFF',
  },

  button: {
    primary: palette.cream,
    primaryText: palette.ink900,
    secondary: '#2C231B',
    secondaryText: palette.cream,
    accent: '#D98D63',
    accentText: '#1A1410',
  },

  overlay: 'rgba(0,0,0,0.6)',
  scrim: 'rgba(0,0,0,0.78)',
  shadowColor: '#000000',
  shadow: 'rgba(0,0,0,0.4)',
  shadowMedium: 'rgba(0,0,0,0.55)',
  shadowDark: 'rgba(0,0,0,0.7)',
  transparent: 'transparent',
} as const;

export type AppColors = typeof lightColors;
export type ColorScheme = 'light' | 'dark';

export const schemes: Record<ColorScheme, AppColors> = {
  light: lightColors,
  dark: darkColors as unknown as AppColors,
};

// Default static export = light scheme (backwards compatible)
export const colors = lightColors;
export type Colors = typeof colors;
export type ColorKey = keyof Colors;

export default colors;
