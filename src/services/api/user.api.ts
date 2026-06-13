/**
 * User API Service
 * Handles all user-related queries via Supabase
 */

import {supabase} from '@services/supabase';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';
import {
  demoProfile,
  demoStatistics,
  demoMobileMoneyAccounts,
  demoMemberById,
} from '@services/demo/demoData';
import {User, UserProfile, UserStatistics, MobileMoneyAccount} from '@types';

/**
 * Map a profile row to a User object
 */
const mapProfileToUser = (profile: any): User => ({
  id: profile.id,
  phoneNumber: profile.phone_number,
  fullName: profile.full_name,
  email: profile.email || undefined,
  profilePhotoUrl: profile.profile_photo_url || undefined,
  reputationScore: profile.reputation_score,
  reputationLevel: profile.reputation_level as any,
  kycLevel: profile.kyc_level as any,
  isVerified: profile.is_verified,
  city: profile.city || undefined,
  region: profile.region || undefined,
  dateOfBirth: profile.date_of_birth || undefined,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<User> => {
  if (!IS_SUPABASE_CONFIGURED) {
    const p = demoMemberById(userId);
    if (p) {
      return {
        ...demoProfile,
        id: p.id,
        fullName: p.fullName,
        reputationScore: p.reputationScore,
        reputationLevel: p.reputationLevel,
      };
    }
    return demoProfile;
  }
  const {data, error} = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return mapProfileToUser(data);
};

/**
 * Get current user profile (full with stats, accounts, badges)
 */
export const getMyProfile = async (): Promise<UserProfile> => {
  if (!IS_SUPABASE_CONFIGURED) return demoProfile;
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [profileRes, statsRes, accountsRes, ratingsRes, badgesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_statistics').select('*').eq('user_id', user.id).single(),
    supabase.from('mobile_money_accounts').select('*').eq('user_id', user.id),
    supabase.from('ratings').select('*').eq('rated_id', user.id),
    supabase.from('user_badges').select('*, badges(*)').eq('user_id', user.id),
  ]);

  if (profileRes.error) throw new Error(profileRes.error.message);

  const profile = profileRes.data;
  const stats = statsRes.data;
  const accounts = accountsRes.data || [];
  const ratings = ratingsRes.data || [];
  const userBadges = badgesRes.data || [];

  return {
    ...mapProfileToUser(profile),
    statistics: stats ? {
      tontinesCompleted: stats.tontines_completed,
      activeTontines: stats.active_tontines,
      totalContributed: stats.total_contributed,
      totalReceived: stats.total_received,
      onTimePaymentRate: Number(stats.on_time_payment_rate),
      latePaymentsCount: stats.late_payments_count,
      memberSince: stats.created_at,
    } : {
      tontinesCompleted: 0,
      activeTontines: 0,
      totalContributed: 0,
      totalReceived: 0,
      onTimePaymentRate: 0,
      latePaymentsCount: 0,
      memberSince: profile.created_at,
    },
    mobileMoneyAccounts: accounts.map((a: any) => ({
      id: a.id,
      userId: a.user_id,
      operator: a.operator as any,
      accountNumber: a.account_number,
      accountName: a.account_name,
      isDefault: a.is_default,
      isVerified: a.is_verified,
      createdAt: a.created_at,
    })),
    ratings: ratings.map((r: any) => ({
      id: r.id,
      tontineId: r.tontine_id,
      raterId: r.rater_id,
      ratedId: r.rated_id,
      rating: r.rating,
      punctualityScore: r.punctuality_score,
      communicationScore: r.communication_score,
      reliabilityScore: r.reliability_score,
      comment: r.comment,
      createdAt: r.created_at,
    })),
    badges: userBadges.map((ub: any) => ({
      id: ub.badges.id,
      name: ub.badges.name,
      description: ub.badges.description,
      iconUrl: ub.badges.icon_url,
      earnedAt: ub.earned_at,
    })),
  };
};

/**
 * Update user profile
 */
export const updateProfile = async (data: Partial<{
  fullName: string;
  email: string;
  city: string;
  region: string;
  dateOfBirth: string;
}>): Promise<User> => {
  if (!IS_SUPABASE_CONFIGURED) {
    return {...demoProfile, ...data} as User;
  }
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updateData: any = {};
  if (data.fullName !== undefined) updateData.full_name = data.fullName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.region !== undefined) updateData.region = data.region;
  if (data.dateOfBirth !== undefined) updateData.date_of_birth = data.dateOfBirth;

  const {data: profile, error} = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProfileToUser(profile);
};

/**
 * Upload profile avatar
 */
export const uploadAvatar = async (uri: string, mimeType: string = 'image/jpeg'): Promise<{avatarUrl: string}> => {
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const filePath = `${user.id}/avatar.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const {error: uploadError} = await supabase.storage
    .from('wedo-avatars')
    .upload(filePath, blob, {upsert: true, contentType: mimeType});

  if (uploadError) throw new Error(uploadError.message);

  const {data: urlData} = supabase.storage.from('wedo-avatars').getPublicUrl(filePath);

  await supabase
    .from('profiles')
    .update({profile_photo_url: urlData.publicUrl})
    .eq('id', user.id);

  return {avatarUrl: urlData.publicUrl};
};

/**
 * Delete profile avatar
 */
export const deleteAvatar = async (): Promise<{success: boolean}> => {
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const {error} = await supabase.storage
    .from('wedo-avatars')
    .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`]);

  if (error) throw new Error(error.message);

  await supabase
    .from('profiles')
    .update({profile_photo_url: null})
    .eq('id', user.id);

  return {success: true};
};

