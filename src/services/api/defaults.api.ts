/**
 * Defaults API Service — cycle de vie de la cotisation & gestion des défauts.
 *
 *  Réputation d'abord, caution en option, justice en dernier recours (brief Atlas).
 *  Tout le calcul monétaire (bigint) est côté serveur (RPC SECURITY DEFINER) ;
 *  rien ici ne débite le compte cantonné.
 *
 *  - assignerOrdre        : ordre de passage par score (override journalisé).
 *  - deposerCaution       : caution séquestrée liée à une position précoce (self).
 *  - couvrirManque        : la caution couvre un impayé, l'avance devient une dette.
 *  - constaterDefaut      : défaut après versement -> caution + dette + preuve + score.
 *  - desister             : désistement avant versement -> remboursement net / cession.
 *  - regulariserDette     : recouvrement + réhabilitation du score quand soldée.
 *  - getDebts / getCautions / getMyDebts : lecture (RLS : self ou organisatrice).
 */

import {supabase} from '@services/supabase';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';

export type CautionMode = 'none' | 'early_position' | 'all';
export type ResidualRule = 'mutualise' | 'organisatrice';
export type MemberState =
  | 'actif' | 'en_retard' | 'en_defaut' | 'desiste' | 'exclu' | 'remplace' | 'termine';
export type DebtStatus = 'open' | 'recovering' | 'settled' | 'written_off';

export interface Debt {
  id: string;
  tontineId: string;
  userId: string;
  principalFcfa: number;
  recoveredFcfa: number;
  status: DebtStatus;
  proofHash?: string;
  createdAt: string;
  debtorName?: string;
}

export interface Caution {
  id: string;
  tontineId: string;
  userId: string;
  amountFcfa: number;
  status: 'held' | 'consumed' | 'released';
  holderName?: string;
}

type RpcResult = {success: boolean; error?: string; [k: string]: any};

const callRpc = async (fn: string, args: Record<string, any>): Promise<RpcResult> => {
  if (!IS_SUPABASE_CONFIGURED) return {success: true};
  const {data, error} = await supabase.rpc(fn, args);
  if (error) return {success: false, error: error.message};
  return (data ?? {success: true}) as RpcResult;
};

/** Paramètres anti-défaut d'une tontine (champs omis = inchangés). Organisatrice. */
export const setDefaultsConfig = (
  tontineId: string,
  cfg: {
    orderByScore?: boolean;
    cautionMode?: CautionMode;
    cautionRateBps?: number;
    residualRule?: ResidualRule;
    recoveryThresholdFcfa?: number;
  },
) =>
  callRpc('set_defaults_config', {
    p_tontine: tontineId,
    p_order_by_score: cfg.orderByScore ?? null,
    p_caution_mode: cfg.cautionMode ?? null,
    p_caution_rate_bps: cfg.cautionRateBps ?? null,
    p_residual_rule: cfg.residualRule ?? null,
    p_recovery_threshold_fcfa: cfg.recoveryThresholdFcfa ?? null,
  });

/** Ordre de passage par score (organisatrice). */
export const assignerOrdre = (tontineId: string) =>
  callRpc('assigner_ordre', {p_tontine: tontineId});

/** Déposer/mettre à jour sa caution (montant en FCFA entier). */
export const deposerCaution = (tontineId: string, amountFcfa: number) =>
  callRpc('deposer_caution', {p_tontine: tontineId, p_amount: Math.round(amountFcfa)});

/** Couvrir un impayé d'un tour par la caution (organisatrice). */
export const couvrirManque = (tontineId: string, round: number, userId: string) =>
  callRpc('couvrir_manque', {p_tontine: tontineId, p_round: round, p_user: userId});

/** Constater un défaut après versement (organisatrice). */
export const constaterDefaut = (tontineId: string, userId: string, reason?: string) =>
  callRpc('constater_defaut', {p_tontine: tontineId, p_user: userId, p_reason: reason ?? null});

/** Désistement avant d'avoir touché (self ou organisatrice). */
export const desister = (tontineId: string, userId: string) =>
  callRpc('desister', {p_tontine: tontineId, p_user: userId});

/** Régulariser tout ou partie d'une dette (organisatrice). */
export const regulariserDette = (debtId: string, amountFcfa: number) =>
  callRpc('regulariser_dette', {p_debt: debtId, p_amount: Math.round(amountFcfa)});

/** S'inscrire sur la liste d'attente d'une tontine (remplaçant potentiel). */
export const rejoindreListeAttente = async (tontineId: string): Promise<RpcResult> => {
  if (!IS_SUPABASE_CONFIGURED) return {success: true};
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {success: false, error: 'Non authentifié'};
  const {error} = await supabase
    .from('waitlist')
    .upsert({tontine_id: tontineId, user_id: user.id}, {onConflict: 'tontine_id,user_id'});
  return error ? {success: false, error: error.message} : {success: true};
};

/** Dettes d'une tontine (organisatrice voit toutes, membre voit les siennes via RLS). */
export const getDebts = async (tontineId: string): Promise<Debt[]> => {
  if (!IS_SUPABASE_CONFIGURED) return [];
  const {data} = await supabase
    .from('debts')
    .select('id, tontine_id, user_id, principal_fcfa, recovered_fcfa, status, proof_hash, created_at, debtor:profiles!debts_user_id_fkey(nom_public)')
    .eq('tontine_id', tontineId)
    .order('created_at', {ascending: false});
  return (data || []).map((d: any) => ({
    id: d.id, tontineId: d.tontine_id, userId: d.user_id,
    principalFcfa: d.principal_fcfa, recoveredFcfa: d.recovered_fcfa,
    status: d.status, proofHash: d.proof_hash ?? undefined, createdAt: d.created_at,
    debtorName: d.debtor?.nom_public ?? undefined,
  }));
};

/** Mes dettes (toutes tontines confondues). */
export const getMyDebts = async (): Promise<Debt[]> => {
  if (!IS_SUPABASE_CONFIGURED) return [];
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return [];
  const {data} = await supabase
    .from('debts')
    .select('id, tontine_id, user_id, principal_fcfa, recovered_fcfa, status, proof_hash, created_at, tontine:tontines(name)')
    .eq('user_id', user.id)
    .order('created_at', {ascending: false});
  return (data || []).map((d: any) => ({
    id: d.id, tontineId: d.tontine_id, userId: d.user_id,
    principalFcfa: d.principal_fcfa, recoveredFcfa: d.recovered_fcfa,
    status: d.status, proofHash: d.proof_hash ?? undefined, createdAt: d.created_at,
    debtorName: d.tontine?.name ?? undefined,
  }));
};

/** Cautions d'une tontine (RLS : self ou organisatrice). */
export const getCautions = async (tontineId: string): Promise<Caution[]> => {
  if (!IS_SUPABASE_CONFIGURED) return [];
  const {data} = await supabase
    .from('cautions')
    .select('id, tontine_id, user_id, amount_fcfa, status, holder:profiles!cautions_user_id_fkey(nom_public)')
    .eq('tontine_id', tontineId);
  return (data || []).map((c: any) => ({
    id: c.id, tontineId: c.tontine_id, userId: c.user_id,
    amountFcfa: c.amount_fcfa, status: c.status,
    holderName: c.holder?.nom_public ?? undefined,
  }));
};

export default {
  setDefaultsConfig, assignerOrdre, deposerCaution, couvrirManque, constaterDefaut,
  desister, regulariserDette, rejoindreListeAttente, getDebts, getMyDebts, getCautions,
};
