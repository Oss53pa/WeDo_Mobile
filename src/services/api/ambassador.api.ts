/**
 * Ambassador program API (WEDO-AMB-08). Reads are RLS-scoped to the current user;
 * writes go through SECURITY DEFINER RPCs (charter / code / attach). Money stays
 * server-side bigint — the client only displays amounts.
 */
import {supabase} from '@services/supabase';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';

export type AmbassadorTier = 'bronze' | 'argent' | 'or' | null;

export interface Filleule {
  referralId: string;
  name: string;
  qualified: boolean;
  joinedAt: string;
}
export interface AmbassadorPayout {
  id: string;
  periodMonth: string;
  tier: string;
  totalFcfa: number;
  status: string;
  momoRef?: string;
}
export interface AmbassadorState {
  isAmbassador: boolean;
  charterAccepted: boolean;
  code?: string;
  monthBaseFcfa: number;     // récompenses accumulées ce mois
  monthCount: number;        // tontines qualifiées ce mois
  tier: AmbassadorTier;
  filleules: Filleule[];
  payouts: AmbassadorPayout[];
}

const TIER_OF = (n: number): AmbassadorTier =>
  n >= 10 ? 'or' : n >= 4 ? 'argent' : n >= 1 ? 'bronze' : null;

const DEMO: AmbassadorState = {
  isAmbassador: true,
  charterAccepted: true,
  code: 'AWA4F2',
  monthBaseFcfa: 12000,
  monthCount: 3,
  tier: 'bronze',
  filleules: [
    {referralId: '1', name: 'Mariam K.', qualified: true, joinedAt: '2026-06-01'},
    {referralId: '2', name: 'Tata B.', qualified: false, joinedAt: '2026-06-08'},
  ],
  payouts: [
    {id: 'p1', periodMonth: '2026-05-01', tier: 'bronze', totalFcfa: 8000, status: 'sent', momoRef: 'OM-2025'},
  ],
};

export const getAmbassadorState = async (): Promise<AmbassadorState> => {
  if (!IS_SUPABASE_CONFIGURED) return DEMO;
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const {data: profile} = await supabase
    .from('ambassador_profiles')
    .select('id, is_ambassador, charter_accepted_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) {
    return {isAmbassador: false, charterAccepted: false, monthBaseFcfa: 0, monthCount: 0, tier: null, filleules: [], payouts: []};
  }

  const ambId = (profile as any).id;
  const [{data: codeRow}, {data: refs}, {data: rewards}, {data: payouts}] = await Promise.all([
    supabase.from('referral_codes').select('code').eq('ambassador_id', ambId).maybeSingle(),
    supabase.from('referrals').select('id, referee_user_id, created_at, profiles:referee_user_id(nom_public)').eq('ambassador_id', ambId),
    supabase.from('reward_events').select('id, referral_id, reward_fcfa, status, qualified_at').eq('ambassador_id', ambId),
    supabase.from('payouts').select('id, period_month, tier, total_fcfa, status, momo_ref').eq('ambassador_id', ambId).order('period_month', {ascending: false}),
  ]);

  // Mois en cours
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRewards = (rewards || []).filter(
    (r: any) => ['accrued', 'paid'].includes(r.status) && new Date(r.qualified_at) >= monthStart,
  );
  const monthBaseFcfa = monthRewards.reduce((s: number, r: any) => s + Number(r.reward_fcfa), 0);
  const monthCount = monthRewards.length;
  const qualifiedReferralIds = new Set((rewards || []).map((r: any) => r.referral_id));

  const filleules: Filleule[] = (refs || []).map((r: any) => ({
    referralId: r.id,
    name: r.profiles?.nom_public ?? 'Filleule',
    qualified: qualifiedReferralIds.has(r.id),
    joinedAt: r.created_at,
  }));

  return {
    isAmbassador: !!(profile as any).is_ambassador,
    charterAccepted: !!(profile as any).charter_accepted_at,
    code: (codeRow as any)?.code,
    monthBaseFcfa,
    monthCount,
    tier: TIER_OF(monthCount),
    filleules,
    payouts: (payouts || []).map((p: any) => ({
      id: p.id, periodMonth: p.period_month, tier: p.tier,
      totalFcfa: Number(p.total_fcfa), status: p.status, momoRef: p.momo_ref ?? undefined,
    })),
  };
};

export const acceptCharter = async (): Promise<any> => {
  if (!IS_SUPABASE_CONFIGURED) return {success: true};
  const {data, error} = await supabase.rpc('accept_ambassador_charter');
  if (error) throw new Error(error.message);
  return data;
};

export const generateCode = async (): Promise<{success: boolean; code?: string; error?: string; need?: string}> => {
  if (!IS_SUPABASE_CONFIGURED) return {success: true, code: 'AWA4F2'};
  const {data, error} = await supabase.rpc('generate_referral_code');
  if (error) throw new Error(error.message);
  return data as any;
};

export const attachReferral = async (code: string): Promise<any> => {
  if (!IS_SUPABASE_CONFIGURED) return {success: true};
  const {data, error} = await supabase.rpc('attach_referral', {p_code: code.trim().toUpperCase()});
  if (error) throw new Error(error.message);
  return data;
};

export default {getAmbassadorState, acceptCharter, generateCode, attachReferral};
