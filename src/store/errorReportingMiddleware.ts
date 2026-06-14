/**
 * errorReportingMiddleware
 * ------------------------------------------------------------------
 * Remonte à la console Atlas Studio (Error Monitor / app `wedo`) toutes les
 * erreurs des thunks Redux Toolkit (actions « /rejected »). C'est le point
 * central de supervision : les services `api/*` laissent remonter leurs erreurs
 * jusqu'aux
 * thunks, qui les transforment en actions `rejected` (donc PAS en rejets de
 * promesse non gérés). Sans ce middleware, ces erreurs métier resteraient
 * invisibles côté console.
 *
 * Garde-fous :
 *  - n'envoie JAMAIS d'argument de thunk (peut contenir des données perso :
 *    téléphone, montants, identité) — seulement le type d'action + le message.
 *  - ignore les thunks annulés (`meta.aborted`) et court-circuités
 *    (`ConditionError`) : ce ne sont pas de vraies erreurs.
 *  - silencieux : ne casse jamais le dispatch (captureError ne throw pas).
 */

import type {Middleware} from '@reduxjs/toolkit';
import {captureError} from '@services/monitoring/atlasErrorMonitor';

interface RejectedActionLike {
  type: string;
  error?: {name?: string; message?: string; stack?: string};
  payload?: unknown;
  meta?: {aborted?: boolean};
}

export const errorReportingMiddleware: Middleware =
  () => next => (action: unknown) => {
    try {
      const a = action as RejectedActionLike;
      if (a && typeof a.type === 'string' && a.type.endsWith('/rejected')) {
        const err = a.error ?? {};
        const aborted = a.meta?.aborted === true;
        const isCondition = err.name === 'ConditionError' || err.name === 'AbortError';

        if (!aborted && !isCondition) {
          // rejectWithValue(payload) → payload ; sinon throw → action.error
          const payloadMsg =
            typeof a.payload === 'string'
              ? a.payload
              : a.payload && typeof a.payload === 'object' && 'message' in a.payload
                ? String((a.payload as {message?: unknown}).message ?? '')
                : null;
          const message = payloadMsg || err.message || `Thunk rejeté: ${a.type}`;

          void captureError({
            message,
            stack: err.stack ?? null,
            component: a.type.replace('/rejected', ''),
            context: 'redux-thunk-rejected',
            severity: 'error',
            // metadata volontairement minimale (pas d'arg → pas de fuite de données perso)
            metadata: {actionType: a.type},
          });
        }
      }
    } catch {
      /* le monitoring ne doit jamais perturber le dispatch */
    }
    return next(action);
  };

export default errorReportingMiddleware;
