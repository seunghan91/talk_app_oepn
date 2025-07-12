// hooks/useBroadcast.ts
import { useState, useCallback } from 'react';
import { useBroadcastRepository } from '../app/contexts/DIContext';
import { Broadcast, CreateBroadcastDto, BroadcastReplyDto } from '../app/types/broadcast';

interface UseBroadcastReturn {
  // 상태
  broadcasts: Broadcast[];
  loading: boolean;
  error: string | null;
  
  // 액션
  getBroadcasts: () => Promise<void>;
  createBroadcast: (data: CreateBroadcastDto) => Promise<Broadcast | null>;
  replyToBroadcast: (broadcastId: number, data: BroadcastReplyDto) => Promise<boolean>;
  deleteBroadcast: (id: number) => Promise<boolean>;
  
  // 유틸리티
  clearError: () => void;
}

export const useBroadcast = (): UseBroadcastReturn => {
  const broadcastRepository = useBroadcastRepository();
  
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 브로드캐스트 목록 조회
  const getBroadcasts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await broadcastRepository.getBroadcasts();
      setBroadcasts(data);
    } catch (err: any) {
      const errorMessage = err.message || '브로드캐스트 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('[useBroadcast] getBroadcasts error:', err);
    } finally {
      setLoading(false);
    }
  }, [broadcastRepository]);

  // 브로드캐스트 생성
  const createBroadcast = useCallback(async (data: CreateBroadcastDto): Promise<Broadcast | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const newBroadcast = await broadcastRepository.createBroadcast(data);
      
      // 목록에 추가 (옵션)
      setBroadcasts(prev => [newBroadcast, ...prev]);
      
      return newBroadcast;
    } catch (err: any) {
      const errorMessage = err.message || '브로드캐스트 생성에 실패했습니다.';
      setError(errorMessage);
      console.error('[useBroadcast] createBroadcast error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [broadcastRepository]);

  // 브로드캐스트에 답장
  const replyToBroadcast = useCallback(async (
    broadcastId: number, 
    data: BroadcastReplyDto
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await broadcastRepository.replyToBroadcast(broadcastId, data);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || '답장 전송에 실패했습니다.';
      setError(errorMessage);
      console.error('[useBroadcast] replyToBroadcast error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [broadcastRepository]);

  // 브로드캐스트 삭제
  const deleteBroadcast = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await broadcastRepository.deleteBroadcast(id);
      
      // 목록에서 제거
      setBroadcasts(prev => prev.filter(b => b.id !== id));
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || '브로드캐스트 삭제에 실패했습니다.';
      setError(errorMessage);
      console.error('[useBroadcast] deleteBroadcast error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [broadcastRepository]);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    broadcasts,
    loading,
    error,
    getBroadcasts,
    createBroadcast,
    replyToBroadcast,
    deleteBroadcast,
    clearError,
  };
}; 