/**
 * Notification Slice
 * Manages in-app notifications and settings via Supabase
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {Notification, NotificationSettings} from '@types';
import * as notificationApi from '@services/api/notification.api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  settings: null,
  isLoading: false,
  error: null,
};

// Async Thunks

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (params: {page?: number; unreadOnly?: boolean} = {}, {rejectWithValue}) => {
    try {
      const response = await notificationApi.getNotifications(
        params.page || 1,
        20,
        params.unreadOnly || false,
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec du chargement des notifications');
    }
  },
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId: string, {rejectWithValue}) => {
    try {
      await notificationApi.markAsRead(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec du marquage comme lu');
    }
  },
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, {rejectWithValue}) => {
    try {
      await notificationApi.markAllAsRead();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec du marquage comme lu');
    }
  },
);

export const fetchNotificationSettings = createAsyncThunk(
  'notification/fetchSettings',
  async (_, {rejectWithValue}) => {
    try {
      return await notificationApi.getNotificationSettings();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec du chargement des paramètres');
    }
  },
);

export const updateNotificationSettings = createAsyncThunk(
  'notification/updateSettings',
  async (settings: Partial<NotificationSettings>, {rejectWithValue}) => {
    try {
      return await notificationApi.updateNotificationSettings(settings);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec de la mise à jour des paramètres');
    }
  },
);

// Slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Add new notification (from realtime subscription)
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    clearError: state => {
      state.error = null;
    },
    clearNotifications: state => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: builder => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.data;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mark as read
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });

    // Mark all as read
    builder.addCase(markAllAsRead.fulfilled, state => {
      state.notifications.forEach(n => {
        if (!n.isRead) {
          n.isRead = true;
          n.readAt = new Date().toISOString();
        }
      });
      state.unreadCount = 0;
    });

    // Fetch settings
    builder
      .addCase(fetchNotificationSettings.pending, state => {
        state.isLoading = true;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update settings
    builder
      .addCase(updateNotificationSettings.pending, state => {
        state.isLoading = true;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {addNotification, clearError, clearNotifications} = notificationSlice.actions;

export default notificationSlice.reducer;
