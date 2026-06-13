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
import type {ArgotKey} from '../utils/phoneCountry';

export type AmbianceKey = 'standard' | 'heritage' | 'elan' | 'souverain';
export type AdinkraKey = 'sankofa' | 'nkonsonkonson' | 'adinkrahene' | 'kente';

const diag = {start: {x: 0, y: 0}, end: {x: 1, y: 1}} as const;

type AccentOverride = Partial<Record<keyof AppColors['accent'], string>>;
type GradientOverride = Partial<Record<keyof AppGradients, GradientDef>>;

/**
 * Voice pack — the user-facing words an ambiance uses. Standard/Souverain speak
 * neutral French, Héritage speaks "français facile" (mamans & aînés), Élan speaks
 * the regional youth slang (nouchi à l'Ouest, camfranglais au Centre).
 */
export interface AmbianceCopy {
  /** Home greeting word. */
  greeting: string;
  /** Label above the balance amount. */
  balanceLabel: string;
  /** Singular inline noun for a tontine ('tontine', 'groupe', 'Gbonhi'…). */
  tontineWord: string;
  /** Short label for the bottom "Tontines" tab. */
  tontinesTab: string;
  /** Section title "Mes tontines". */
  myTontines: string;
  /** Primary "pay / contribute" action. */
  pay: string;
  /** "Join a tontine" action. */
  join: string;
  /** "How it works" entry/title. */
  help: string;
  /** "Next beneficiary / whose turn" label. */
  nextBeneficiary: string;
}

export interface AmbianceDef {
  key: AmbianceKey;
  label: string;
  tagline: string;
  description: string;
  adinkra: AdinkraKey;
  /** The ambiance's full voice pack (default / Ouest for Élan). */
  copy: AmbianceCopy;
  /**
   * Slang overrides keyed by COUNTRY-level argot (from the phone indicatif):
   * 'nouchi' (Côte d'Ivoire — the Élan base), 'camfranglais' (Cameroun),
   * 'gabon' (Gabon). Each only overrides the words that change.
   */
  regional?: Partial<Record<ArgotKey, Partial<AmbianceCopy>>>;
  /** Swatch shown in the selector. */
  swatch: string[];
  /** Animation character. */
  motion: 'calme' | 'vif' | 'precis';
  accent?: AccentOverride;
  gradients?: GradientOverride;
}

// Neutral French voice, shared by Standard & Souverain (greeting differs).
const FR_COPY: AmbianceCopy = {
  greeting: 'Bonjour',
  balanceLabel: 'Solde sécurisé',
  tontineWord: 'tontine',
  tontinesTab: 'Tontines',
  myTontines: 'Mes tontines',
  pay: 'Cotiser',
  join: 'Rejoindre une tontine',
  help: 'Comment ça marche',
  nextBeneficiary: 'Prochain bénéficiaire',
};

export const AMBIANCES: Record<AmbianceKey, AmbianceDef> = {
  standard: {
    key: 'standard',
    label: 'Standard',
    tagline: 'Kente Héritage',
    description: "L'identité WeDo par défaut : sobre, premium, terre et or.",
    adinkra: 'kente',
    copy: FR_COPY,
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
    // "Français facile" — words our mamans & aînés read without effort. Only the
    // greeting takes a warm local touch per country; the rest stays plain French.
    copy: {
      greeting: 'Akwaba',
      balanceLabel: 'Ton argent est gardé',
      tontineWord: 'groupe',
      tontinesTab: 'Groupes',
      myTontines: 'Mes groupes',
      pay: "Mettre l'argent",
      join: 'Entrer dans un groupe',
      help: 'Comment ça marche',
      nextBeneficiary: 'À qui le tour',
    },
    regional: {
      camfranglais: {greeting: 'On est ensemble'},
      gabon: {greeting: 'Mbolo !'},
    },
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
    // Base = Côte d'Ivoire / nouchi. Djê = l'argent, Gbonhi = le groupe/la bande.
    copy: {
      greeting: 'Yo Môgô',
      balanceLabel: 'Ton Djê est calé',
      tontineWord: 'Gbonhi',
      tontinesTab: 'Gbonhi',
      myTontines: 'Mes Gbonhi',
      pay: 'Envoie le Djê',
      join: 'Rentrer dans le Gbonhi',
      help: 'Ça marche comment',
      nextBeneficiary: "C'est qui le prochain",
    },
    regional: {
      // Cameroun — camfranglais / pidgin. moni = l'argent, njangi = tontine.
      camfranglais: {
        greeting: 'Mbom, on dit quoi ?',
        balanceLabel: 'Ton moni est au calme',
        tontineWord: 'njangi',
        tontinesTab: 'Njangi',
        myTontines: 'Mes njangi',
        pay: 'Envoie le moni',
        join: 'Rentrer dans le njangi',
        help: 'Ça se passe how ?',
        nextBeneficiary: "C'est le tour de qui ?",
      },
      // Gabon — argot local. Do = l'argent, klan = le groupe.
      gabon: {
        greeting: 'Mani Top ?',
        balanceLabel: 'Ton Do est oklm',
        tontineWord: 'klan',
        tontinesTab: 'Klans',
        myTontines: 'Mes klans',
        pay: 'Envoie les Do',
        join: 'Rentrer dans le klan',
        help: "C'est quoi le deal",
        nextBeneficiary: 'A qui le tour ?',
      },
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
    // Pro / sobre — same neutral French, just a more formal greeting.
    copy: {...FR_COPY, greeting: 'Bonsoir'},
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
 * Resolve the ambiance's full voice pack for a given argot (country slang).
 * Élan swaps its whole pack (nouchi / camfranglais / gabon); Héritage only swaps
 * its greeting; the others ignore it.
 */
export const resolveAmbianceCopy = (
  key: AmbianceKey,
  argot: ArgotKey = 'aucun',
): AmbianceCopy => {
  const amb = AMBIANCES[key] ?? AMBIANCES.standard;
  const r = amb.regional?.[argot];
  return r ? {...amb.copy, ...r} : amb.copy;
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
