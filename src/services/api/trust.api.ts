/**
 * Trust API Service — the MVP "0 perte, 0 litige" surface.
 *
 *  - Registre infalsifiable : the SHA-256 hash-chained `mouvements` ledger.
 *  - verifierRegistre        : independent chain + escrow-conservation proof.
 *  - Séquestre               : EME "cantonnement" escrow balance (P2-gated).
 *  - Organizer overview      : payments / round / members at risk.
 */

import {supabase} from '@services/supabase';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';

export type MouvementType =
  | 'cotisation'
  | 'distribution'
  | 'penalite'
  | 'remboursement'
  | 'depot_sequestre'
  | 'retrait_sequestre';

export interface Mouvement {
  id: string;
  tontineId: string;
  seq: number;
  type: MouvementType;
  sens: 'credit' | 'debit';
  montant: number;
  personneId?: string;
  round?: number;
  referenceExterne?: string;
  prevHash: string;
  hash: string;
  createdAt: string;
}

export interface RegistreVerification {
  valid: boolean;
  length: number;
  brokenAtSeq: number | null;
  soldeCalcule: number;
  soldeSequestre: number;
  conservationOk: boolean;
  error?: string;
}

export interface Sequestre {
  id: string;
  tontineId: string;
  emeAccountRef: string;
  provider: string;
  soldeCantonne: number;
  devise: string;
}

const mapMouvement = (r: any): Mouvement => ({
  id: r.id,
  tontineId: r.tontine_id,
  seq: r.seq,
  type: r.type,
  sens: r.sens,
  montant: r.montant,
  personneId: r.personne_id ?? undefined,
  round: r.round ?? undefined,
  referenceExterne: r.reference_externe ?? undefined,
  prevHash: r.prev_hash,
  hash: r.hash,
  createdAt: r.created_at,
});

const demoRegistre = (tontineId: string): Mouvement[] => {
  const base = ['cotisation', 'cotisation', 'cotisation', 'distribution'] as const;
  let prev = '0';
  return base.map((type, i) => {
    const hash = `demo${i}${'0'.repeat(60)}`.slice(0, 64);
    const m: Mouvement = {
      id: `demo-m-${i}`,
      tontineId,
      seq: i + 1,
      type,
      sens: type === 'distribution' ? 'debit' : 'credit',
      montant: type === 'distribution' ? 30000 : 10000,
      round: 1,
      prevHash: prev,
      hash,
      createdAt: new Date(Date.now() - (4 - i) * 36e5).toISOString(),
    };
    prev = hash;
    return m;
  });
};

/** Full chronological ledger for a tontine (registre infalsifiable). */
export const getRegistre = async (tontineId: string): Promise<Mouvement[]> => {
  if (!IS_SUPABASE_CONFIGURED) return demoRegistre(tontineId);
  const {data, error} = await supabase
    .from('mouvements')
    .select('*')
    .eq('tontine_id', tontineId)
    .order('seq', {ascending: true});
  if (error) throw new Error(error.message);
  return (data || []).map(mapMouvement);
};

/** Independently recompute the SHA-256 chain + verify escrow conservation. */
export const verifierRegistre = async (
  tontineId: string,
): Promise<RegistreVerification> => {
  if (!IS_SUPABASE_CONFIGURED) {
    const reg = demoRegistre(tontineId);
    return {
      valid: true,
      length: reg.length,
      brokenAtSeq: null,
      soldeCalcule: 0,
      soldeSequestre: 0,
      conservationOk: true,
    };
  }
  const {data, error} = await supabase.rpc('verifier_registre', {
    p_tontine_id: tontineId,
  });
  if (error) throw new Error(error.message);
  return {
    valid: !!data?.valid,
    length: data?.length ?? 0,
    brokenAtSeq: data?.broken_at_seq ?? null,
    soldeCalcule: data?.solde_calcule ?? 0,
    soldeSequestre: data?.solde_sequestre ?? 0,
    conservationOk: !!data?.conservation_ok,
    error: data?.error,
  };
};

/** Escrow (séquestre) for a tontine — RLS-gated to P2 members. */
export const getSequestre = async (
  tontineId: string,
): Promise<Sequestre | null> => {
  if (!IS_SUPABASE_CONFIGURED) {
    return {
      id: 'demo-seq',
      tontineId,
      emeAccountRef: 'SBX-CANTON-DEMO',
      provider: 'sandbox',
      soldeCantonne: 0,
      devise: 'XOF',
    };
  }
  const {data, error} = await supabase
    .from('sequestres')
    .select('*')
    .eq('tontine_id', tontineId)
    .maybeSingle();
  if (error) {
    // RLS denial (non-P2) surfaces as no row — treat as "gated", not an error
    return null;
  }
  if (!data) return null;
  return {
    id: data.id,
    tontineId: data.tontine_id,
    emeAccountRef: data.eme_account_ref,
    provider: data.provider,
    soldeCantonne: data.solde_cantonne,
    devise: data.devise,
  };
};

export interface OrganizerOverview {
  round: number;
  totalRounds: number;
  paidCount: number;
  activeCount: number;
  nextDueDate?: string;
  membersAtRisk: Array<{
    userId: string;
    fullName: string;
    status: string;
    round: number;
    dueDate: string;
  }>;
}

/** Organizer dashboard data: current round, payments, members at risk. */
export const getOrganizerOverview = async (
  tontineId: string,
): Promise<OrganizerOverview> => {
  if (!IS_SUPABASE_CONFIGURED) {
    return {round: 1, totalRounds: 3, paidCount: 2, activeCount: 3, membersAtRisk: []};
  }
  const {data: tontine} = await supabase
    .from('tontines')
    .select('current_round, total_rounds')
    .eq('id', tontineId)
    .single();
  const round = tontine?.current_round || 1;

  const {count: activeCount} = await supabase
    .from('tontine_members')
    .select('id', {count: 'exact', head: true})
    .eq('tontine_id', tontineId)
    .eq('status', 'Active');

  const {data: contribs} = await supabase
    .from('contributions')
    .select('user_id, status, round, due_date, profiles(full_name)')
    .eq('tontine_id', tontineId)
    .eq('round', round);

  const paidCount = (contribs || []).filter((c: any) => c.status === 'Paid').length;
  const membersAtRisk = (contribs || [])
    .filter((c: any) => c.status === 'Late' || c.status === 'Failed')
    .map((c: any) => ({
      userId: c.user_id,
      fullName: c.profiles?.full_name ?? 'Membre',
      status: c.status,
      round: c.round,
      dueDate: c.due_date,
    }));

  const nextDueDate = (contribs || [])
    .filter((c: any) => c.status !== 'Paid')
    .map((c: any) => c.due_date)
    .sort()[0];

  return {
    round,
    totalRounds: tontine?.total_rounds || 0,
    paidCount,
    activeCount: activeCount ?? 0,
    nextDueDate,
    membersAtRisk,
  };
};

export default {getRegistre, verifierRegistre, getSequestre, getOrganizerOverview};
