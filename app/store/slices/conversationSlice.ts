import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../lib/axios';
import { 
  Conversation, 
  ConversationDetail, 
  Message, 
  SendMessageRequest,
  ConversationsResponse,
  MessagesResponse
} from '../../types/api';

interface ConversationState {
  conversations: Conversation[];
  currentConversation: ConversationDetail | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
}

interface SendMessageData extends SendMessageRequest {
  conversationId: number;
}

const initialState: ConversationState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  unreadCount: 0,
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  'conversation/fetchAll',
  async () => {
    const response = await axios.get<ConversationsResponse>('/api/v1/conversations');
    return response.data.conversations;
  }
);

export const fetchConversation = createAsyncThunk(
  'conversation/fetchOne',
  async (conversationId: number) => {
    const response = await axios.get<MessagesResponse>(`/api/v1/conversations/${conversationId}`);
    return {
      conversation: response.data.conversation,
      messages: response.data.messages,
    };
  }
);

export const sendMessage = createAsyncThunk(
  'conversation/sendMessage',
  async (data: SendMessageData) => {
    const formData = new FormData();
    formData.append('message_type', data.message_type);
    
    if (data.content) {
      formData.append('content', data.content);
    }
    
    if (data.voice_file) {
      formData.append('voice_file', data.voice_file);
    }
    
    const response = await axios.post(
      `/api/v1/conversations/${data.conversationId}/send_message`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.data;
  }
);

export const toggleFavorite = createAsyncThunk(
  'conversation/toggleFavorite',
  async (conversationId: number) => {
    const response = await axios.post(`/api/v1/conversations/${conversationId}/favorite`);
    return { conversationId, message: response.data.message };
  }
);

export const deleteConversation = createAsyncThunk(
  'conversation/delete',
  async (conversationId: number) => {
    await axios.delete(`/api/v1/conversations/${conversationId}`);
    return conversationId;
  }
);

export const markAsRead = createAsyncThunk(
  'conversation/markAsRead',
  async (conversationId: number) => {
    await axios.post(`/api/v1/conversations/${conversationId}/mark_as_read`);
    return conversationId;
  }
);

// Slice
const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
      state.messages = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.loading = false;
        // Calculate total unread count
        state.unreadCount = action.payload.reduce(
          (total: number, conv: Conversation) => total + conv.unread_count,
          0
        );
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '대화 목록을 불러올 수 없습니다.';
      });
    
    // Fetch single conversation
    builder
      .addCase(fetchConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.currentConversation = action.payload.conversation;
        state.messages = action.payload.messages;
        state.loading = false;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '대화를 불러올 수 없습니다.';
      });
    
    // Send message
    builder
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      });
    
    // Toggle favorite
    builder
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const conversation = state.conversations.find(
          c => c.id === action.payload.conversationId
        );
        if (conversation) {
          conversation.favorite = !conversation.favorite;
        }
      });
    
    // Delete conversation
    builder
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(
          c => c.id !== action.payload
        );
      });
    
    // Mark as read
    builder
      .addCase(markAsRead.fulfilled, (state, action) => {
        const conversation = state.conversations.find(
          c => c.id === action.payload
        );
        if (conversation) {
          state.unreadCount -= conversation.unread_count;
          conversation.unread_count = 0;
        }
      });
  },
});

export const { clearCurrentConversation, clearError, updateUnreadCount } = conversationSlice.actions;
export default conversationSlice.reducer;