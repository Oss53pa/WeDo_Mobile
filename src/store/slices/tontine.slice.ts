/**
 * Tontine Slice
 * Manages tontines, memberships, and contributions via Supabase
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  Tontine,
  TontineDetail,
  CreateTontineData,
  TontineFilters,
  JoinTontineRequest,
} from '@types';
import * as tontineApi from '@services/api/tontine.api';

interface TontineState {
  myTontines: Tontine[];
  activeTontines: Tontine[];
  completedTontines: Tontine[];
  publicTontines: Tontine[];
  currentTontine: TontineDetail | null;
  isLoading: boolean;
  error: string | null;
  filters: TontineFilters;
}

const initialState: TontineState = {
  myTontines: [],
  activeTontines: [],
  completedTontines: [],
  publicTontines: [],
  currentTontine: null,
  isLoading: false,
  error: null,
  filters: {},
};

// Async Thunks

export const fetchMyTontines = createAsyncThunk(
  'tontine/fetchMyTontines',
  async (_, {rejectWithValue}) => {
    try {
      return await tontineApi.getMyTontines();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec du chargement des tontines');
    }
  },
);

export const fetchPublicTontines = createAsyncThunk(
  'tontine/fetchPublicTontines',
  async (filters: TontineFilters, {rejectWithValue}) => {
    try {
      const response = await tontineApi.getPublicTontines(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec du chargement des tontines publiques');
    }
  },
);

export const fetchTontineDetail = createAsyncThunk(
  'tontine/fetchTontineDetail',
  async (tontineId: string, {rejectWithValue}) => {
    try {
      return await tontineApi.getTontineDetail(tontineId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec du chargement des détails');
    }
  },
);

export const createTontine = createAsyncThunk(
  'tontine/createTontine',
  async (data: CreateTontineData, {rejectWithValue}) => {
    try {
      return await tontineApi.createTontine(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec de la création de la tontine');
    }
  },
);

export const joinTontine = createAsyncThunk(
  'tontine/joinTontine',
  async (data: JoinTontineRequest, {rejectWithValue}) => {
    try {
      await tontineApi.joinTontine(data);
      return {success: true};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec pour rejoindre la tontine');
    }
  },
);

export const leaveTontine = createAsyncThunk(
  'tontine/leaveTontine',
  async (tontineId: string, {rejectWithValue}) => {
    try {
      await tontineApi.leaveTontine(tontineId);
      return tontineId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec pour quitter la tontine');
    }
  },
);

// Slice
const tontineSlice = createSlice({
  name: 'tontine',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<TontineFilters>) => {
      state.filters = action.payload;
    },
    clearCurrentTontine: state => {
      state.currentTontine = null;
    },
    clearTontinesData: state => {
      state.myTontines = [];
      state.activeTontines = [];
      state.completedTontines = [];
      state.publicTontines = [];
      state.currentTontine = null;
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Fetch my tontines
    builder
      .addCase(fetchMyTontines.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyTontines.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myTontines = action.payload;
        state.activeTontines = action.payload.filter(t => t.status === 'Active');
        state.completedTontines = action.payload.filter(t => t.status === 'Completed');
      })
      .addCase(fetchMyTontines.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch public tontines
    builder
      .addCase(fetchPublicTontines.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicTontines.fulfilled, (state, action) => {
        state.isLoading = false;
        state.publicTontines = action.payload;
      })
      .addCase(fetchPublicTontines.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch tontine detail
    builder
      .addCase(fetchTontineDetail.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTontineDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTontine = action.payload;
      })
      .addCase(fetchTontineDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create tontine
    builder
      .addCase(createTontine.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTontine.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myTontines.push(action.payload);
        if (action.payload.status === 'Active') {
          state.activeTontines.push(action.payload);
        }
      })
      .addCase(createTontine.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Join tontine
    builder
      .addCase(joinTontine.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinTontine.fulfilled, state => {
        state.isLoading = false;
      })
      .addCase(joinTontine.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Leave tontine
    builder
      .addCase(leaveTontine.pending, state => {
        state.isLoading = true;
      })
      .addCase(leaveTontine.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myTontines = state.myTontines.filter(t => t.id !== action.payload);
        state.activeTontines = state.activeTontines.filter(t => t.id !== action.payload);
      })
      .addCase(leaveTontine.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {clearError, setFilters, clearCurrentTontine, clearTontinesData} =
  tontineSlice.actions;

export default tontineSlice.reducer;
