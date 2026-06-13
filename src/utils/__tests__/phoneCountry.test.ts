import {detectCountry, regionOf} from '../phoneCountry';
import {resolveAmbianceCopy} from '../../theme/ambiances';

describe('detectCountry', () => {
  it('maps West-Africa indicatifs to the right country + region', () => {
    expect(detectCountry('+225 07 12 34 56 78')).toMatchObject({name: "Côte d'Ivoire", region: 'ouest'});
    expect(detectCountry('+221770000000')).toMatchObject({name: 'Sénégal', region: 'ouest'});
    expect(detectCountry('+233200000000')).toMatchObject({name: 'Ghana', region: 'ouest'});
  });

  it('maps Central-Africa indicatifs to region "centre"', () => {
    expect(detectCountry('+237 6 90 00 00 00')).toMatchObject({name: 'Cameroun', region: 'centre'});
    expect(detectCountry('+241 06 00 00 00')).toMatchObject({name: 'Gabon', region: 'centre'});
    expect(detectCountry('+243 800 000 000')).toMatchObject({name: 'RD Congo', region: 'centre'});
  });

  it('does not confuse +24x central codes with the 1-digit fallback', () => {
    // +241/242/243 must match at length 3, not collapse to a "2" prefix.
    expect(regionOf('+242060000000')).toBe('centre');
  });

  it('returns "autre" for non-African / unknown numbers', () => {
    expect(regionOf('+33612345678')).toBe('autre');
    expect(regionOf('+15145550123')).toBe('autre');
    expect(detectCountry('0712345678')).toBeNull(); // no leading +
    expect(detectCountry('')).toBeNull();
    expect(detectCountry(null)).toBeNull();
  });
});

describe('resolveAmbianceCopy — Élan regional jargon', () => {
  it('uses nouchi (Ouest) by default', () => {
    const ouest = resolveAmbianceCopy('elan', 'ouest');
    expect(ouest.greeting).toBe('Yo môgô');
    expect(ouest.tontineWord).toBe('le do');
  });

  it('switches to camfranglais for Afrique Centrale', () => {
    const centre = resolveAmbianceCopy('elan', 'centre');
    expect(centre.greeting).toBe('Ashia');
    expect(centre.tontineWord).toBe('njangi');
  });

  it('non-Élan ambiances ignore the region', () => {
    expect(resolveAmbianceCopy('heritage', 'centre').greeting).toBe('Akwaba');
    expect(resolveAmbianceCopy('standard', 'ouest').tontineWord).toBe('tontine');
  });
});
