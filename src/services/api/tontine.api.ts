/**
 * Tontine API Service
 * Handles all tontine-related queries via Supabase
 */

import {supabase} from '@services/supabase';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';
import {
  demoTontines,
  demoPublicTontines,
  demoTontineDetails,
} from '@services/demo/demoData';
import {
  Tontine,
  TontineDetail,
  CreateTontineData,
  JoinTontineRequest,
  TontineFilters,
  PaginatedResponse,
} from '@types';

const DEMO_OK = {success: true} as const;

/**
 * Map a tontine row to Tontine object
 */
const mapTontine = (row: any): Tontine => ({
  id: row.id,
  name: row.name,
  description: row.description || undefined,
  category: row.category as any,
  type: row.type as any,
  creatorId: row.creator_id,
  contributionAmount: row.contribution_amount,
  currency: row.currency,
  frequency: row.frequency as any,
  totalMembers: row.total_members,
  currentMembers: row.current_members,
  startDate: row.start_date,
  status: row.status as any,
  distributionOrder: row.distribution_order as any,
  latePenaltyPercent: Number(row.late_penalty_percent),
  gracePeriodDays: row.grace_period_days,
  minReputationRequired: row.min_reputation_required,
  isPublic: row.is_public,
  depositAmount: row.deposit_amount,
  photoUrl: row.photo_url || undefined,
  inviteCode: row.invite_code || undefined,
  tauxServiceBps: row.taux_service_bps ?? 80,
  fraisTotal: row.frais_total ?? 0,
  beneficiairesParTour: row.beneficiaires_par_tour ?? 1,
  totalRounds: row.total_rounds ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Get user's tontines (through membership)
 */
export const getMyTontines = async (): Promise<Tontine[]> => {
  if (!IS_SUPABASE_CONFIGURED) return demoTontines;
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const {data, error} = await supabase
    .from('tontine_members')
    .select('tontine_id, tontines(*)')
    .eq('user_id', user.id)
    .in('status', ['Active', 'Pending']);

  if (error) throw new Error(error.message);

  return (data || [])
    .filter((d: any) => d.tontines)
    .map((d: any) => mapTontine(d.tontines));
};

export interface Conversation {
  tontineId: string;
  tontineName: string;
  photoUrl?: string;
  memberCount: number;
  status: string;
  lastMessage?: string;
  lastMessageSender?: string;
  lastMessageTime?: string;
}

/**
 * Conversations list = the user's tontines, each with its latest chat message.
 */
export const getConversations = async (): Promise<Conversation[]> => {
  if (!IS_SUPABASE_CONFIGURED) {
    return demoTontines.map(t => ({
      tontineId: t.id,
      tontineName: t.name,
      photoUrl: t.photoUrl,
      memberCount: t.currentMembers,
      status: t.status,
      lastMessage: 'Touchez pour discuter avec les membres',
      lastMessageSender: '',
      lastMessageTime: t.updatedAt,
    }));
  }
  const tontines = await getMyTontines();
  const convos = await Promise.all(
    tontines.map(async t => {
      const {data} = await supabase
        .from('messages')
        .select('content, created_at, profiles:sender_id(nom_public)')
        .eq('tontine_id', t.id)
        .order('created_at', {ascending: false})
        .limit(1)
        .maybeSingle();
      return {
        tontineId: t.id,
        tontineName: t.name,
        photoUrl: t.photoUrl,
        memberCount: t.currentMembers,
        status: t.status,
        lastMessage: (data as any)?.content ?? undefined,
        lastMessageSender: (data as any)?.profiles?.nom_public ?? undefined,
        lastMessageTime: (data as any)?.created_at ?? undefined,
      } as Conversation;
    }),
  );
  // Most-recently-active conversations first.
  return convos.sort((a, b) =>
    (b.lastMessageTime ?? '').localeCompare(a.lastMessageTime ?? ''),
  );
};

/**
 * Get public tontines with filters
 */
export const getPublicTontines = async (
  filters: TontineFilters = {},
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedResponse<Tontine>> => {
  if (!IS_SUPABASE_CONFIGURED) {
    let list = demoPublicTontines;
    if (filters.category) list = list.filter(t => t.category === filters.category);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        t => t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q),
      );
    }
    return {
      data: list,
      pagination: {page, limit, total: list.length, totalPages: 1, hasNext: false, hasPrev: false},
    };
  }
  let query = supabase
    .from('tontines')
    .select('*', {count: 'exact'})
    .eq('is_public', true)
    .in('status', ['Open', 'Active']);

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.minAmount) query = query.gte('contribution_amount', filters.minAmount);
  if (filters.maxAmount) query = query.lte('contribution_amount', filters.maxAmount);
  if (filters.frequency) query = query.eq('frequency', filters.frequency);
  if (filters.minReputation) query = query.gte('min_reputation_required', filters.minReputation);
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const {data, error, count} = await query
    .order('created_at', {ascending: false})
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count || 0;
  return {
    data: (data || []).map(mapTontine),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

/**
 * Get tontine detail by ID
 */
export const getTontineDetail = async (tontineId: string): Promise<TontineDetail> => {
  if (!IS_SUPABASE_CONFIGURED) {
    return (
      demoTontineDetails[tontineId] ||
      demoTontineDetails[Object.keys(demoTontineDetails)[0]]
    );
  }
  const {data: tontine, error} = await supabase
    .from('tontines')
    .select('*')
    .eq('id', tontineId)
    .single();

  if (error) throw new Error(error.message);

  // Fetch members with profile info
  const {data: members} = await supabase
    .from('tontine_members')
    .select('*, profiles(id, nom_public, profile_photo_url, reputation_score, reputation_level)')
    .eq('tontine_id', tontineId)
    .order('joined_at', {ascending: true});

  const mappedMembers = (members || []).map((m: any) => ({
    id: m.id,
    tontineId: m.tontine_id,
    userId: m.user_id,
    user: m.profiles ? {
      id: m.profiles.id,
      fullName: m.profiles.nom_public,
      profilePhotoUrl: m.profiles.profile_photo_url,
      reputationScore: m.profiles.reputation_score,
      reputationLevel: m.profiles.reputation_level,
    } : undefined,
    role: m.role as any,
    status: m.status as any,
    receptionOrder: m.reception_order,
    nbTetes: m.nb_tetes ?? 1,
    joinedAt: m.joined_at,
    totalContributed: m.total_contributed,
    totalReceived: m.total_received,
    latePaymentsCount: m.late_payments_count,
    isCurrentBeneficiary: m.is_current_beneficiary,
    hasReceived: m.has_received,
  }));

  const nextBeneficiary = mappedMembers.find((m: any) => m.isCurrentBeneficiary);

  return {
    ...mapTontine(tontine),
    members: mappedMembers,
    currentRound: tontine.current_round,
    totalRounds: tontine.total_rounds,
    currentBalance: tontine.current_balance,
    nextBeneficiary,
  };
};

/**
 * Create a new tontine
 */
export const createTontine = async (data: CreateTontineData): Promise<Tontine> => {
  if (!IS_SUPABASE_CONFIGURED) {
    return {
      id: `t-${Date.now()}`,
      name: data.name,
      description: data.description,
      category: data.category as any,
      type: data.type as any,
      creatorId: 'demo-user',
      contributionAmount: data.contributionAmount,
      currency: data.currency || 'XOF',
      frequency: data.frequency as any,
      totalMembers: data.totalMembers,
      currentMembers: 1,
      startDate: data.startDate,
      status: 'Open' as any,
      distributionOrder: data.distributionOrder as any,
      latePenaltyPercent: data.latePenaltyPercent,
      gracePeriodDays: data.gracePeriodDays,
      minReputationRequired: data.minReputationRequired,
      isPublic: data.isPublic,
      depositAmount: data.depositAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const {data: tontine, error} = await supabase
    .from('tontines')
    .insert({
      name: data.name,
      description: data.description || null,
      category: data.category,
      type: data.type,
      creator_id: user.id,
      contribution_amount: data.contributionAmount,
      currency: data.currency || 'XOF',
      frequency: data.frequency,
      total_members: data.totalMembers,
      current_members: 1,
      start_date: data.startDate,
      distribution_order: data.distributionOrder,
      late_penalty_percent: data.latePenaltyPercent,
      grace_period_days: data.gracePeriodDays,
      management_fee_percent: data.managementFeePercent || 0,
      min_reputation_required: data.minReputationRequired,
      is_public: data.isPublic,
      deposit_amount: data.depositAmount,
      photo_url: data.photoUrl || null,
      chat_enabled: data.enableChat,
      voting_enabled: true,
      auto_approve: data.autoApprove,
      allow_observers: data.allowObservers,
      total_rounds: data.totalMembers,
      beneficiaires_par_tour: data.beneficiairesParTour ?? 1,
      sequestre_active: data.sequestreActive ?? true,
      score_minimum: data.scoreMinimum ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Auto-add creator as Admin member
  await supabase.from('tontine_members').insert({
    tontine_id: tontine.id,
    user_id: user.id,
    role: 'Admin',
    status: 'Active',
    reception_order: 1,
    nb_tetes: data.creatorTetes ?? 1,
  });

  return mapTontine(tontine);
};

/**
 * Update tontine information (admin only)
 */
export const updateTontine = async (
  tontineId: string,
  data: Partial<CreateTontineData>,
): Promise<Tontine> => {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.photoUrl !== undefined) updateData.photo_url = data.photoUrl;
  if (data.isPublic !== undefined) updateData.is_public = data.isPublic;

  const {data: tontine, error} = await supabase
    .from('tontines')
    .update(updateData)
    .eq('id', tontineId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTontine(tontine);
};

/**
 * Delete a tontine (admin only, before start)
 */
export const deleteTontine = async (tontineId: string): Promise<{success: boolean}> => {
  const {error} = await supabase
    .from('tontines')
    .delete()
    .eq('id', tontineId);

  if (error) throw new Error(error.message);
  return {success: true};
};

/**
 * Join a tontine
 */
export const joinTontine = async (data: JoinTontineRequest): Promise<{success: boolean}> => {
  if (!IS_SUPABASE_CONFIGURED) return DEMO_OK;
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const {error} = await supabase.from('tontine_members').insert({
    tontine_id: data.tontineId,
    user_id: user.id,
    role: 'Member',
    status: 'Pending',
  });

  if (error) throw new Error(error.message);

  // Increment member count
  await supabase.rpc('increment_member_count', {p_tontine_id: data.tontineId});

  return {success: true};
};

/**
 * Join a tontine through the trust gate (reliability score_minimum + KYC P2 if
 * the tontine is under séquestre). Returns {success, error?, need?} from the RPC.
 */
export const rejoindreTontine = async (
  tontineId: string,
  parrainPersonneId?: string,
  nbTetes: number = 1,
): Promise<{success: boolean; error?: string; need?: 'P2' | 'SCORE'; already?: boolean}> => {
  if (!IS_SUPABASE_CONFIGURED) return {success: true};
  const {data, error} = await supabase.rpc('rejoindre_tontine', {
    p_tontine_id: tontineId,
    p_parrain_personne: parrainPersonneId ?? null,
    p_nb_tetes: Math.max(1, Math.floor(nbTetes)),
  });
  if (error) throw new Error(error.message);
  return data as any;
};

export interface JoinByCodeResult {
  success: boolean;
  error?: string;
  need?: 'P2' | 'SCORE';
  already?: boolean;
  tontineId?: string;
  tontineName?: string;
}

/**
 * Join a tontine using its 8-char invitation code. Same trust gate as
 * rejoindreTontine; also returns the resolved tontine id/name for navigation.
 */
export const rejoindreTontineParCode = async (
  code: string,
  nbTetes: number = 1,
): Promise<JoinByCodeResult> => {
  if (!IS_SUPABASE_CONFIGURED) {
    const demo = demoPublicTontines[0];
    return {success: true, tontineId: demo?.id, tontineName: demo?.name};
  }
  const {data, error} = await supabase.rpc('rejoindre_tontine_par_code', {
    p_code: code,
    p_nb_tetes: Math.max(1, Math.floor(nbTetes)),
  });
  if (error) throw new Error(error.message);
  return data as JoinByCodeResult;
};

/**
 * Leave a tontine
 */
export const leaveTontine = async (tontineId: string): Promise<{success: boolean}> => {
  if (!IS_SUPABASE_CONFIGURED) return DEMO_OK;
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const {error} = await supabase
    .from('tontine_members')
    .update({status: 'Expelled'})
    .eq('tontine_id', tontineId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  await supabase.rpc('decrement_member_count', {p_tontine_id: tontineId});

  return {success: true};
};

/**
 * Invite members to a tontine
 */
export const inviteMembers = async (
  tontineId: string,
  phoneNumbers: string[],
): Promise<{success: boolean; invitationsSent: number}> => {
  if (!IS_SUPABASE_CONFIGURED) return {success: true, invitationsSent: phoneNumbers.length};
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const invitations = phoneNumbers.map(phone => ({
    tontine_id: tontineId,
    inviter_id: user.id,
    invitee_phone: phone,
  }));

  const {error} = await supabase
    .from('tontine_invitations')
    .insert(invitations);

  if (error) throw new Error(error.message);

  return {success: true, invitationsSent: phoneNumbers.length};
};

/**
 * Remove a member (admin only)
 */
export const removeMember = async (
  tontineId: string,
  userId: string,
): Promise<{success: boolean}> => {
  if (!IS_SUPABASE_CONFIGURED) return DEMO_OK;
  const {error} = await supabase
    .from('tontine_members')
    .update({status: 'Expelled'})
    .eq('tontine_id', tontineId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  await supabase.rpc('decrement_member_count', {p_tontine_id: tontineId});

  return {success: true};
};

export interface MyActivationFee {
  fraisDu: number;
  fraisPaye: boolean;
}

/** Read the current user's activation-fee status for a tontine. */
export const getMyActivationFee = async (
  tontineId: string,
): Promise<MyActivationFee> => {
  if (!IS_SUPABASE_CONFIGURED) return {fraisDu: 0, fraisPaye: true};
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {fraisDu: 0, fraisPaye: true};
  const {data} = await supabase
    .from('tontine_members')
    .select('frais_du, frais_paye')
    .eq('tontine_id', tontineId)
    .eq('user_id', user.id)
    .maybeSingle();
  return {
    fraisDu: Number(data?.frais_du ?? 0),
    fraisPaye: Boolean(data?.frais_paye ?? false),
  };
};

export interface ActivationResult {
  success: boolean;
  already?: boolean;
  error?: string;
  n?: number;
  mts?: number;
  fraisTotal?: number;
  fraisParMembreBase?: number;
}

/**
 * Start (activate) a tontine cycle — admin only. Goes through the
 * wedo.activer_cycle RPC, which computes the one-time activation fee
 * (frais_du, equal for all members) and flips the status to Active.
 */
export const startTontine = async (tontineId: string): Promise<ActivationResult> => {
  if (!IS_SUPABASE_CONFIGURED) return DEMO_OK;
  const {data, error} = await supabase.rpc('activer_cycle', {p_tontine_id: tontineId});
  if (error) throw new Error(error.message);
  return data as ActivationResult;
};

/**
 * End a tontine (admin only)
 */
export const endTontine = async (tontineId: string): Promise<{success: boolean}> => {
  if (!IS_SUPABASE_CONFIGURED) return DEMO_OK;
  const {error} = await supabase
    .from('tontines')
    .update({status: 'Completed'})
    .eq('id', tontineId);

  if (error) throw new Error(error.message);
  return {success: true};
};

/**
 * Get tontine statistics
 */
export const getTontineStats = async (tontineId: string) => {
  const {data, error} = await supabase.rpc('get_tontine_stats', {p_tontine_id: tontineId});

  if (error) throw new Error(error.message);

  const stats = data?.[0] || {
    total_contributions: 0,
    total_distributions: 0,
    current_balance: 0,
    average_punctuality: 0,
    completion_rate: 0,
  };

  return {
    totalContributions: stats.total_contributions,
    totalDistributions: stats.total_distributions,
    currentBalance: stats.current_balance,
    averagePunctuality: Number(stats.average_punctuality),
    completionRate: Number(stats.completion_rate),
  };
};

/**
 * Get tontine members
 */
export const getTontineMembers = async (tontineId: string) => {
  const {data, error} = await supabase
    .from('tontine_members')
    .select('*, profiles(id, nom_public, profile_photo_url, reputation_score, reputation_level)')
    .eq('tontine_id', tontineId)
    .order('joined_at', {ascending: true});

  if (error) throw new Error(error.message);
  return data || [];
};

/**
 * Payment status of every member for a given round → { userId: status }.
 * Any tontine member can read this (RLS c_select = is_tontine_member). Lets the
 * Members tab show who has paid / is pending / is late this round.
 */
export const getRoundContributions = async (
  tontineId: string,
  round: number,
): Promise<Record<string, string>> => {
  if (!IS_SUPABASE_CONFIGURED || !round) return {};
  const {data, error} = await supabase
    .from('contributions')
    .select('user_id, status')
    .eq('tontine_id', tontineId)
    .eq('round', round);
  if (error) return {};
  const map: Record<string, string> = {};
  (data || []).forEach((c: any) => {
    map[c.user_id] = c.status;
  });
  return map;
};

/**
 * Search tontines
 */
export const searchTontines = async (
  query: string,
  _filters: TontineFilters = {},
): Promise<Tontine[]> => {
  const {data, error} = await supabase.rpc('search_tontines', {query});

  if (error) throw new Error(error.message);
  return (data || []).map(mapTontine);
};

export default {
  getMyTontines,
  getConversations,
  getMyActivationFee,
  getPublicTontines,
  getTontineDetail,
  createTontine,
  updateTontine,
  deleteTontine,
  joinTontine,
  rejoindreTontine,
  rejoindreTontineParCode,
  leaveTontine,
  inviteMembers,
  removeMember,
  startTontine,
  endTontine,
  getTontineStats,
  getTontineMembers,
  getRoundContributions,
  searchTontines,
};
