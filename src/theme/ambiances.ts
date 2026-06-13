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
import type {AfricaRegion} from '../utils/phoneCountry';

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
  /** How this ambiance names a tontine ('le do', 'njangi', 'tontine'). */
  tontineWord: string;
  /**
   * Regional copy overrides — only Élan varies its jargon by the user's region,
   * derived from their phone indicatif: 'ouest' → nouchi, 'centre' → camfranglais.
   * The base fields above act as the default (Ouest / nouchi).
   */
  regional?: Partial<Record<AfricaRegion, RegionalCopy>>;
  /** Swatch shown in the selector. */
  swatch: string[];
  /** Animation character. */
  motion: 'calme' | 'vif' | 'precis';
  accent?: AccentOverride;
  gradients?: GradientOverride;
}

export interface RegionalCopy {
  greeting?: string;
  balanceLabel?: string;
  tontineWord?: string;
}

export interface AmbianceCopy {
  greeting: string;
  balanceLabel: string;
  tontineWord: string;
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
    tontineWord: 'tontine',
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
    tontineWord: 'tontine',
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
    // Base = Afrique de l'Ouest / nouchi (Côte d'Ivoire, Mali, Burkina…).
    greeting: 'Yo môgô',
    balanceLabel: 'Tes sous, sécurisés',
    tontineWord: 'le do',
    regional: {
      // Afrique Centrale / camfranglais (Cameroun, Gabon, Congo…). Positif,
      // chaleureux : « Ashia » = compassion/solidarité ; « njangi » = tontine.
      centre: {greeting: 'Ashia', balanceLabel: 'Tes sous, sécurisés', tontineWord: 'njangi'},
    },
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
    tontineWord: 'tontine',
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

/**
 * Resolve the ambiance's copy (greeting / balance label / tontine word) for a
 * given region. Only Élan varies by region; every other ambiance ignores it.
 */
export const resolveAmbianceCopy = (
  key: AmbianceKey,
  region: AfricaRegion = 'autre',
): AmbianceCopy => {
  const amb = AMBIANCES[key] ?? AMBIANCES.standard;
  const r = amb.regional?.[region];
  return {
    greeting: r?.greeting ?? amb.greeting,
    balanceLabel: r?.balanceLabel ?? amb.balanceLabel,
    tontineWord: r?.tontineWord ?? amb.tontineWord,
  };
};

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
