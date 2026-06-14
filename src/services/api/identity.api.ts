/**
 * Identity API Service — the portable PERSON layer.
 *
 *  - Score de fiabilité v1   : indexed on the personne, not the account.
 *  - Onboarding paliers P0→P2 : phone (P0) / wallet+selfie (P1) / CNI+face-match (P2).
 *  - verifyKycP2             : CNI + face-match + liveness via the kyc-verify edge fn.
 */

import {supabase} from '@services/supabase';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';

export interface ReliabilityScore {
  personneId: string;
  valeur: number; // 0..100
  totalCotisations: number;
  cotisationsHeure: number;
  retards: number;
  defauts: number;
}

export interface ScoreEvent {
  id: string;
  delta: number;
  raison: string;
  tontineId?: string;
  createdAt: string;
}

export interface PersonneInfo {
  id: string;
  displayName?: string;
  palier: 0 | 1 | 2;
  parrainePar?: string;
}

/** Current user's personne (identity tier + sponsor). */
export const getMyPersonne = async (): Promise<PersonneInfo | null> => {
  if (!IS_SUPABASE_CONFIGURED) {
    return {id: 'demo-p', displayName: 'Démo', palier: 1};
  }
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return null;
  const {data: compte} = await supabase
    .from('comptes')
    .select('personne_id, personnes(id, display_name, palier, parraine_par)')
    .eq('profile_id', user.id)
    .maybeSingle();
  const p: any = (compte as any)?.personnes;
  if (!p) return null;
  return {
    id: p.id,
    displayName: p.display_name ?? undefined,
    palier: (p.palier ?? 0) as 0 | 1 | 2,
    parrainePar: p.parraine_par ?? undefined,
  };
};

/** Portable reliability score for the current user (or a given personne). */
export const getMyScore = async (
  personneId?: string,
): Promise<ReliabilityScore | null> => {
  if (!IS_SUPABASE_CONFIGURED) {
    return {
      personneId: personneId ?? 'demo-p',
      valeur: 72,
      totalCotisations: 14,
      cotisationsHeure: 12,
      retards: 2,
      defauts: 0,
    };
  }
  let pid = personneId;
  if (!pid) {
    const me = await getMyPersonne();
    pid = me?.id;
  }
  if (!pid) return null;
  const {data, error} = await supabase
    .from('scores')
    .select('*')
    .eq('personne_id', pid)
    .maybeSingle();
  if (error || !data) return null;
  return {
    personneId: data.personne_id,
    valeur: data.valeur,
    totalCotisations: data.total_cotisations,
    cotisationsHeure: data.cotisations_heure,
    retards: data.retards,
    defauts: data.defauts,
  };
};

/** Recent reliability-score events (history). */
export const getScoreHistory = async (
  personneId?: string,
): Promise<ScoreEvent[]> => {
  if (!IS_SUPABASE_CONFIGURED) return [];
  let pid = personneId;
  if (!pid) pid = (await getMyPersonne())?.id;
  if (!pid) return [];
  const {data} = await supabase
    .from('score_events')
    .select('*')
    .eq('personne_id', pid)
    .order('created_at', {ascending: false})
    .limit(30);
  return (data || []).map((e: any) => ({
    id: e.id,
    delta: e.delta,
    raison: e.raison,
    tontineId: e.tontine_id ?? undefined,
    createdAt: e.created_at,
  }));
};

export interface KycP2Input {
  cniNumber: string;
  selfieRef: string;
  faceMatchScore?: number;
  livenessScore?: number;
}

export interface KycP2Result {
  success: boolean;
  palier?: number;
  error?: string;
  duplicate?: boolean;
}

/** Promote the current user to P2 via CNI + face-match + liveness (edge fn). */
export const verifyKycP2 = async (input: KycP2Input): Promise<KycP2Result> => {
  if (!IS_SUPABASE_CONFIGURED) {
    return {success: true, palier: 2};
  }
  const {data, error} = await supabase.functions.invoke('kyc-verify', {
    body: input,
  });
  if (error) {
    // edge fn returns 4xx with a JSON body; surface its message if present
    const ctx: any = (error as any)?.context;
    return {
      success: false,
      error: ctx?.error || error.message || 'Échec de la vérification',
      duplicate: ctx?.duplicate,
    };
  }
  return {
    success: !!data?.success,
    palier: data?.palier,
    error: data?.error,
    duplicate: data?.duplicate,
  };
};

/* ─────────────────────────────────────────────────────────────────────────────
 * KYC manuel (gratuit) : CNI recto/verso + selfie -> revue humaine -> palier P2.
 * Les images vont dans le bucket privé `wedo-kyc` sous le dossier de l'utilisateur ;
 * la soumission passe par la RPC submit_kyc.
 * ──────────────────────────────────────────────────────────────────────────── */
export type KycDocKind = 'recto' | 'verso' | 'selfie';
export interface KycSubmission {
  status: 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  reason?: string;
}

/** Upload une image KYC dans le dossier privé de l'utilisateur. Renvoie le chemin. */
export const uploadKycImage = async (uri: string, kind: KycDocKind): Promise<string> => {
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  const path = `${user.id}/${kind}.jpg`;
  const blob = await (await fetch(uri)).blob();
  const {error} = await supabase.storage
    .from('wedo-kyc')
    .upload(path, blob, {upsert: true, contentType: 'image/jpeg'});
  if (error) throw new Error(error.message);
  return path;
};

/** Soumet le dossier KYC complet (upload des 3 images + RPC). */
export const submitKyc = async (input: {
  cniNumber: string;
  rectoUri: string;
  versoUri: string;
  selfieUri: string;
}): Promise<{success: boolean; status?: string; error?: string}> => {
  if (!IS_SUPABASE_CONFIGURED) return {success: true, status: 'pending'};
  const recto = await uploadKycImage(input.rectoUri, 'recto');
  const verso = await uploadKycImage(input.versoUri, 'verso');
  const selfie = await uploadKycImage(input.selfieUri, 'selfie');
  const {data, error} = await supabase.rpc('submit_kyc', {
    p_cni_number: input.cniNumber, p_recto: recto, p_verso: verso, p_selfie: selfie,
  });
  if (error) throw new Error(error.message);
  return data as any;
};

/** Statut de ma soumission KYC (null si jamais soumis). */
export const getMyKyc = async (): Promise<KycSubmission | null> => {
  if (!IS_SUPABASE_CONFIGURED) return null;
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return null;
  const {data} = await supabase
    .from('kyc_submissions')
    .select('status, submitted_at, reason')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!data) return null;
  return {status: (data as any).status, submittedAt: (data as any).submitted_at, reason: (data as any).reason ?? undefined};
};

export default {getMyPersonne, getMyScore, getScoreHistory, verifyKycP2, uploadKycImage, submitKyc, getMyKyc};
