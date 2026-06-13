/**
 * Detect the country (and African region) from a phone number's dialing code.
 * Region drives the Élan ambiance jargon: 'ouest' → nouchi, 'centre' → camfranglais.
 * No DB column needed — we derive this at runtime from the stored phone number.
 */
export type AfricaRegion = 'ouest' | 'centre' | 'autre';

export interface CountryInfo {
  code: string; // dialing code without "+"
  name: string;
  flag: string;
  region: AfricaRegion;
}

// West Africa (UEMOA / CEDEAO) + Central Africa (CEMAC), then a few common others.
const COUNTRIES: Record<string, CountryInfo> = {
  // --- Afrique de l'Ouest ---
  '225': {code: '225', name: "Côte d'Ivoire", flag: '🇨🇮', region: 'ouest'},
  '221': {code: '221', name: 'Sénégal', flag: '🇸🇳', region: 'ouest'},
  '223': {code: '223', name: 'Mali', flag: '🇲🇱', region: 'ouest'},
  '226': {code: '226', name: 'Burkina Faso', flag: '🇧🇫', region: 'ouest'},
  '228': {code: '228', name: 'Togo', flag: '🇹🇬', region: 'ouest'},
  '229': {code: '229', name: 'Bénin', flag: '🇧🇯', region: 'ouest'},
  '227': {code: '227', name: 'Niger', flag: '🇳🇪', region: 'ouest'},
  '224': {code: '224', name: 'Guinée', flag: '🇬🇳', region: 'ouest'},
  '245': {code: '245', name: 'Guinée-Bissau', flag: '🇬🇼', region: 'ouest'},
  '220': {code: '220', name: 'Gambie', flag: '🇬🇲', region: 'ouest'},
  '231': {code: '231', name: 'Liberia', flag: '🇱🇷', region: 'ouest'},
  '232': {code: '232', name: 'Sierra Leone', flag: '🇸🇱', region: 'ouest'},
  '233': {code: '233', name: 'Ghana', flag: '🇬🇭', region: 'ouest'},
  '234': {code: '234', name: 'Nigeria', flag: '🇳🇬', region: 'ouest'},
  '222': {code: '222', name: 'Mauritanie', flag: '🇲🇷', region: 'ouest'},
  '238': {code: '238', name: 'Cap-Vert', flag: '🇨🇻', region: 'ouest'},
  // --- Afrique Centrale ---
  '237': {code: '237', name: 'Cameroun', flag: '🇨🇲', region: 'centre'},
  '241': {code: '241', name: 'Gabon', flag: '🇬🇦', region: 'centre'},
  '242': {code: '242', name: 'Congo', flag: '🇨🇬', region: 'centre'},
  '243': {code: '243', name: 'RD Congo', flag: '🇨🇩', region: 'centre'},
  '236': {code: '236', name: 'Centrafrique', flag: '🇨🇫', region: 'centre'},
  '235': {code: '235', name: 'Tchad', flag: '🇹🇩', region: 'centre'},
  '240': {code: '240', name: 'Guinée équatoriale', flag: '🇬🇶', region: 'centre'},
  '239': {code: '239', name: 'Sao Tomé-et-Principe', flag: '🇸🇹', region: 'centre'},
  // --- Quelques autres courants ---
  '33': {code: '33', name: 'France', flag: '🇫🇷', region: 'autre'},
  '32': {code: '32', name: 'Belgique', flag: '🇧🇪', region: 'autre'},
  '1': {code: '1', name: 'États-Unis / Canada', flag: '🇺🇸', region: 'autre'},
};

/** Detect the country from an international phone number (must start with "+"). */
export const detectCountry = (phone?: string | null): CountryInfo | null => {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) return null;
  const digits = cleaned.slice(1);
  // longest-prefix match (codes are 1–3 digits here)
  for (let len = 3; len >= 1; len--) {
    const c = COUNTRIES[digits.slice(0, len)];
    if (c) return c;
  }
  return null;
};

/** African region for a phone number ('autre' when unknown / non-African). */
export const regionOf = (phone?: string | null): AfricaRegion =>
  detectCountry(phone)?.region ?? 'autre';
