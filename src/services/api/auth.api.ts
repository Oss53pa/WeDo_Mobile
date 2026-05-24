/**
 * Auth API Service
 * Handles all authentication via Supabase Auth (Email OTP — free).
 * A 6-digit code is emailed to the user; verify it with type: 'email'.
 * Requires the Supabase "Magic Link" email template to expose {{ .Token }}.
 */

import {supabase} from '@services/supabase';
import {User} from '@types';

/**
 * Send a one-time code to an email address (works for both login and signup).
 */
export const sendOtp = async (email: string): Promise<{success: boolean}> => {
  const {error} = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {shouldCreateUser: true},
  });
  if (error) throw new Error(error.message);
  return {success: true};
};

/**
 * Verify the emailed OTP code
 */
export const verifyOtp = async (
  email: string,
  token: string,
): Promise<{user: User; session: any}> => {
  const {data, error} = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token,
    type: 'email',
  });
  if (error) throw new Error(error.message);

  // Fetch profile
  const {data: profile, error: profileError} = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user!.id)
    .single();

  if (profileError) throw new Error(profileError.message);

  const user: User = {
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
  };

  return {user, session: data.session};
};

/**
 * Register a new user (email OTP + profile metadata).
 * `phone` is optional and stored on the profile via the handle_new_user trigger.
 */
export const register = async (data: {
  email: string;
  fullName: string;
  phone?: string;
}): Promise<{success: boolean}> => {
  const {error} = await supabase.auth.signInWithOtp({
    email: data.email.trim().toLowerCase(),
    options: {
      shouldCreateUser: true,
      data: {
        full_name: data.fullName,
        phone: data.phone,
      },
    },
  });
  if (error) throw new Error(error.message);
  return {success: true};
};

/**
 * Resend OTP code
 */
export const resendOtp = async (email: string): Promise<{success: boolean}> => {
  return sendOtp(email);
};

/**
 * Logout
 */
export const logout = async (): Promise<{success: boolean}> => {
  const {error} = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  return {success: true};
};

/**
 * Get current session
 */
export const getSession = async () => {
  const {data, error} = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
};

/**
 * Get current user from Supabase Auth
 */
export const getCurrentUser = async () => {
  const {data, error} = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user;
};

export default {
  sendOtp,
  verifyOtp,
  register,
  resendOtp,
  logout,
  getSession,
  getCurrentUser,
};
