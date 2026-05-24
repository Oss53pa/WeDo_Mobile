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
  // Hero balance card — kente sunset (gold → terracotta → crimson)
  sunset: {
    colors: ['#F9C846', '#F2872E', '#E0452F', '#C01F4A'],
    locations: [0, 0.42, 0.74, 1],
    ...diag,
  },
  // Full kente band — used on thin accents / progress
  kente: {
    colors: ['#0F9D72', '#F4B43C', '#EF762D', '#D72D45', '#2E3192'],
    ...horizontal,
  },
  // Premium night card (royal indigo)
  night: {
    colors: ['#3A3DA8', '#2E3192', '#1C1E5E'],
    ...diag,
  },
  gold: {colors: ['#FBD37A', '#F4B43C', '#D99311'], ...diag},
  terracotta: {colors: ['#FF9A5C', '#EF762D', '#C85A1B'], ...diag},
  emerald: {colors: ['#3FC79A', '#0F9D72', '#0A6E50'], ...diag},
  crimson: {colors: ['#F0566B', '#D72D45', '#A01528'], ...diag},
  indigo: {colors: ['#5B5FD1', '#2E3192', '#1C1E5E'], ...diag},
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
    colors: ['#FBD24E', '#FF9A4C', '#E0452F', '#C01F4A'],
    locations: [0, 0.42, 0.74, 1],
    ...diag,
  },
  kente: {
    colors: ['#28C796', '#FBC54E', '#FF8A4C', '#F0566B', '#7A7EE6'],
    ...horizontal,
  },
  night: {colors: ['#3A3DA8', '#23255F', '#14163C'], ...diag},
  gold: {colors: ['#FBD37A', '#FBC54E', '#C98A12'], ...diag},
  terracotta: {colors: ['#FFB084', '#FF8A4C', '#C85A1B'], ...diag},
  emerald: {colors: ['#3FC79A', '#28C796', '#0A6E50'], ...diag},
  crimson: {colors: ['#F0566B', '#D72D45', '#A01528'], ...diag},
  indigo: {colors: ['#7A7EE6', '#3A3DA8', '#1C1E5E'], ...diag},
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
