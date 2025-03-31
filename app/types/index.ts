/**
 * 공지사항 카테고리 타입
 */
export interface AnnouncementCategory {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 공지사항 타입
 */
export interface Announcement {
  id: number;
  title: string;
  content: string;
  category_id: number;
  category: AnnouncementCategory;
  is_important: boolean;
  is_published: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  published_at: string;
}

/**
 * 에러 타입
 */
export type ErrorType = 'network' | 'server' | 'auth' | 'unknown';

/**
 * 알림 타입
 */
export interface Notification {
  id: number;
  type: 'message' | 'broadcast' | 'system' | 'broadcast_reply' | 'new_message' | 'conversation_closed' | 'announcement';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  data?: {
    conversation_id?: number;
    broadcast_id?: number;
    announcement_id?: number;
    [key: string]: any;
  };
  related_id?: number;
}

/**
 * 사용자 타입
 */
export interface User {
  id: number;
  nickname: string;
  email?: string;
  gender?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
} 