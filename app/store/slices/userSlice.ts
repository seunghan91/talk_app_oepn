import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../lib/axios';

interface UserState {
  profile: UserProfile | null;
  blockedUsers: number[];
  loading: boolean;
  error: string | null;
}

interface UserProfile {
  id: number;
  nickname: string;
  phone_number: string;
  gender: string;
  profile_image_url?: string;
  credits: number;
  is_suspended: boolean;
  suspension_reason?: string;
  suspension_until?: string;
  created_at: string;
  updated_at: string;
}

const initialState: UserState = {
  profile: null,
  blockedUsers: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (userId: number) => {
    const response = await axios.get(`/api/v1/users/${userId}`);
    return response.data.user;
  }
);

export const blockUser = createAsyncThunk(
  'user/block',
  async (userId: number) => {
    await axios.post(`/api/v1/users/${userId}/block`);
    return userId;
  }
);

export const unblockUser = createAsyncThunk(
  'user/unblock',
  async (userId: number) => {
    await axios.delete(`/api/v1/users/${userId}/unblock`);
    return userId;
  }
);

export const fetchBlockedUsers = createAsyncThunk(
  'user/fetchBlocked',
  async () => {
    const response = await axios.get('/api/v1/users/blocked');
    return response.data.blocked_users.map((user: any) => user.id);
  }
);

export const reportUser = createAsyncThunk(
  'user/report',
  async ({ userId, reason }: { userId: number; reason: string }) => {
    await axios.post(`/api/v1/users/${userId}/report`, { reason });
    return { userId, reason };
  }
);

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.profile = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch user profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '프로필을 불러올 수 없습니다.';
      });
    
    // Block user
    builder
      .addCase(blockUser.fulfilled, (state, action) => {
        state.blockedUsers.push(action.payload);
      });
    
    // Unblock user
    builder
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.blockedUsers = state.blockedUsers.filter(id => id !== action.payload);
      });
    
    // Fetch blocked users
    builder
      .addCase(fetchBlockedUsers.fulfilled, (state, action) => {
        state.blockedUsers = action.payload;
      });
  },
});

export const { clearProfile, clearError } = userSlice.actions;
export default userSlice.reducer;