import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../lib/axios';
import { 
  Broadcast, 
  CreateBroadcastRequest, 
  BroadcastReplyRequest,
  BroadcastsResponse 
} from '../../types/api';

interface BroadcastState {
  broadcasts: Broadcast[];
  myBroadcasts: Broadcast[];
  currentBroadcast: Broadcast | null;
  loading: boolean;
  error: string | null;
  recording: boolean;
}

interface ReplyToBroadcastData extends BroadcastReplyRequest {
  broadcastId: number;
}

const initialState: BroadcastState = {
  broadcasts: [],
  myBroadcasts: [],
  currentBroadcast: null,
  loading: false,
  error: null,
  recording: false,
};

// Async thunks
export const fetchBroadcasts = createAsyncThunk(
  'broadcast/fetchAll',
  async () => {
    const response = await axios.get<BroadcastsResponse>('/api/v1/broadcasts');
    return response.data.broadcasts;
  }
);

export const fetchMyBroadcasts = createAsyncThunk(
  'broadcast/fetchMy',
  async () => {
    const response = await axios.get<BroadcastsResponse>('/api/v1/broadcasts/my');
    return response.data.broadcasts;
  }
);

export const createBroadcast = createAsyncThunk(
  'broadcast/create',
  async (data: CreateBroadcastRequest) => {
    const formData = new FormData();
    formData.append('voice_file', data.voice_file);
    if (data.content) {
      formData.append('content', data.content);
    }
    formData.append('recipient_count', data.recipient_count.toString());
    
    const response = await axios.post('/api/v1/broadcasts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.broadcast;
  }
);

export const replyToBroadcast = createAsyncThunk(
  'broadcast/reply',
  async (data: ReplyToBroadcastData) => {
    const formData = new FormData();
    formData.append('voice_file', data.voice_file);
    
    const response = await axios.post(
      `/api/v1/broadcasts/${data.broadcastId}/reply`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return {
      broadcastId: data.broadcastId,
      conversation: response.data.conversation,
    };
  }
);

export const markBroadcastAsRead = createAsyncThunk(
  'broadcast/markAsRead',
  async (broadcastId: number) => {
    await axios.post(`/api/v1/broadcasts/${broadcastId}/mark_as_read`);
    return broadcastId;
  }
);

// Slice
const broadcastSlice = createSlice({
  name: 'broadcast',
  initialState,
  reducers: {
    setCurrentBroadcast: (state, action: PayloadAction<Broadcast | null>) => {
      state.currentBroadcast = action.payload;
    },
    setRecording: (state, action: PayloadAction<boolean>) => {
      state.recording = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch broadcasts
    builder
      .addCase(fetchBroadcasts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBroadcasts.fulfilled, (state, action) => {
        state.broadcasts = action.payload;
        state.loading = false;
      })
      .addCase(fetchBroadcasts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '브로드캐스트를 불러올 수 없습니다.';
      });
    
    // Fetch my broadcasts
    builder
      .addCase(fetchMyBroadcasts.fulfilled, (state, action) => {
        state.myBroadcasts = action.payload;
      });
    
    // Create broadcast
    builder
      .addCase(createBroadcast.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBroadcast.fulfilled, (state, action) => {
        state.myBroadcasts.unshift(action.payload);
        state.loading = false;
        state.recording = false;
      })
      .addCase(createBroadcast.rejected, (state, action) => {
        state.loading = false;
        state.recording = false;
        state.error = action.error.message || '브로드캐스트 생성에 실패했습니다.';
      });
    
    // Reply to broadcast
    builder
      .addCase(replyToBroadcast.fulfilled, (state, action) => {
        // Update reply count if the broadcast is in the list
        const broadcast = state.broadcasts.find(b => b.id === action.payload.broadcastId);
        if (broadcast && broadcast.reply_count !== undefined) {
          broadcast.reply_count += 1;
        }
      });
    
    // Mark as read
    builder
      .addCase(markBroadcastAsRead.fulfilled, (state, action) => {
        const broadcast = state.broadcasts.find(b => b.id === action.payload);
        if (broadcast) {
          broadcast.is_read = true;
        }
      });
  },
});

export const { setCurrentBroadcast, setRecording, clearError } = broadcastSlice.actions;
export default broadcastSlice.reducer;