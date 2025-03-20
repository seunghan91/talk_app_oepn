import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import axiosInstance from '../lib/axios';
import { Alert, Platform } from 'react-native';

interface User {
  id: number;
  nickname: string;
  phone_number: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();

  // 앱 시작 시 저장된 토큰으로 자동 로그인 시도
  useEffect(() => {
    const loadToken = async () => {
      try {
        // 테스트 모드 비활성화
        await AsyncStorage.removeItem('testMode');
        
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        
        if (token && userData) {
          // 테스트 토큰 검사
          if (token.includes('test_token')) {
            console.log('테스트 토큰 발견, 삭제 중...');
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setIsLoading(false);
            return;
          }
          
          // 토큰을 axios 인스턴스의 기본 헤더에 설정
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(JSON.parse(userData));
          setIsLoading(false);
          console.log('자동 로그인 성공');
        } else {
          setIsLoading(false);
          console.log('저장된 토큰이 없음');
        }
      } catch (error) {
        console.error('자동 로그인 실패:', error);
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  // 로그인 함수
  const login = async (token: string, userData: User): Promise<void> => {
    try {
      // 테스트 토큰인지 확인하고 거부
      if (token.includes('test_token')) {
        console.log('테스트 토큰으로 로그인 시도, 거부됨');
        Alert.alert('로그인 실패', '테스트 모드가 비활성화되었습니다. 실제 계정으로 로그인하세요.');
        return;
      }
      
      // 토큰과 사용자 데이터 저장
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // axios 인스턴스에 토큰 설정
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 상태 업데이트
      setUser(userData);
      console.log('로그인 성공:', userData.nickname);

      // 사용자 프로필 정보 요청
      // 프로필 화면으로 이동하지 않고 대화 탭으로 이동
      router.replace('/conversations/');
    } catch (error) {
      console.error('로그인 과정에서 오류 발생:', error);
      Alert.alert('로그인 실패', '로그인 정보를 저장하는 동안 오류가 발생했습니다.');
    }
  };

  // 로그아웃 함수
  const logout = async (): Promise<void> => {
    try {
      console.log('[로그아웃] 시작...');
      console.log('[로그아웃] 현재 사용자 상태:', user ? '로그인됨' : '로그인되지 않음');
      console.log('[로그아웃] 현재 플랫폼:', Platform.OS);
      
      // 서버에 로그아웃 요청 (선택적)
      try {
        await axiosInstance.post('/api/auth/logout');
        console.log('[로그아웃] 서버 로그아웃 요청 성공');
      } catch (error) {
        console.warn('[로그아웃] 서버 로그아웃 실패:', error);
        // 서버 로그아웃이 실패해도 로컬 로그아웃은 진행
      }
      
      // AsyncStorage에서 토큰과 사용자 데이터 제거
      console.log('[로그아웃] AsyncStorage에서 데이터 제거 시작');
      
      // 여러 방법으로 시도
      try {
        await AsyncStorage.multiRemove(['token', 'user', 'userToken']);
        console.log('[로그아웃] AsyncStorage.multiRemove 성공');
      } catch (err) {
        console.error('[로그아웃] multiRemove 실패, 개별 삭제 시도:', err);
        
        // 개별 삭제 시도
        try { await AsyncStorage.removeItem('token'); } catch (e) { console.error('[로그아웃] token 삭제 실패:', e); }
        try { await AsyncStorage.removeItem('user'); } catch (e) { console.error('[로그아웃] user 삭제 실패:', e); }
        try { await AsyncStorage.removeItem('userToken'); } catch (e) { console.error('[로그아웃] userToken 삭제 실패:', e); }
      }
      
      // 웹 환경에서 localStorage에서도 제거
      if (Platform.OS === 'web') {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userToken');
            console.log('[로그아웃] 웹 localStorage에서 데이터 제거 완료');
          }
        } catch (err) {
          console.error('[로그아웃] 웹 localStorage 삭제 실패:', err);
        }
      }
      
      // axios 헤더에서 토큰 제거
      delete axiosInstance.defaults.headers.common['Authorization'];
      console.log('[로그아웃] axios 헤더에서 인증 토큰 제거됨');
      
      // 상태 초기화
      setUser(null);
      setIsAuthenticated(false);
      console.log('[로그아웃] 상태 초기화 완료');
      
      // 로그인 페이지로 리디렉션
      console.log('[로그아웃] 로그인 페이지로 리디렉션');
      setTimeout(() => {
        router.replace('/auth/login');
      }, 100);
      
      return;
    } catch (error) {
      console.error('[로그아웃] 오류 발생:', error);
      // 오류가 발생해도 상태는 초기화
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  // 사용자 정보 업데이트
  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 