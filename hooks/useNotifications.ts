import { useCallback } from 'react';
import axiosInstance from '@lib/axios';
import { useApiCache } from './useApiCache';

interface NotificationData {
  notifications: Array<{
    id: number;
    type: string;
    title: string;
    body: string;
    read: boolean;
    created_at: string;
    related_id?: number;
  }>;
  unread_count: number;
}

interface UseNotificationsOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

/**
 * 알림 정보를 관리하는 커스텀 훅
 * 중복 요청 방지 및 캐싱 적용
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    enabled = true,
    refetchInterval = 0, // 수동 폴링으로 변경
    staleTime = 15000    // 15초간 캐시 유지 (알림은 더 자주 업데이트)
  } = options;

  // API 요청 함수
  const fetchNotifications = useCallback(async (): Promise<NotificationData> => {
    const response = await axiosInstance.get<NotificationData>('/api/v1/notifications');
    return response.data;
  }, []);

  const {
    data: notifications,
    error,
    isLoading,
    isFetching,
    refetch,
    isStale
  } = useApiCache(
    'notifications',
    fetchNotifications,
    {
      enabled,
      refetchInterval,
      staleTime,
      cacheTime: 180000 // 3분
    }
  );

  // 알림 새로고침
  const refreshNotifications = useCallback(() => {
    return refetch();
  }, [refetch]);

  // 알림 읽음 처리 후 캐시 무효화
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await axiosInstance.patch(`/api/v1/notifications/${notificationId}/mark_as_read`);
      // 읽음 처리 후 새로고침
      return refreshNotifications();
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
      throw error;
    }
  }, [refreshNotifications]);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(async () => {
    try {
      await axiosInstance.patch('/api/v1/notifications/mark_all_as_read');
      return refreshNotifications();
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
      throw error;
    }
  }, [refreshNotifications]);

  return {
    notifications: notifications?.notifications ?? [],
    unreadCount: notifications?.unread_count ?? 0,
    error,
    isLoading,
    isFetching,
    isStale,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  };
}

export default useNotifications;