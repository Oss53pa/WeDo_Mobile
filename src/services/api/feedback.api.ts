/**
 * Feedback API — in-app avis / commentaires / suggestions.
 */
import {supabase} from '@services/supabase';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';

export type FeedbackKind = 'avis' | 'suggestion' | 'bug' | 'autre';

export interface Feedback {
  id: string;
  kind: FeedbackKind;
  rating?: number;
  message: string;
  screen?: string;
  status: 'new' | 'seen' | 'resolved';
  createdAt: string;
}

export const submitFeedback = async (data: {
  kind: FeedbackKind;
  message: string;
  rating?: number;
  screen?: string;
  appVersion?: string;
}): Promise<{success: boolean}> => {
  if (!IS_SUPABASE_CONFIGURED) return {success: true};
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  const {error} = await supabase.from('feedback').insert({
    user_id: user.id,
    kind: data.kind,
    message: data.message.trim(),
    rating: data.rating ?? null,
    screen: data.screen ?? null,
    app_version: data.appVersion ?? null,
  });
  if (error) throw new Error(error.message);
  return {success: true};
};

export const getMyFeedback = async (): Promise<Feedback[]> => {
  if (!IS_SUPABASE_CONFIGURED) return [];
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return [];
  const {data, error} = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', {ascending: false});
  if (error) throw new Error(error.message);
  return (data || []).map((d: any) => ({
    id: d.id,
    kind: d.kind,
    rating: d.rating ?? undefined,
    message: d.message,
    screen: d.screen ?? undefined,
    status: d.status,
    createdAt: d.created_at,
  }));
};

export default {submitFeedback, getMyFeedback};
