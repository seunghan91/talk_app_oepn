// API Types generated from OpenAPI spec

// Auth Types
export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  phone_number: string;
  password: string;
  nickname: string;
  gender: 'male' | 'female' | 'other';
}

export interface RequestCodeRequest {
  phone_number: string;
}

export interface RequestCodeResponse {
  message: string;
  expires_at: string;
  code?: string; // Only in development
  user_exists: boolean;
  note?: string;
}

export interface VerifyCodeRequest {
  phone_number: string;
  code: string;
}

// User Types
export interface User {
  id: number;
  phone_number: string;
  nickname: string;
  gender: 'male' | 'female' | 'other' | 'unspecified';
  profile_image_url?: string;
  credits?: number;
  is_suspended?: boolean;
  suspension_reason?: string;
  suspension_until?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface UserProfile extends User {
  email?: string;
  birth_date?: string;
  bio?: string;
  broadcast_count?: number;
  follower_count?: number;
  following_count?: number;
}

// Conversation Types
export interface Conversation {
  id: number;
  with_user: {
    id: number;
    nickname: string;
    gender: string;
    profile_image_url?: string;
  };
  last_message: {
    id: number;
    content: string;
    created_at: string;
    message_type: 'voice' | 'text' | 'image' | 'broadcast';
  };
  updated_at: string;
  favorite: boolean;
  unread_count: number;
}

export interface ConversationDetail {
  id: number;
  user_a_id: number;
  user_b_id: number;
  user_a: User;
  user_b: User;
  created_at: string;
  updated_at: string;
  deleted_by_a: boolean;
  deleted_by_b: boolean;
  favorited_by_a: boolean;
  favorited_by_b: boolean;
  last_read_at_a?: string;
  last_read_at_b?: string;
}

// Message Types
export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender: {
    id: number;
    nickname: string;
  };
  content?: string;
  voice_url?: string;
  image_url?: string;
  duration?: number;
  message_type: 'voice' | 'text' | 'image' | 'broadcast_reply';
  broadcast_id?: number;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface SendMessageRequest {
  message_type: 'voice' | 'text' | 'image';
  content?: string;
  voice_file?: File | Blob;
  image_file?: File | Blob;
}

// Broadcast Types
export interface Broadcast {
  id: number;
  user: {
    id: number;
    nickname: string;
    gender: string;
    profile_image_url?: string;
  };
  content?: string;
  voice_url: string;
  duration?: number;
  recipient_count: number;
  expires_at: string;
  created_at: string;
  status: 'active' | 'expired';
  reply_count?: number;
  is_read?: boolean;
}

export interface CreateBroadcastRequest {
  voice_file: File | Blob;
  content?: string;
  recipient_count: number;
}

export interface BroadcastReplyRequest {
  voice_file: File | Blob;
}

// Notification Types
export interface Notification {
  id: number;
  notification_type: 'broadcast' | 'message' | 'announcement' | 'system';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface NotificationSettings {
  push_enabled: boolean;
  broadcast_push_enabled: boolean;
  message_push_enabled: boolean;
  announcement_push_enabled: boolean;
  night_mode_enabled: boolean;
  night_mode_start: string;
  night_mode_end: string;
}

// Wallet Types
export interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  wallet_id: number;
  amount: number;
  transaction_type: 'credit' | 'debit' | 'purchase' | 'reward';
  description: string;
  reference_type?: string;
  reference_id?: number;
  created_at: string;
}

// Report Types
export interface ReportUserRequest {
  reason: string;
  details?: string;
}

// Block Types
export interface BlockedUser {
  id: number;
  blocked_user: User;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  request_id?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
  request_id?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
}

// List Response Types
export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
  request_id?: string;
}

export interface MessagesResponse {
  conversation: ConversationDetail;
  messages: Message[];
}

export interface BroadcastsResponse {
  success: boolean;
  broadcasts: Broadcast[];
}

export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
}

// Form Data Types for multipart/form-data requests
export interface VoiceMessageFormData {
  voice_file: File | Blob;
  message_type: 'voice';
}

export interface TextMessageFormData {
  content: string;
  message_type: 'text';
}

export interface ImageMessageFormData {
  image_file: File | Blob;
  message_type: 'image';
}