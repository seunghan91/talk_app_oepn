import { useCallback } from 'react';
import axiosInstance from '@lib/axios';
import { useApiCache } from './useApiCache';

interface WalletData {
  balance: number;
  transaction_count: number;
  formatted_balance: string;
}

interface UseWalletOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

/**
 * 지갑 정보를 관리하는 커스텀 훅
 * 중복 요청 방지 및 캐싱 적용
 */
export function useWallet(options: UseWalletOptions = {}) {
  const {
    enabled = true,
    refetchInterval = 0, // 수동 폴링으로 변경
    staleTime = 30000    // 30초간 캐시 유지
  } = options;

  // API 요청 함수
  const fetchWallet = useCallback(async (): Promise<WalletData> => {
    const response = await axiosInstance.get<WalletData>('/api/v1/wallet');
    return response.data;
  }, []);

  const {
    data: wallet,
    error,
    isLoading,
    isFetching,
    refetch,
    isStale
  } = useApiCache(
    'wallet',
    fetchWallet,
    {
      enabled,
      refetchInterval,
      staleTime,
      cacheTime: 300000 // 5분
    }
  );

  // 지갑 새로고침 (pull-to-refresh 등에서 사용)
  const refreshWallet = useCallback(() => {
    return refetch();
  }, [refetch]);

  return {
    wallet,
    error,
    isLoading,
    isFetching,
    isStale,
    refreshWallet,
    // 편의 속성들
    balance: wallet?.balance ?? 0,
    formattedBalance: wallet?.formatted_balance ?? '₩0',
    transactionCount: wallet?.transaction_count ?? 0
  };
}

export default useWallet;