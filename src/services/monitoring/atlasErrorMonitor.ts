/**
 * Atlas Studio — Error Monitor SDK (React Native)
 * ------------------------------------------------------------------
 * WeDo est un produit géré par la console Atlas Studio (ASVC). Ce module
 * remonte les erreurs de l'app vers le projet Atlas (comme toutes les apps du
 * catalogue) via la RPC publique `upsert_error_log` → elles apparaissent dans
 * /admin/error-monitor/wedo et alimentent l'agent bug-triage ASVC.
 *
 * Portage RN de `src/lib/error-sdk/errorMonitor.ts` du portail Atlas :
 *  - aucune dépendance externe, aucun `window` / `import.meta`
 *  - SILENCIEUX : un envoi qui échoue ne fait JAMAIS crasher l'app
 *  - dédoublonnage côté serveur par fingerprint stable
 *  - clé ANON Atlas (publique) — aucun secret embarqué
 */

import {Platform} from 'react-native';
import {
  ATLAS_ERR_URL,
  ATLAS_ERR_ANON_KEY,
  ATLAS_ERR_APP_ID,
  APP_INFO,
  getEnvironment,
} from '@config/appConfig';

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface ErrorPayload {
  message: string;
  stack?: string | null;
  component?: string | null;
  context?: string | null;
  severity?: ErrorSeverity;
  metadata?: Record<string, unknown>;
}

let globalHandlersInstalled = false;

/**
 * Erreurs transitoires/attendues qu'on ne remonte PAS (bruit) :
 *  - AbortError : requête annulée (navigation pendant un fetch).
 *  - Échecs réseau : connexion mobile instable, se rétablissent seuls.
 */
function isIgnorableError(reason: unknown): boolean {
  const name = (reason as {name?: string} | null)?.name;
  if (name === 'AbortError') return true;
  const msg = String(
    (reason as {message?: string} | null)?.message ??
      (typeof reason === 'string' ? reason : ''),
  ).toLowerCase();
  return (
    msg.includes('signal is aborted') ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('the internet connection appears to be offline') ||
    msg.includes('timeout')
  );
}

/** dev | staging | production → convention error-monitor ('dev' côté Atlas). */
function mapEnvironment(): 'dev' | 'staging' | 'production' {
  const env = getEnvironment();
  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  return 'dev';
}

/**
 * Fingerprint stable pour dédoublonner les erreurs identiques.
 * Hash 32 bits déterministe → base36 (pas de btoa fiable en RN).
 */
function computeFingerprint(appId: string, message: string, component?: string | null): string {
  const raw = `${appId}::${message}::${component || ''}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return `wd${Math.abs(hash).toString(36)}`.slice(0, 32);
}

/**
 * Capture une erreur et la POST à la RPC Atlas `upsert_error_log`.
 * Retourne true si l'envoi a réussi — ne throw JAMAIS.
 */
export async function captureError(payload: ErrorPayload): Promise<boolean> {
  try {
    if (!payload?.message) return false;
    if (!ATLAS_ERR_URL || !ATLAS_ERR_ANON_KEY) return false;

    const severity: ErrorSeverity = payload.severity || 'error';
    const fingerprint = computeFingerprint(
      ATLAS_ERR_APP_ID,
      payload.message,
      payload.component,
    );

    const res = await fetch(`${ATLAS_ERR_URL}/rest/v1/rpc/upsert_error_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ATLAS_ERR_ANON_KEY,
        Authorization: `Bearer ${ATLAS_ERR_ANON_KEY}`,
      },
      body: JSON.stringify({
        p_app_id: ATLAS_ERR_APP_ID,
        p_fingerprint: fingerprint,
        p_severity: severity,
        p_message: payload.message.slice(0, 2000),
        p_stack_trace: payload.stack ? String(payload.stack).slice(0, 10000) : null,
        p_component: payload.component || null,
        p_context: payload.context || null,
        p_metadata: (payload.metadata || {}) as Record<string, unknown>,
        p_environment: mapEnvironment(),
        p_app_version: APP_INFO.version || null,
        p_url: null,
        p_user_agent: `WeDo-RN/${APP_INFO.version} (${Platform.OS} ${Platform.Version})`,
      }),
    });

    return res.ok;
  } catch {
    // Silencieux : le monitoring ne doit jamais perturber l'app.
    return false;
  }
}

/**
 * Installe les handlers globaux : erreurs JS non interceptées + rejets de
 * promesses non gérés. Idempotent. À appeler une fois au démarrage de l'app.
 */
export function initAtlasErrorMonitor(): void {
  if (globalHandlersInstalled) return;
  globalHandlersInstalled = true;

  // 1) Erreurs JS globales (RN ErrorUtils)
  try {
    const errorUtils = (global as any)?.ErrorUtils;
    if (errorUtils?.setGlobalHandler) {
      const previous = errorUtils.getGlobalHandler?.();
      errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
        if (!isIgnorableError(error)) {
          const err = error as Error;
          void captureError({
            message: err?.message ? String(err.message) : String(error),
            stack: err?.stack ?? null,
            severity: isFatal ? 'critical' : 'error',
            context: isFatal ? 'fatal-js-error' : 'js-error',
          });
        }
        // Toujours déléguer au handler d'origine (affiche la red box en dev,
        // termine proprement en prod).
        if (typeof previous === 'function') previous(error, isFatal);
      });
    }
  } catch {
    /* non-critique */
  }

  // 2) Rejets de promesses non gérés (best-effort, sans casser RN)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const tracking = require('promise/setimmediate/rejection-tracking');
    tracking?.enable?.({
      allRejections: true,
      onUnhandled: (_id: number, error: unknown) => {
        if (!isIgnorableError(error)) {
          const err = error as Error;
          void captureError({
            message: err?.message ? String(err.message) : String(error),
            stack: err?.stack ?? null,
            severity: 'error',
            context: 'unhandled-promise-rejection',
          });
        }
      },
      onHandled: () => {},
    });
  } catch {
    /* le tracking n'est pas dispo — on ignore */
  }
}

export default {captureError, initAtlasErrorMonitor};
