import { useContext, useCallback } from 'react';
import { useRouter } from 'expo-router';
import AuthContext from '../context/AuthContext';
import { useStorage } from './useStorage';
import { useApi } from './useApi';

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: any | null;
  isLoading: boolean;
  login: (token: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const context = useContext(AuthContext);
  const storage = useStorage();
  const api = useApi();
  const router = useRouter();

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const login = useCallback(async (token: string, userData: any) => {
    // 테스트 토큰 체크
    if (token.includes('test_token')) {
      console.log('테스트 토큰으로 로그인 시도, 거부됨');
      return;
    }

    try {
      // 저장소에 토큰 저장
      await storage.setToken(token);
      await storage.setUser(userData);
      
      // API 클라이언트에 토큰 설정
      api.setAuthToken(token);
      
      // Context 업데이트
      context.setUser(userData);
      context.setIsAuthenticated(true);
      
      // 홈으로 이동
      router.replace('/');
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    }
  }, [context, storage, api, router]);

  const logout = useCallback(async () => {
    try {
      // 서버에 로그아웃 요청 (선택적)
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.warn('서버 로그아웃 실패:', error);
      }
      
      // 저장소에서 토큰 제거
      await storage.clearAuth();
      
      // API 클라이언트 토큰 제거
      api.clearAuthToken();
      
      // Context 초기화
      context.setUser(null);
      context.setIsAuthenticated(false);
      
      // 로그인 페이지로 이동
      router.replace('/auth/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
  }, [context, storage, api, router]);

  return {
    isAuthenticated: context.isAuthenticated,
    user: context.user,
    isLoading: context.isLoading,
    login,
    logout,
  };
}; 