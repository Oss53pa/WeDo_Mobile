/**
 * Payment API Service
 * Handles payments via Supabase Edge Functions + direct queries
 */

import {supabase} from '@services/supabase';
import {Contribution, Distribution, Transaction} from '@types';

/**
 * Make a contribution to a tontine (via Edge Function)
 */
export const makeContribution = async (data: {
  tontineId: string;
  amount: number;
  paymentMethod: string;
  mobileMoneyAccountId?: string;
}): Promise<{
  contribution: Contribution;
  transaction: Transaction;
  paymentUrl?: string;
}> => {
  const {data: result, error} = await supabase.functions.invoke('initiate-payment', {
    body: {
      tontineId: data.tontineId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      mobileMoneyAccountId: data.mobileMoneyAccountId,
    },
  });

  if (error) throw new Error(error.message);
  return result;
};

/**
 * Pay the one-time activation fee for a tontine (via Edge Function). The amount
 * is the member's frais_du on the server — never sent by the client.
 */
export const payActivationFee = async (
  tontineId: string,
): Promise<{transaction: Transaction; paymentUrl?: string}> => {
  const {data, error} = await supabase.functions.invoke('initiate-payment', {
    body: {tontineId, kind: 'fee'},
  });
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Get contribution details
 */
export const getContribution = async (contributionId: string): Promise<Contribution> => {
  const {data, error} = await supabase
    .from('contributions')
    .select('*')
    .eq('id', contributionId)
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    tontineId: data.tontine_id,
    memberId: data.member_id,
    userId: data.user_id,
    amount: data.amount,
    penaltyAmount: data.penalty_amount,
    dueDate: data.due_date,
    paidDate: data.paid_date || undefined,
    status: data.status as any,
    paymentMethod: data.payment_method || undefined,
    transactionId: data.transaction_id || undefined,
    receiptUrl: data.receipt_url || undefined,
    createdAt: data.created_at,
  };
};

/**
 * Verify payment status (via Edge Function)
 */
export const verifyPayment = async (transactionId: string): Promise<{
  status: 'Pending' | 'Completed' | 'Failed';
  transaction: Transaction;
}> => {
  const {data, error} = await supabase.functions.invoke('check-payment-status', {
    body: {transactionId},
  });

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Process distribution to beneficiary (admin, via Edge Function)
 */
export const processDistribution = async (data: {
  tontineId: string;
  beneficiaryId: string;
  amount: number;
  round: number;
}): Promise<Distribution> => {
  const {data: result, error} = await supabase.functions.invoke('process-disbursement', {
    body: data,
  });

  if (error) throw new Error(error.message);
  return result;
};

/**
 * Get distribution details
 */
export const getDistribution = async (distributionId: string): Promise<Distribution> => {
  const {data, error} = await supabase
    .from('distributions')
    .select('*, profiles:recipient_id(id, full_name, profile_photo_url)')
    .eq('id', distributionId)
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    tontineId: data.tontine_id,
    recipientId: data.recipient_id,
    recipient: data.profiles ? {
      id: (data.profiles as any).id,
      fullName: (data.profiles as any).full_name,
      profilePhotoUrl: (data.profiles as any).profile_photo_url,
    } : undefined,
    amount: data.amount,
    scheduledDate: data.scheduled_date,
    distributedDate: data.distributed_date || undefined,
    status: data.status as any,
    transactionId: data.transaction_id || undefined,
    receiptUrl: data.receipt_url || undefined,
    createdAt: data.created_at,
  };
};

/**
 * Get tontine contributions
 */
export const getTontineContributions = async (
  tontineId: string,
  filters?: {
    status?: string;
    round?: number;
    fromDate?: string;
    toDate?: string;
  },
): Promise<Contribution[]> => {
  let query = supabase
    .from('contributions')
    .select('*')
    .eq('tontine_id', tontineId)
    .order('created_at', {ascending: false});

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.round) query = query.eq('round', filters.round);
  if (filters?.fromDate) query = query.gte('created_at', filters.fromDate);
  if (filters?.toDate) query = query.lte('created_at', filters.toDate);

  const {data, error} = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((d: any) => ({
    id: d.id,
    tontineId: d.tontine_id,
    memberId: d.member_id,
    userId: d.user_id,
    amount: d.amount,
    penaltyAmount: d.penalty_amount,
    dueDate: d.due_date,
    paidDate: d.paid_date || undefined,
    status: d.status as any,
    paymentMethod: d.payment_method || undefined,
    transactionId: d.transaction_id || undefined,
    receiptUrl: d.receipt_url || undefined,
    createdAt: d.created_at,
  }));
};

