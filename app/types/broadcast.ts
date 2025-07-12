// app/types/broadcast.ts

export interface Broadcast {
  id: number;
  userId: number;
  text?: string;
  audioUrl?: string;
  duration?: number;
  recipientGender: 'male' | 'female' | 'all';
  recipientCount: number;
  cost?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string; // expiredAt → expiresAt로 변경
  user?: {
    id: number;
    nickname: string;
    gender: string;
  };
  recipients?: BroadcastRecipient[];
}

export interface BroadcastRecipient {
  id: number;
  userId: number;
  listened: boolean;
  listenedAt: string | null;
  user?: {
    id: number;
    nickname: string;
    gender: string;
  };
}

export interface BroadcastCreateParams {
  audio: File | Blob;
  text?: string;
  recipientGender: 'male' | 'female' | 'all';
  recipientCount: number;
  selectionStrategy?: 'random' | 'activity_based' | 'location_based';
}

export interface CreateBroadcastDto extends BroadcastCreateParams {} // 별칭 유지 (하위 호환성)

export interface BroadcastReplyDto {
  voiceFile?: File | Blob;
  text?: string;
}

export interface BroadcastListParams {
  page?: number;
  perPage?: number;
  active?: boolean;
  recipientGender?: 'male' | 'female' | 'all';
}

export interface BroadcastListResponse {
  broadcasts: Broadcast[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    perPage: number;
  };
}

export interface BroadcastReplyResponse {
  success: boolean;
  message: string;
  conversationId?: number;
}

export interface BroadcastCancelResponse {
  success: boolean;
  message: string;
}

export interface BroadcastStatistics {
  totalBroadcasts: number;
  activeBroadcasts: number;
  totalCost: number;
  totalRecipients: number;
  listenedCount: number;
  listenRate: number;
  averageRecipientsPerBroadcast: number;
}

export interface BroadcastStatisticsParams {
  from?: Date;
  to?: Date;
} 