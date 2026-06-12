/**
 * Auth Slice
 * Manages authentication state with Supabase passwordless OTP (e-mail or phone).
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {User} from '@types';
import * as authApi from '@services/api/auth.api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /**
   * True only during the initial session restoration at app startup.
   * The root splash in App.tsx must gate on THIS, never on `isLoading`:
   * gating on isLoading unmounts the NavigationContainer during every
   * auth request (sendOtp/verifyOtp) and resets the stack to Welcome.
   */
  isRestoring: boolean;
  error: string | null;
  // OTP flow state
  otpSent: boolean;
  pendingEmail: string | null;
  pendingPhone: string | null;
  // Security preferences
  biometricEnabled: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isRestoring: true,
  error: null,
  otpSent: false,
  pendingEmail: null,
  pendingPhone: null,
  biometricEnabled: false,
};

// Async Thunks

// Send OTP (for both login and registration, by email or phone).
// `channel` defaults to 'email' to stay backward-compatible with existing callers.
export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (
    params: {
      channel?: 'email' | 'phone';
      email?: string;
      phone?: string;
      fullName?: string;
    },
    {rejectWithValue},
  ) => {
    try {
      const channel = params.channel ?? 'email';
      if (channel === 'phone') {
        // Phone flow (SMS / WhatsApp)
        if (params.fullName) {
          await authApi.registerPhone({
            phone: params.phone!,
            fullName: params.fullName,
            email: params.email,
          });
        } else {
          await authApi.sendOtpPhone(params.phone!);
        }
        return {email: undefined, phone: params.phone};
      }
      // Email flow
      if (params.fullName) {
        await authApi.register({
          email: params.email!,
          fullName: params.fullName,
          phone: params.phone,
        });
      } else {
        await authApi.sendOtp(params.email!);
      }
      return {email: params.email, phone: undefined};
    } catch (error: any) {
      return rejectWithValue(error.message || "Échec de l'envoi du code OTP");
    }
  },
);

// Verify OTP (by email or phone). `channel` defaults to 'email'.
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (
    params: {channel?: 'email' | 'phone'; email?: string; phone?: string; token: string},
    {rejectWithValue},
  ) => {
    try {
      const channel = params.channel ?? 'email';
      const result =
        channel === 'phone'
          ? await authApi.verifyOtpPhone(params.phone!, params.token)
          : await authApi.verifyOtp(params.email!, params.token);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Code OTP invalide');
    }
  },
);

// Logout
export const logout = createAsyncThunk('auth/logout', async (_, {rejectWithValue}) => {
  try {
    await authApi.logout();
    return true;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Échec de la déconnexion');
  }
});

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },

    clearOtpState: state => {
      state.otpSent = false;
      state.pendingEmail = null;
      state.pendingPhone = null;
    },

    // Restore session from Supabase onAuthStateChange
    restoreSession: (state, action: PayloadAction<{user: User}>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.isRestoring = false;
    },

    // Clear session (on SIGNED_OUT event)
    clearSession: state => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.otpSent = false;
      state.pendingEmail = null;
      state.pendingPhone = null;
      state.isRestoring = false;
    },

    // Set restoration state (only during startup session restoration)
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isRestoring = action.payload;
    },

    // Toggle biometric login preference
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
    },

    // TEMP / DEV: enter the app with a demo user (bypasses OTP).
    // Used by the "Accès démo" button and the dev auth-bypass in App.tsx.
    demoLogin: state => {
      state.user = {
        id: 'demo-user',
        phoneNumber: '+225 07 00 00 00',
        fullName: 'Awa Traoré',
        email: 'awa@wedo.app',
        reputationScore: 680,
        reputationLevel: 'Gold',
        kycLevel: 'Level2',
        isVerified: true,
        verified: true,
        totalContributed: 450000,
        totalReceived: 300000,
        activeTontines: 3,
        completedTontines: 2,
        punctualityRate: 96,
        totalContributions: 24,
        preferredCurrency: 'XOF',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as User;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.isRestoring = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Send OTP
    builder
      .addCase(sendOtp.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpSent = true;
        state.pendingEmail = action.payload.email ?? null;
        state.pendingPhone = action.payload.phone ?? null;
        state.error = null;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify OTP
    builder
      .addCase(verifyOtp.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.otpSent = false;
        state.pendingEmail = null;
        state.pendingPhone = null;
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, state => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, state => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.otpSent = false;
        state.pendingEmail = null;
        state.pendingPhone = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearOtpState,
  restoreSession,
  clearSession,
  setLoading,
  demoLogin,
  setBiometricEnabled,
} = authSlice.actions;

export default authSlice.reducer;
