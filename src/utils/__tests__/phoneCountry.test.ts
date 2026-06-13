import {detectCountry, regionOf, argotOf} from '../phoneCountry';
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

describe('argotOf — country-level slang key', () => {
  it('maps each country to its argot', () => {
    expect(argotOf('+2250700000000')).toBe('nouchi');       // Côte d'Ivoire
    expect(argotOf('+237690000000')).toBe('camfranglais');  // Cameroun
    expect(argotOf('+241060000000')).toBe('gabon');         // Gabon
    expect(argotOf('+221770000000')).toBe('nouchi');        // autre Ouest -> nouchi
    expect(argotOf('+243800000000')).toBe('camfranglais');  // autre Centre -> camfranglais
    expect(argotOf('+33612345678')).toBe('aucun');          // hors zone
  });
});

describe('resolveAmbianceCopy — Élan argot par pays', () => {
  it('Côte d’Ivoire — nouchi (base)', () => {
    const c = resolveAmbianceCopy('elan', 'nouchi');
    expect(c.greeting).toBe('Yo Môgô');
    expect(c.balanceLabel).toBe('Ton Djê est calé');
    expect(c.tontineWord).toBe('Gbonhi');
    expect(c.pay).toBe('Envoie le Djê');
    expect(c.join).toBe('Rentrer dans le Gbonhi');
    expect(c.help).toBe('Ça marche comment');
  });

  it('Cameroun — camfranglais', () => {
    const c = resolveAmbianceCopy('elan', 'camfranglais');
    expect(c.greeting).toBe('Mbom, on dit quoi ?');
    expect(c.balanceLabel).toBe('Ton moni est au calme');
    expect(c.myTontines).toBe('Mes njangi');
    expect(c.nextBeneficiary).toBe("C'est le tour de qui ?");
  });

  it('Gabon — argot local', () => {
    const c = resolveAmbianceCopy('elan', 'gabon');
    expect(c.greeting).toBe('Mani Top ?');
    expect(c.balanceLabel).toBe('Ton Do est oklm');
    expect(c.tontineWord).toBe('klan');
    expect(c.pay).toBe('Envoie les Do');
  });

  it('Héritage — salut local, reste en français facile', () => {
    expect(resolveAmbianceCopy('heritage', 'nouchi').greeting).toBe('Akwaba');
    expect(resolveAmbianceCopy('heritage', 'camfranglais').greeting).toBe('On est ensemble');
    expect(resolveAmbianceCopy('heritage', 'gabon').greeting).toBe('Mbolo !');
    expect(resolveAmbianceCopy('heritage', 'gabon').myTontines).toBe('Mes groupes');
  });

  it('Standard/Souverain ignorent l’argot', () => {
    expect(resolveAmbianceCopy('standard', 'nouchi').tontineWord).toBe('tontine');
    expect(resolveAmbianceCopy('souverain', 'gabon').greeting).toBe('Bonsoir');
    expect(resolveAmbianceCopy('souverain', 'camfranglais').pay).toBe('Cotiser');
  });
});
