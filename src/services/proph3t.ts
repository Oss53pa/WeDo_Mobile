/**
 * PROPH3T — intégration ADVISORY-ONLY pour WeDo (WEDO-AMB-10).
 *
 * Règle d'or : PROPH3T ne calcule, ne décide et n'écrit JAMAIS un montant, un statut
 * de qualification ou un paiement. Il LIT et SUGGÈRE ; une règle déterministe
 * (Money.ts / RPC) ou un humain tranche. Ici, `mode: 'advisory'` est FORCÉ : il est
 * impossible d'appeler PROPH3T en mode action depuis WeDo.
 *
 * Le routage des modèles (Ollama→Claude), la mémoire/RAG, le monitoring et le niveau
 * de déploiement vivent dans l'admin console Atlas Studio, pas ici. WeDo déclare juste
 * le domaine `wedo` et consomme des tools advisory via `@atlas/proph3t-sdk`.
 *
 * Le SDK est optionnel : s'il n'est pas installé/activé, les helpers renvoient
 * `{available:false}` sans casser l'app (offline-first).
 */

export type Proph3tTool =
  | 'ambassador.spotPotential'
  | 'ambassador.fraudSignals'
  | 'ambassador.relanceMessage'
  | 'ambassador.tierNudge';

export interface Proph3tResult {
  available: boolean;
  suggestions?: any[];
  error?: string;
}

const DOMAIN = 'wedo';

// Pas de dépendance dure au SDK : on lit un client éventuellement injecté en global
// (`globalThis.AtlasProph3t`) par `@atlas/proph3t-sdk` lors de son initialisation.
// Aucun import statique → aucune résolution de module → build Metro non impacté.
function getClient(): any | null {
  return (globalThis as any)?.AtlasProph3t ?? null;
}

/**
 * Invoque un tool advisory. `mode:'advisory'` est imposé (non surchargeable).
 * Ne JAMAIS utiliser la sortie pour dériver un montant / palier / paiement.
 */
export async function advisory(tool: Proph3tTool, input: Record<string, any>): Promise<Proph3tResult> {
  const sdk = getClient();
  if (!sdk?.invoke) return {available: false, error: 'PROPH3T indisponible (SDK non activé)'};
  try {
    const res = await sdk.invoke({
      domain: DOMAIN,
      tool,
      input,            // pas de PII brute hors politique console
      mode: 'advisory', // FORCÉ côté WeDo — jamais 'action'
    });
    return {available: true, suggestions: res?.suggestions ?? []};
  } catch (e: any) {
    return {available: false, error: String(e?.message ?? e)};
  }
}

// Helpers typés (tous lecture seule → suggestions, jamais d'action).
export const spotPotential = (metrics: Record<string, any>) =>
  advisory('ambassador.spotPotential', metrics);

/** Score de risque + motifs → alimente la FILE REVIEW humaine (jamais d'auto-clawback). */
export const fraudSignals = (tontineId: string, features: Record<string, any>) =>
  advisory('ambassador.fraudSignals', {tontineId, features});

/** Brouillon de message WhatsApp de relance (l'humain valide/édite avant envoi). */
export const relanceMessage = (context: Record<string, any>) =>
  advisory('ambassador.relanceMessage', context);

/** Message d'encouragement vers le palier suivant (suggestion d'affichage). */
export const tierNudge = (progress: Record<string, any>) =>
  advisory('ambassador.tierNudge', progress);

export default {advisory, spotPotential, fraudSignals, relanceMessage, tierNudge};
