/**
 * WeDo Motion System
 * Centralized durations, easings and reanimated presets so every
 * animation across the app feels consistent and 60fps-smooth.
 */
import {Easing} from 'react-native-reanimated';

export const duration = {
  instant: 100,
  fast: 180,
  base: 260,
  slow: 380,
  slower: 560,
} as const;

export const easing = {
  // Standard ease-out for entrances
  out: Easing.bezier(0.16, 1, 0.3, 1),
  // Snappy ease for press feedback
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  // Decelerate
  decelerate: Easing.out(Easing.cubic),
  // Spring-like overshoot for playful accents
  emphasized: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;

export const spring = {
  soft: {damping: 18, stiffness: 160, mass: 1},
  snappy: {damping: 20, stiffness: 260, mass: 0.9},
  bouncy: {damping: 12, stiffness: 180, mass: 1},
} as const;

/** Stagger delay helper for list/grid entrance animations. */
export const stagger = (index: number, step = 60, base = 0) => base + index * step;

export const motion = {duration, easing, spring, stagger};
export default motion;
