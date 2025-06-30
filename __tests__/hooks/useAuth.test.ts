import { renderHook, act } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import { AuthProvider } from '../../contexts/AuthContext';
import React from 'react';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('초기 상태', () => {
    it('초기 상태는 인증되지 않음', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('로그인 기능', () => {
    it('유효한 토큰으로 로그인 성공', async () => {
      const mockToken = 'valid_token_123';
      const mockUser = { id: 1, nickname: '테스트유저', phone_number: '01012345678' };
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        await result.current.login(mockToken, mockUser);
      });
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('테스트 토큰으로는 로그인 실패', async () => {
      const testToken = 'test_token_123';
      const mockUser = { id: 1, nickname: '테스트유저', phone_number: '01012345678' };
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        await result.current.login(testToken, mockUser);
      });
      
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('로그아웃 기능', () => {
    it('로그아웃 시 토큰 제거 및 상태 초기화', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // 먼저 로그인
      await act(async () => {
        await result.current.login('valid_token', { id: 1, nickname: 'test' });
      });
      
      // 로그아웃
      await act(async () => {
        await result.current.logout();
      });
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('토큰 자동 로드', () => {
    it('저장된 토큰이 있으면 자동 로그인', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('saved_token');
      
      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
      
      await waitForNextUpdate();
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
}); 