import { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '@lib/axios';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  loading: boolean;
}

interface UseApiCacheOptions {
  staleTime?: number;  // 데이터가 stale로 간주되는 시간 (ms)
  cacheTime?: number;  // 캐시에서 제거되는 시간 (ms)  
  refetchInterval?: number; // 자동 refetch 간격 (ms)
  enabled?: boolean;   // 요청 활성화 여부
}

// 전역 캐시 (다중 탭에서 공유)
const globalCache = new Map<string, CacheEntry<any>>();
const pendingRequests = new Map<string, Promise<any>>();

/**
 * API 요청을 캐싱하고 중복 요청을 방지하는 커스텀 훅
 * React-Query 라이트 버전
 */
export function useApiCache<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: UseApiCacheOptions = {}
) {
  const {
    staleTime = 30000,      // 30초
    cacheTime = 300000,     // 5분
    refetchInterval = 0,    // 자동 refetch 비활성화
    enabled = true
  } = options;

  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // 캐시에서 데이터가 fresh한지 확인
  const isFresh = useCallback((entry: CacheEntry<T>) => {
    return Date.now() - entry.timestamp < staleTime;
  }, [staleTime]);

  // 실제 API 요청 함수
  const fetchData = useCallback(async (isBackground = false) => {
    if (!enabled) return;

    // 중복 요청 방지 - 이미 진행 중인 요청이 있으면 기다림
    if (pendingRequests.has(queryKey)) {
      try {
        const result = await pendingRequests.get(queryKey);
        if (isMountedRef.current) {
          setData(result);
          setError(null);
        }
        return result;
      } catch (err) {
        if (isMountedRef.current) {
          setError(err as Error);
        }
        throw err;
      }
    }

    if (!isBackground && isMountedRef.current) {
      setIsLoading(true);
    }
    if (isMountedRef.current) {
      setIsFetching(true);
    }

    // 새로운 요청 시작
    const requestPromise = queryFn()
      .then((result) => {
        // 캐시 업데이트
        globalCache.set(queryKey, {
          data: result,
          timestamp: Date.now(),
          loading: false
        });

        if (isMountedRef.current) {
          setData(result);
          setError(null);
          setIsLoading(false);
          setIsFetching(false);
        }

        return result;
      })
      .catch((err) => {
        if (isMountedRef.current) {
          setError(err);
          setIsLoading(false);
          setIsFetching(false);
        }
        throw err;
      })
      .finally(() => {
        pendingRequests.delete(queryKey);
      });

    pendingRequests.set(queryKey, requestPromise);
    return requestPromise;
  }, [queryKey, queryFn, enabled, staleTime]);

  // 수동 refetch
  const refetch = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  // 초기 데이터 로드 및 캐시 확인
  useEffect(() => {
    if (!enabled) return;

    const cachedEntry = globalCache.get(queryKey);
    
    if (cachedEntry && isFresh(cachedEntry)) {
      // 캐시된 데이터가 fresh하면 사용
      setData(cachedEntry.data);
      setError(null);
      setIsLoading(false);
    } else {
      // 캐시된 데이터가 없거나 stale하면 새로 fetch
      fetchData(false).catch(() => {
        // 에러는 fetchData 내부에서 처리됨
      });
    }
  }, [queryKey, enabled, fetchData, isFresh]);

  // 자동 refetch 설정
  useEffect(() => {
    if (refetchInterval > 0 && enabled) {
      intervalRef.current = setInterval(() => {
        const cachedEntry = globalCache.get(queryKey);
        if (!cachedEntry || !isFresh(cachedEntry)) {
          fetchData(true).catch(() => {
            // Background fetch 에러는 무시
          });
        }
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, queryKey, fetchData, isFresh]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 오래된 캐시 정리
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      for (const [key, entry] of globalCache.entries()) {
        if (now - entry.timestamp > cacheTime) {
          globalCache.delete(key);
        }
      }
    };

    const cleanupInterval = setInterval(cleanup, cacheTime / 2);
    return () => clearInterval(cleanupInterval);
  }, [cacheTime]);

  return {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
    // 추가 유틸리티
    isStale: data ? !isFresh(globalCache.get(queryKey) || { data, timestamp: 0, loading: false }) : false
  };
}

// 특정 쿼리 무효화
export function invalidateQuery(queryKey: string) {
  globalCache.delete(queryKey);
  pendingRequests.delete(queryKey);
}

// 모든 캐시 클리어
export function clearAllCache() {
  globalCache.clear();
  pendingRequests.clear();
}