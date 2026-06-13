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
// Ordered list (drives the country picker); COUNTRIES is the dial-code lookup.
export const COUNTRY_LIST: CountryInfo[] = [
  // --- Afrique de l'Ouest ---
  {code: '225', name: "Côte d'Ivoire", flag: '🇨🇮', region: 'ouest'},
  {code: '221', name: 'Sénégal', flag: '🇸🇳', region: 'ouest'},
  {code: '223', name: 'Mali', flag: '🇲🇱', region: 'ouest'},
  {code: '226', name: 'Burkina Faso', flag: '🇧🇫', region: 'ouest'},
  {code: '228', name: 'Togo', flag: '🇹🇬', region: 'ouest'},
  {code: '229', name: 'Bénin', flag: '🇧🇯', region: 'ouest'},
  {code: '227', name: 'Niger', flag: '🇳🇪', region: 'ouest'},
  {code: '224', name: 'Guinée', flag: '🇬🇳', region: 'ouest'},
  {code: '245', name: 'Guinée-Bissau', flag: '🇬🇼', region: 'ouest'},
  {code: '220', name: 'Gambie', flag: '🇬🇲', region: 'ouest'},
  {code: '231', name: 'Liberia', flag: '🇱🇷', region: 'ouest'},
  {code: '232', name: 'Sierra Leone', flag: '🇸🇱', region: 'ouest'},
  {code: '233', name: 'Ghana', flag: '🇬🇭', region: 'ouest'},
  {code: '234', name: 'Nigeria', flag: '🇳🇬', region: 'ouest'},
  {code: '222', name: 'Mauritanie', flag: '🇲🇷', region: 'ouest'},
  {code: '238', name: 'Cap-Vert', flag: '🇨🇻', region: 'ouest'},
  // --- Afrique Centrale ---
  {code: '237', name: 'Cameroun', flag: '🇨🇲', region: 'centre'},
  {code: '241', name: 'Gabon', flag: '🇬🇦', region: 'centre'},
  {code: '242', name: 'Congo', flag: '🇨🇬', region: 'centre'},
  {code: '243', name: 'RD Congo', flag: '🇨🇩', region: 'centre'},
  {code: '236', name: 'Centrafrique', flag: '🇨🇫', region: 'centre'},
  {code: '235', name: 'Tchad', flag: '🇹🇩', region: 'centre'},
  {code: '240', name: 'Guinée équatoriale', flag: '🇬🇶', region: 'centre'},
  {code: '239', name: 'Sao Tomé-et-Principe', flag: '🇸🇹', region: 'centre'},
  // --- Quelques autres courants ---
  {code: '33', name: 'France', flag: '🇫🇷', region: 'autre'},
  {code: '32', name: 'Belgique', flag: '🇧🇪', region: 'autre'},
  {code: '1', name: 'États-Unis / Canada', flag: '🇺🇸', region: 'autre'},
];

const COUNTRIES: Record<string, CountryInfo> = Object.fromEntries(
  COUNTRY_LIST.map(c => [c.code, c]),
);

/** Default dial code when none is known yet (primary market: Côte d'Ivoire). */
export const DEFAULT_COUNTRY_CODE = '225';

/** Look up a country by its dial code (without "+"). */
export const findCountryByCode = (code?: string | null): CountryInfo | null =>
  (code && COUNTRIES[code]) || null;

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
