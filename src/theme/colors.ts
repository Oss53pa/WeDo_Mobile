/**
 * WeDo Color System — "Kente Vibrant" premium afro-fintech
 * --------------------------------------------------------
 * Restraint + vibrancy: a warm neutral base (espresso ink + cream) lit up
 * by the four Kente accents (gold, terracotta, emerald, crimson) and a
 * royal indigo. Light + dark schemes share the same semantic shape so any
 * `theme.colors.x` reference works in both.
 *
 * Legacy keys (primary/secondary/accent/neutral/background/text/...) are kept
 * so existing imports of `colors` keep resolving while screens migrate to the
 * richer semantic tokens (brand/bg/surface/border/status).
 */

// ============================================================
// RAW PALETTE — Kente brand hues (scheme-independent reference)
// ============================================================
export const palette = {
  // Kente gold — prosperity
  gold: '#F4B43C',
  goldLight: '#FBD37A',
  goldDark: '#C98A12',

  // Terracotta — heritage anchor (kept from the original brand)
  terracotta: '#EF762D',
  terracottaLight: '#FF9A5C',
  terracottaDark: '#C85A1B',

  // Emerald — growth / trust
  emerald: '#0F9D72',
  emeraldLight: '#3FC79A',
  emeraldDark: '#0A6E50',

  // Crimson — energy / alerts
  crimson: '#D72D45',
  crimsonLight: '#F0566B',
  crimsonDark: '#A01528',

  // Royal indigo — depth / premium
  indigo: '#2E3192',
  indigoLight: '#5B5FD1',
  indigoDark: '#1C1E5E',

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
    goldSoft: '#FCEFD2',
    terracotta: palette.terracotta,
    terracottaSoft: '#FDE7D7',
    emerald: palette.emerald,
    emeraldSoft: '#D6F2E8',
    crimson: palette.crimson,
    crimsonSoft: '#FBDFE4',
    indigo: palette.indigo,
    indigoSoft: '#E0E1F5',
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
    50: '#FFF5EE',
    100: '#FDE7D7',
    200: '#FBD0B4',
    300: '#FFBC8A',
    400: palette.terracottaLight,
    500: palette.terracotta,
    600: palette.terracottaDark,
    700: '#A8480F',
    800: '#85380B',
    900: '#5E2706',
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
    successBg: '#D6F2E8',
    warningBg: '#FCEFD2',
    errorBg: '#FBDFE4',
    infoBg: '#E0E1F5',
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
    gold: '#FBC54E',
    goldSoft: 'rgba(251,197,78,0.16)',
    terracotta: '#FF8A4C',
    terracottaSoft: 'rgba(255,138,76,0.16)',
    emerald: '#28C796',
    emeraldSoft: 'rgba(40,199,150,0.16)',
    crimson: '#F0566B',
    crimsonSoft: 'rgba(240,86,107,0.18)',
    indigo: '#7A7EE6',
    indigoSoft: 'rgba(122,126,230,0.18)',
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
    main: '#FF8A4C',
    orange: '#FF8A4C',
    light: '#FFB084',
    dark: palette.terracotta,
    contrast: '#1A1410',
    50: 'rgba(255,138,76,0.12)',
    100: 'rgba(255,138,76,0.18)',
    200: 'rgba(255,138,76,0.28)',
    300: '#C85A1B',
    400: palette.terracottaLight,
    500: '#FF8A4C',
    600: '#FFB084',
    700: '#FFC9A8',
    800: '#FFE0CD',
    900: '#FFEFE4',
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

  success: '#28C796',
  error: '#F0566B',
  warning: '#FBC54E',
  info: '#7A7EE6',

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
    active: '#FF8A4C',
    pending: '#FBC54E',
    completed: '#28C796',
    failed: '#F0566B',
    online: '#28C796',
    offline: '#574A40',
    successBg: 'rgba(40,199,150,0.16)',
    warningBg: 'rgba(251,197,78,0.16)',
    errorBg: 'rgba(240,86,107,0.18)',
    infoBg: 'rgba(122,126,230,0.18)',
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
    accent: '#FF8A4C',
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
