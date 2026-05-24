/**
 * Auth Slice
 * Manages authentication state with Supabase Email-OTP flow
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {User} from '@types';
import * as authApi from '@services/api/auth.api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // OTP flow state
  otpSent: boolean;
  pendingEmail: string | null;
  // Security preferences
  biometricEnabled: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  otpSent: false,
  pendingEmail: null,
  biometricEnabled: false,
};

// Async Thunks

// Send OTP (for both login and registration)
export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (params: {email: string; fullName?: string; phone?: string}, {rejectWithValue}) => {
    try {
      if (params.fullName) {
        // Registration flow
        await authApi.register({
          email: params.email,
          fullName: params.fullName,
          phone: params.phone,
        });
      } else {
        // Login flow
        await authApi.sendOtp(params.email);
      }
      return {email: params.email};
    } catch (error: any) {
      return rejectWithValue(error.message || "Échec de l'envoi du code OTP");
    }
  },
);

// Verify OTP
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (params: {email: string; token: string}, {rejectWithValue}) => {
    try {
      const result = await authApi.verifyOtp(params.email, params.token);
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
    },

    // Restore session from Supabase onAuthStateChange
    restoreSession: (state, action: PayloadAction<{user: User}>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
    },

    // Clear session (on SIGNED_OUT event)
    clearSession: state => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.otpSent = false;
      state.pendingEmail = null;
    },

    // Set loading (used during session restoration)
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
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
        state.pendingEmail = action.payload.email;
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
