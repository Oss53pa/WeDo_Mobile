/**
 * WeDo Gradient System
 * Signature gradients for hero surfaces, CTAs and accents.
 * Each gradient is a tuple of color stops consumed by LinearGradient.
 */
import {palette} from './colors';
import type {ColorScheme} from './colors';

export interface GradientDef {
  colors: string[];
  /** suggested start/end for a top-left → bottom-right diagonal */
  start: {x: number; y: number};
  end: {x: number; y: number};
  locations?: number[];
}

const diag = {start: {x: 0, y: 0}, end: {x: 1, y: 1}};
const horizontal = {start: {x: 0, y: 0}, end: {x: 1, y: 0}};
const vertical = {start: {x: 0, y: 0}, end: {x: 0, y: 1}};

export const lightGradients = {
  // Hero balance card — deep espresso → bronze ember (premium, sober)
  sunset: {
    colors: ['#2C2014', '#46301C', '#6E4526', '#9C6A33'],
    locations: [0, 0.4, 0.75, 1],
    ...diag,
  },
  // Full kente band — used on thin accents / progress (muted tones)
  kente: {
    colors: ['#1F7A58', '#D4A03C', '#C2683C', '#B23A4E', '#3A3E7C'],
    ...horizontal,
  },
  // Premium night card (desaturated royal indigo)
  night: {
    colors: ['#464A8F', '#3A3E7C', '#252856'],
    ...diag,
  },
  gold: {colors: ['#E6C172', '#D4A03C', '#9E7320'], ...diag},
  terracotta: {colors: ['#D98D63', '#C2683C', '#9C4E26'], ...diag},
  emerald: {colors: ['#4FA382', '#1F7A58', '#155640'], ...diag},
  crimson: {colors: ['#CD6376', '#B23A4E', '#832435'], ...diag},
  indigo: {colors: ['#666BB3', '#3A3E7C', '#252856'], ...diag},
  // soft cream wash for screen backgrounds
  canvas: {colors: [palette.cream, '#F4ECDD'], ...vertical},
  // glass sheen overlay
  sheen: {
    colors: ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)'],
    ...vertical,
  },
  // fade-to-readability scrim over images
  scrim: {
    colors: ['rgba(26,20,16,0)', 'rgba(26,20,16,0.85)'],
    ...vertical,
  },
} satisfies Record<string, GradientDef>;

export const darkGradients = {
  sunset: {
    colors: ['#3A2A1A', '#553B22', '#7E512C', '#A8763E'],
    locations: [0, 0.4, 0.75, 1],
    ...diag,
  },
  kente: {
    colors: ['#4FA382', '#DDB05E', '#D98D63', '#CD6376', '#8A8ECC'],
    ...horizontal,
  },
  night: {colors: ['#3F4286', '#2A2D66', '#181A40'], ...diag},
  gold: {colors: ['#E6C172', '#DDB05E', '#9E7320'], ...diag},
  terracotta: {colors: ['#E6AC8C', '#D98D63', '#9C4E26'], ...diag},
  emerald: {colors: ['#4FA382', '#2E8A66', '#155640'], ...diag},
  crimson: {colors: ['#CD6376', '#B23A4E', '#832435'], ...diag},
  indigo: {colors: ['#8A8ECC', '#4A4E96', '#252856'], ...diag},
  canvas: {colors: ['#1A1410', '#15110E'], ...vertical},
  sheen: {
    colors: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)'],
    ...vertical,
  },
  scrim: {
    colors: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.9)'],
    ...vertical,
  },
} satisfies Record<string, GradientDef>;

export type AppGradients = typeof lightGradients;
export type GradientName = keyof AppGradients;

export const gradientSchemes: Record<ColorScheme, AppGradients> = {
  light: lightGradients,
  dark: darkGradients,
};

export const gradients = lightGradients;
export default gradients;
