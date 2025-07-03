import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../lib/axios';
import * as Notifications from 'expo-notifications';

interface NotificationState {
  notifications: AppNotification[];
  pushToken: string | null;
  notificationSettings: NotificationSettings;
  loading: boolean;
  error: string | null;
}

interface AppNotification {
  id: number;
  notification_type: 'broadcast' | 'message' | 'announcement' | 'system';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  metadata?: any;
}

interface NotificationSettings {
  push_enabled: boolean;
  broadcast_push_enabled: boolean;
  message_push_enabled: boolean;
  announcement_push_enabled: boolean;
  night_mode_enabled: boolean;
  night_mode_start: string;
  night_mode_end: string;
}

const initialState: NotificationState = {
  notifications: [],
  pushToken: null,
  notificationSettings: {
    push_enabled: true,
    broadcast_push_enabled: true,
    message_push_enabled: true,
    announcement_push_enabled: true,
    night_mode_enabled: false,
    night_mode_start: '22:00',
    night_mode_end: '08:00',
  },
  loading: false,
  error: null,
};

// Async thunks
export const registerPushToken = createAsyncThunk(
  'notification/registerToken',
  async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('푸시 알림 권한이 거부되었습니다.');
    }
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    
    // Send token to server
    await axios.post('/api/v1/users/push_token', { token });
    
    return token;
  }
);

export const fetchNotifications = createAsyncThunk(
  'notification/fetchAll',
  async () => {
    const response = await axios.get('/api/v1/notifications');
    return response.data.notifications;
  }
);

export const fetchNotificationSettings = createAsyncThunk(
  'notification/fetchSettings',
  async () => {
    const response = await axios.get('/api/v1/users/notification_settings');
    return response.data.settings;
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notification/updateSettings',
  async (settings: Partial<NotificationSettings>) => {
    const response = await axios.patch('/api/v1/users/notification_settings', settings);
    return response.data.settings;
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId: number) => {
    await axios.post(`/api/v1/notifications/${notificationId}/mark_as_read`);
    return notificationId;
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async () => {
    await axios.post('/api/v1/notifications/mark_all_as_read');
  }
);

// Slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      state.notifications.unshift(action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setPushToken: (state, action: PayloadAction<string | null>) => {
      state.pushToken = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register push token
    builder
      .addCase(registerPushToken.fulfilled, (state, action) => {
        state.pushToken = action.payload;
      })
      .addCase(registerPushToken.rejected, (state, action) => {
        state.error = action.error.message || '푸시 토큰 등록에 실패했습니다.';
      });
    
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
        state.loading = false;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '알림을 불러올 수 없습니다.';
      });
    
    // Fetch notification settings
    builder
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.notificationSettings = action.payload;
      });
    
    // Update notification settings
    builder
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.notificationSettings = action.payload;
      });
    
    // Mark as read
    builder
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification) {
          notification.read = true;
        }
      });
    
    // Mark all as read
    builder
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => {
          n.read = true;
        });
      });
  },
});

export const { addNotification, clearNotifications, setPushToken, clearError } = notificationSlice.actions;
export default notificationSlice.reducer;