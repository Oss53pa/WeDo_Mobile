/**
 * Auth API Service
 * Handles authentication via Supabase Auth with two passwordless methods:
 *  - Email OTP (free): a code is emailed; verify with type: 'email'.
 *    Requires BOTH the "Confirm signup" (new users) AND "Magic Link" (returning
 *    users) Supabase email templates to expose {{ .Token }} — otherwise new
 *    sign-ups get a confirmation LINK instead of the code. The shared Atlas Studio
 *    template reads {{ .Data.app }} = 'WeDo' (passed below) to brand per app.
 *  - Phone OTP: a code is sent by SMS or WhatsApp; verify with type: 'sms'.
 *    Requires a Twilio (Verify) provider configured in the Supabase dashboard.
 *    The delivery channel is set via AUTH_CONFIG.phoneOtpChannel.
 */

import {supabase} from '@services/supabase';
import {AUTH_CONFIG} from '@config/appConfig';
import {User} from '@types';

/**
 * Normalise a phone number to the E.164-ish shape Supabase expects: keep the
 * leading "+" and digits only (strips spaces, dots, dashes, parentheses).
 * The user must include the country code (e.g. +225, +221).
 */
const normalizePhone = (phone: string): string => phone.replace(/[^\d+]/g, '');

/**
 * Per-app metadata read by the shared Atlas Studio OTP email template
 * ({{ .Data.app }}, {{ .Data.app_tagline }}…). Passing `app: 'WeDo'` makes the
 * code email render the WeDo brand (Grand Hotel wordmark) instead of the generic
 * Atlas Studio fallback. Set on user creation; also kept fresh on each sign-in.
 */
const WEDO_OTP_META = {
  app: 'WeDo',
  app_tagline: 'Tontines, en confiance',
} as const;

/**
 * Map a Supabase auth user id to our app User by reading its profile row.
 * Shared by the email and phone verification flows.
 */
const fetchUserProfile = async (
  userId: string,
  session: any,
): Promise<{user: User; session: any}> => {
  const {data: profile, error: profileError} = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
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

  return {user, session};
};

/**
 * Maps Supabase OTP-send errors to French. The 60s anti-spam cooldown
 * ("you can only request this after N seconds") means a code was ALREADY
 * sent moments ago — treat it as success so the UI proceeds to the code
 * screen instead of dead-ending on an English error.
 */
const handleOtpSendError = (error: {message: string} | null): {success: boolean} => {
  if (!error) return {success: true};
  const msg = error.message || '';
  if (/after \d+ seconds/i.test(msg)) {
    return {success: true};
  }
  if (/rate limit/i.test(msg)) {
    throw new Error(
      "Limite d'envoi d'e-mails atteinte. Patientez environ une heure, ou utilisez le dernier code reçu (valable 60 min).",
    );
  }
  if (/invalid|address/i.test(msg)) {
    throw new Error('Adresse e-mail invalide.');
  }
  throw new Error(msg);
};

/**
 * Send a one-time code to an email address (works for both login and signup).
 */
export const sendOtp = async (email: string): Promise<{success: boolean}> => {
  const {error} = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {shouldCreateUser: true, data: {...WEDO_OTP_META}},
  });
  return handleOtpSendError(error);
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
  if (error) {
    if (/expired|invalid/i.test(error.message || '')) {
      throw new Error('Code invalide ou expiré. Demandez un nouveau code.');
    }
    throw new Error(error.message);
  }

  return fetchUserProfile(data.user!.id, data.session);
};

/**
 * Send a one-time code to a phone number (login). Delivered by SMS or WhatsApp
 * depending on AUTH_CONFIG.phoneOtpChannel. Requires a Twilio provider in Supabase.
 */
export const sendOtpPhone = async (phone: string): Promise<{success: boolean}> => {
  const {error} = await supabase.auth.signInWithOtp({
    phone: normalizePhone(phone),
    options: {shouldCreateUser: true, channel: AUTH_CONFIG.phoneOtpChannel, data: {...WEDO_OTP_META}},
  });
  return handleOtpSendError(error);
};

/**
 * Register a new user by phone (phone OTP + profile metadata). Email is optional.
 */
export const registerPhone = async (data: {
  phone: string;
  fullName: string;
  email?: string;
}): Promise<{success: boolean}> => {
  const {error} = await supabase.auth.signInWithOtp({
    phone: normalizePhone(data.phone),
    options: {
      shouldCreateUser: true,
      channel: AUTH_CONFIG.phoneOtpChannel,
      data: {
        ...WEDO_OTP_META,
        full_name: data.fullName,
        email: data.email,
      },
    },
  });
  return handleOtpSendError(error);
};

/**
 * Verify the phone OTP code (type 'sms' applies to both SMS and WhatsApp delivery).
 */
export const verifyOtpPhone = async (
  phone: string,
  token: string,
): Promise<{user: User; session: any}> => {
  const {data, error} = await supabase.auth.verifyOtp({
    phone: normalizePhone(phone),
    token,
    type: 'sms',
  });
  if (error) {
    if (/expired|invalid/i.test(error.message || '')) {
      throw new Error('Code invalide ou expiré. Demandez un nouveau code.');
    }
    throw new Error(error.message);
  }

  return fetchUserProfile(data.user!.id, data.session);
};

/**
 * Resend OTP code to a phone number
 */
export const resendOtpPhone = async (phone: string): Promise<{success: boolean}> => {
  return sendOtpPhone(phone);
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
        ...WEDO_OTP_META,
        full_name: data.fullName,
        phone: data.phone,
      },
    },
  });
  return handleOtpSendError(error);
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
  sendOtpPhone,
  registerPhone,
  verifyOtpPhone,
  resendOtpPhone,
  logout,
  getSession,
  getCurrentUser,
};