/**
 * Get user statistics
 */
export const getUserStats = async (userId?: string): Promise<UserStatistics> => {
  if (!IS_SUPABASE_CONFIGURED) return demoStatistics;
  let uid = userId;
  if (!uid) {
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    uid = user.id;
  }

  const {data, error} = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', uid)
    .single();

  if (error) throw new Error(error.message);

  return {
    tontinesCompleted: data.tontines_completed,
    activeTontines: data.active_tontines,
    totalContributed: data.total_contributed,
    totalReceived: data.total_received,
    onTimePaymentRate: Number(data.on_time_payment_rate),
    latePaymentsCount: data.late_payments_count,
    memberSince: data.created_at,
  };
};

/**
 * Get Mobile Money accounts
 */
export const getMobileMoneyAccounts = async (): Promise<MobileMoneyAccount[]> => {
  if (!IS_SUPABASE_CONFIGURED) return demoMobileMoneyAccounts;
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const {data, error} = await supabase
    .from('mobile_money_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', {ascending: false});

  if (error) throw new Error(error.message);

  return (data || []).map((a: any) => ({
    id: a.id,
    userId: a.user_id,
    operator: a.operator as any,
    accountNumber: a.account_number,
    accountName: a.account_name,
    isDefault: a.is_default,
    isVerified: a.is_verified,
    createdAt: a.created_at,
  }));
};

/**
 * Add Mobile Money account
 */
export const addMobileMoneyAccount = async (
  account: Omit<MobileMoneyAccount, 'id' | 'userId' | 'createdAt'>,
): Promise<MobileMoneyAccount> => {
  if (!IS_SUPABASE_CONFIGURED) {
    return {
      id: `mm-${Date.now()}`,
      userId: 'demo-user',
      createdAt: new Date().toISOString(),
      ...account,
    } as MobileMoneyAccount;
  }
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const {data, error} = await supabase
    .from('mobile_money_accounts')
    .insert({
      user_id: user.id,
      operator: account.operator,
      account_number: account.accountNumber,
      account_name: account.accountName || null,
      is_default: account.isDefault,
      is_verified: account.isVerified,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    userId: data.user_id,
    operator: data.operator as any,
    accountNumber: data.account_number,
    accountName: data.account_name || undefined,
    isDefault: data.is_default,
    isVerified: data.is_verified,
    createdAt: data.created_at,
  };
};

/**
 * Update Mobile Money account
 */
export const updateMobileMoneyAccount = async (
  accountId: string,
  data: Partial<MobileMoneyAccount>,
): Promise<MobileMoneyAccount> => {
  const updateData: any = {};
  if (data.operator !== undefined) updateData.operator = data.operator;
  if (data.accountNumber !== undefined) updateData.account_number = data.accountNumber;
  if (data.accountName !== undefined) updateData.account_name = data.accountName;
  if (data.isDefault !== undefined) updateData.is_default = data.isDefault;
  if (data.isVerified !== undefined) updateData.is_verified = data.isVerified;

  const {data: result, error} = await supabase
    .from('mobile_money_accounts')
    .update(updateData)
    .eq('id', accountId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: result.id,
    userId: result.user_id,
    operator: result.operator as any,
    accountNumber: result.account_number,
    accountName: result.account_name || undefined,
    isDefault: result.is_default,
    isVerified: result.is_verified,
    createdAt: result.created_at,
  };
};

/**
 * Delete Mobile Money account
 */
export const deleteMobileMoneyAccount = async (accountId: string): Promise<{success: boolean}> => {
  if (!IS_SUPABASE_CONFIGURED) return {success: true};
  const {error} = await supabase
    .from('mobile_money_accounts')
    .delete()
    .eq('id', accountId);

  if (error) throw new Error(error.message);
  return {success: true};
};

/**
 * Set default Mobile Money account
 */
export const setDefaultMobileMoneyAccount = async (accountId: string): Promise<{success: boolean}> => {
  if (!IS_SUPABASE_CONFIGURED) return {success: true};
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Unset all defaults first
  await supabase
    .from('mobile_money_accounts')
    .update({is_default: false})
    .eq('user_id', user.id);

  // Set the new default
  const {error} = await supabase
    .from('mobile_money_accounts')
    .update({is_default: true})
    .eq('id', accountId);

  if (error) throw new Error(error.message);
  return {success: true};
};

/**
 * Get user's contribution history
 */
export const getContributionHistory = async (
  page: number = 1,
  limit: number = 20,
): Promise<any> => {
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const {data, error, count} = await supabase
    .from('contributions')
    .select('*, tontines(name)', {count: 'exact'})
    .eq('user_id', user.id)
    .order('created_at', {ascending: false})
    .range(from, to);

  if (error) throw new Error(error.message);

  return {data, total: count || 0, page, limit};
};

/**
 * Get user's distribution history
 */
export const getDistributionHistory = async (
  page: number = 1,
  limit: number = 20,
): Promise<any> => {
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const {data, error, count} = await supabase
    .from('distributions')
    .select('*, tontines(name)', {count: 'exact'})
    .eq('recipient_id', user.id)
    .order('created_at', {ascending: false})
    .range(from, to);

  if (error) throw new Error(error.message);

  return {data, total: count || 0, page, limit};
};

export default {
  getUserProfile,
  getMyProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getUserStats,
  getMobileMoneyAccounts,
  addMobileMoneyAccount,
  updateMobileMoneyAccount,
  deleteMobileMoneyAccount,
  setDefaultMobileMoneyAccount,
  getContributionHistory,
  getDistributionHistory,
};