/**
 * Get tontine distributions
 */
export const getTontineDistributions = async (
  tontineId: string,
  filters?: {
    round?: number;
    fromDate?: string;
    toDate?: string;
  },
): Promise<Distribution[]> => {
  let query = supabase
    .from('distributions')
    .select('*, profiles:recipient_id(id, full_name, profile_photo_url)')
    .eq('tontine_id', tontineId)
    .order('created_at', {ascending: false});

  if (filters?.round) query = query.eq('round', filters.round);
  if (filters?.fromDate) query = query.gte('created_at', filters.fromDate);
  if (filters?.toDate) query = query.lte('created_at', filters.toDate);

  const {data, error} = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((d: any) => ({
    id: d.id,
    tontineId: d.tontine_id,
    recipientId: d.recipient_id,
    recipient: d.profiles ? {
      id: d.profiles.id,
      fullName: d.profiles.full_name,
      profilePhotoUrl: d.profiles.profile_photo_url,
    } : undefined,
    amount: d.amount,
    scheduledDate: d.scheduled_date,
    distributedDate: d.distributed_date || undefined,
    status: d.status as any,
    transactionId: d.transaction_id || undefined,
    receiptUrl: d.receipt_url || undefined,
    createdAt: d.created_at,
  }));
};

/**
 * Get user's transaction history
 */
export const getTransactionHistory = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    type?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  },
): Promise<{
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}> => {
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('transactions')
    .select('*, tontines(name)', {count: 'exact'})
    .eq('user_id', user.id)
    .order('created_at', {ascending: false});

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.fromDate) query = query.gte('created_at', filters.fromDate);
  if (filters?.toDate) query = query.lte('created_at', filters.toDate);

  const {data, error, count} = await query.range(from, to);
  if (error) throw new Error(error.message);

  const transactions: Transaction[] = (data || []).map((d: any) => ({
    id: d.id,
    userId: d.user_id,
    tontineId: d.tontine_id,
    tontineName: d.tontines?.name || undefined,
    type: d.type as any,
    amount: d.amount,
    currency: d.currency,
    status: d.status as any,
    description: d.description,
    referenceId: d.reference_id || undefined,
    transactionId: d.external_transaction_id || undefined,
    createdAt: d.created_at,
  }));

  return {data: transactions, total: count || 0, page, limit};
};

/**
 * Calculate fees (via Edge Function)
 */
export const calculateFees = async (data: {
  amount: number;
  provider: string;
}): Promise<{
  fees: number;
  total: number;
  provider: string;
}> => {
  const {data: result, error} = await supabase.functions.invoke('calculate-fees', {
    body: data,
  });

  if (error) throw new Error(error.message);
  return result;
};

/**
 * Get payment statistics
 */
export const getPaymentStats = async (tontineId?: string) => {
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (tontineId) {
    const {data, error} = await supabase.rpc('get_tontine_stats', {p_tontine_id: tontineId});
    if (error) throw new Error(error.message);
    return data?.[0] || {};
  }

  // User stats
  const [contribs, distribs, pending, failed] = await Promise.all([
    supabase.from('contributions').select('amount', {count: 'exact'}).eq('user_id', user.id).eq('status', 'Paid'),
    supabase.from('distributions').select('amount', {count: 'exact'}).eq('recipient_id', user.id).eq('status', 'Completed'),
    supabase.from('contributions').select('*', {count: 'exact', head: true}).eq('user_id', user.id).eq('status', 'Pending'),
    supabase.from('contributions').select('*', {count: 'exact', head: true}).eq('user_id', user.id).eq('status', 'Failed'),
  ]);

  return {
    totalContributions: contribs.count || 0,
    totalDistributions: distribs.count || 0,
    pendingPayments: pending.count || 0,
    failedPayments: failed.count || 0,
  };
};

export default {
  makeContribution,
  payActivationFee,
  getContribution,
  verifyPayment,
  processDistribution,
  getDistribution,
  getTontineContributions,
  getTontineDistributions,
  getTransactionHistory,
  calculateFees,
  getPaymentStats,
};
