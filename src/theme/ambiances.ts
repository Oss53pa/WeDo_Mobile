/**
 * Ambiances — selectable "moods" layered on top of the shared Kente base
 * (and the light/dark scheme). Each ambiance is grounded in Akan symbolism:
 *  - standard   : the default refined "Kente Héritage" (no override).
 *  - heritage   : Sankofa — wisdom of the elders (gold/earth, warm, dignified).
 *  - elan       : Nkonsonkonson — chain links / community (vivid, playful).
 *  - souverain  : Adinkrahene — leadership (night indigo + ciseled gold, sober).
 *
 * An ambiance only overrides the accent palette + a few hero gradients, so it
 * re-skins the whole app without touching individual screens.
 */
import type {AppColors} from './colors';
import type {AppGradients, GradientDef} from './gradients';

export type AmbianceKey = 'standard' | 'heritage' | 'elan' | 'souverain';
export type AdinkraKey = 'sankofa' | 'nkonsonkonson' | 'adinkrahene' | 'kente';

const diag = {start: {x: 0, y: 0}, end: {x: 1, y: 1}} as const;

type AccentOverride = Partial<Record<keyof AppColors['accent'], string>>;
type GradientOverride = Partial<Record<keyof AppGradients, GradientDef>>;

export interface AmbianceDef {
  key: AmbianceKey;
  label: string;
  tagline: string;
  description: string;
  adinkra: AdinkraKey;
  /** Home greeting word, per ambiance personality. */
  greeting: string;
  /** Label above the balance amount (Élan uses nouchi). */
  balanceLabel: string;
  /** Swatch shown in the selector. */
  swatch: string[];
  /** Animation character. */
  motion: 'calme' | 'vif' | 'precis';
  accent?: AccentOverride;
  gradients?: GradientOverride;
}

export const AMBIANCES: Record<AmbianceKey, AmbianceDef> = {
  standard: {
    key: 'standard',
    label: 'Standard',
    tagline: 'Kente Héritage',
    description: "L'identité WeDo par défaut : sobre, premium, terre et or.",
    adinkra: 'kente',
    greeting: 'Bonjour',
    balanceLabel: 'Solde sécurisé',
    swatch: ['#C2683C', '#D4A03C', '#1F7A58', '#3A3E7C'],
    motion: 'calme',
    // no override — uses the base scheme
  },

  heritage: {
    key: 'heritage',
    label: 'Héritage',
    tagline: 'Sankofa · la sagesse qui se transmet',
    description: 'Pour nos mamans et les cercles de tradition. Or royal, vert récolte, terre des ancêtres.',
    adinkra: 'sankofa',
    greeting: 'Akwaba',
    balanceLabel: 'Solde sécurisé',
    swatch: ['#9E7320', '#D4A03C', '#1F7A58', '#6B4A29'],
    motion: 'calme',
    accent: {main: '#D4A03C', orange: '#D4A03C', light: '#E6C172', dark: '#9E7320', contrast: '#2C2014'},
    gradients: {
      sunset: {colors: ['#6B4A29', '#46301C', '#9C6A33'], ...diag},
      night: {colors: ['#3A2A1A', '#241810'], ...diag},
    },
  },

  elan: {
    key: 'elan',
    label: 'Élan',
    tagline: 'Nkonsonkonson · nous sommes liés',
    description: 'Pour les jeunes. Couleurs franches du Kente, formes ludiques, plus de mouvement.',
    adinkra: 'nkonsonkonson',
    greeting: 'Yo môgô',
    balanceLabel: 'Tes sous, sécurisés',
    swatch: ['#D4A03C', '#1F7A58', '#B23A4E', '#666BB3'],
    motion: 'vif',
    accent: {main: '#B23A4E', orange: '#B23A4E', light: '#CD6376', dark: '#832435', contrast: '#FFFFFF'},
    gradients: {
      sunset: {colors: ['#D4A03C', '#C2683C', '#B23A4E'], locations: [0, 0.5, 1], ...diag},
      night: {colors: ['#B23A4E', '#832435'], ...diag},
    },
  },

  souverain: {
    key: 'souverain',
    label: 'Souverain',
    tagline: 'Adinkrahene · le chef des symboles',
    description: 'Pour les organisateurs et cercles d’affaires. Bleu nuit, or ciselé, données en avant.',
    adinkra: 'adinkrahene',
    greeting: 'Bonsoir',
    balanceLabel: 'Solde sécurisé',
    swatch: ['#1C1E44', '#34376E', '#E6C172', '#2C2014'],
    motion: 'precis',
    accent: {main: '#3A3E7C', orange: '#3A3E7C', light: '#666BB3', dark: '#252856', contrast: '#FFFFFF'},
    gradients: {
      sunset: {colors: ['#1C1E44', '#34376E'], ...diag},
      night: {colors: ['#1C1E44', '#252856'], ...diag},
    },
  },
};

export const AMBIANCE_LIST: AmbianceDef[] = [
  AMBIANCES.standard,
  AMBIANCES.heritage,
  AMBIANCES.elan,
  AMBIANCES.souverain,
];

/** Merge an ambiance's overrides onto the base colors + gradients of a scheme. */
export const applyAmbiance = (
  colors: AppColors,
  gradients: AppGradients,
  key: AmbianceKey,
): {colors: AppColors; gradients: AppGradients} => {
  const amb = AMBIANCES[key] ?? AMBIANCES.standard;
  if (key === 'standard' || (!amb.accent && !amb.gradients)) {
    return {colors, gradients};
  }
  const nextColors = amb.accent
    ? ({...colors, accent: {...colors.accent, ...amb.accent}} as AppColors)
    : colors;
  const nextGradients = amb.gradients
    ? ({...gradients, ...amb.gradients} as AppGradients)
    : gradients;
  return {colors: nextColors, gradients: nextGradients};
};
