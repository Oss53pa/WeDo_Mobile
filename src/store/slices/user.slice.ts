/**
 * User Slice
 * Manages user profile, reputation, and statistics via Supabase
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {User, UserProfile, UserStatistics, MobileMoneyAccount} from '@types';
import * as userApi from '@services/api/user.api';

interface UserState {
  profile: UserProfile | null;
  statistics: UserStatistics | null;
  mobileMoneyAccounts: MobileMoneyAccount[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  statistics: null,
  mobileMoneyAccounts: [],
  isLoading: false,
  error: null,
};

// Async Thunks

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_: void, {rejectWithValue}) => {
    try {
      return await userApi.getMyProfile();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec du chargement du profil');
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (data: Partial<User>, {rejectWithValue}) => {
    try {
      return await userApi.updateProfile(data as any);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec de la mise à jour du profil');
    }
  },
);

export const fetchUserStatistics = createAsyncThunk(
  'user/fetchStatistics',
  async (_: void, {rejectWithValue}) => {
    try {
      return await userApi.getUserStats();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec du chargement des statistiques');
    }
  },
);

export const fetchMobileMoneyAccounts = createAsyncThunk(
  'user/fetchMobileMoneyAccounts',
  async (_: void, {rejectWithValue}) => {
    try {
      return await userApi.getMobileMoneyAccounts();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec du chargement des comptes');
    }
  },
);

export const addMobileMoneyAccount = createAsyncThunk(
  'user/addMobileMoneyAccount',
  async (
    data: Omit<MobileMoneyAccount, 'id' | 'userId' | 'createdAt'>,
    {rejectWithValue},
  ) => {
    try {
      return await userApi.addMobileMoneyAccount(data);
    } catch (error: any) {
      return rejectWithValue(error.message || "Échec de l'ajout du compte");
    }
  },
);

export const removeMobileMoneyAccount = createAsyncThunk(
  'user/removeMobileMoneyAccount',
  async (accountId: string, {rejectWithValue}) => {
    try {
      await userApi.deleteMobileMoneyAccount(accountId);
      return accountId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec de la suppression du compte');
    }
  },
);

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    updateReputation: (
      state,
      action: PayloadAction<{score: number; level: string}>,
    ) => {
      if (state.profile) {
        state.profile.reputationScore = action.payload.score;
        state.profile.reputationLevel = action.payload.level as any;
      }
    },
    clearUserData: state => {
      state.profile = null;
      state.statistics = null;
      state.mobileMoneyAccounts = [];
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Fetch profile
    builder
      .addCase(fetchUserProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.statistics = action.payload.statistics;
        state.mobileMoneyAccounts = action.payload.mobileMoneyAccounts;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.profile) {
          state.profile = {...state.profile, ...action.payload};
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch statistics
    builder
      .addCase(fetchUserStatistics.pending, state => {
        state.isLoading = true;
      })
      .addCase(fetchUserStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchUserStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch mobile money accounts
    builder
      .addCase(fetchMobileMoneyAccounts.pending, state => {
        state.isLoading = true;
      })
      .addCase(fetchMobileMoneyAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.mobileMoneyAccounts = action.payload;
      })
      .addCase(fetchMobileMoneyAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add mobile money account
    builder
      .addCase(addMobileMoneyAccount.pending, state => {
        state.isLoading = true;
      })
      .addCase(addMobileMoneyAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.mobileMoneyAccounts.push(action.payload);
      })
      .addCase(addMobileMoneyAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove mobile money account
    builder
      .addCase(removeMobileMoneyAccount.pending, state => {
        state.isLoading = true;
      })
      .addCase(removeMobileMoneyAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.mobileMoneyAccounts = state.mobileMoneyAccounts.filter(
          account => account.id !== action.payload,
        );
      })
      .addCase(removeMobileMoneyAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {clearError, updateReputation, clearUserData} = userSlice.actions;

export default userSlice.reducer;
