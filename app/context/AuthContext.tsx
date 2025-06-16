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
  const router = useRouter();

  // 앱 시작 시 저장된 토큰으로 자동 로그인 시도
  useEffect(() => {
    const loadToken = async () => {
      try {
        setIsLoading(true);
        console.log('토큰 로드 시작...');
        
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        
        console.log('저장된 토큰 확인:', token ? '존재' : '없음');
        console.log('저장된 사용자 데이터 확인:', userData ? '존재' : '없음');
        
        if (token && userData) {
          try {
            // 토큰을 axios 인스턴스의 기본 헤더에 설정
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            console.log('자동 로그인 성공:', parsedUser.nickname);
          } catch (parseError) {
            console.error('사용자 데이터 파싱 오류:', parseError);
            // 잘못된 데이터 제거
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
          }
        } else {
          console.log('저장된 인증 정보가 없음 - 로그인 필요');
        }
      } catch (error) {
        console.error('자동 로그인 실패:', error);
      } finally {
        setIsLoading(false);
        console.log('토큰 로드 완료');
      }
    };

    // 약간의 지연을 추가하여 앱 초기화 완료 후 실행
    const timeoutId = setTimeout(loadToken, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // 로그인 함수
  const login = async (token: string, userData: User): Promise<void> => {
    try {
      console.log('로그인 시작:', { token: token.substring(0, 10) + '...', userData });
      
      // 토큰과 사용자 데이터를 AsyncStorage에 저장
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userToken', token); // 호환성을 위해 userToken도 저장
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // 토큰을 axios 인스턴스의 기본 헤더에 설정
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 상태 업데이트
      setUser(userData);
      setIsLoading(false);
      
      console.log('로그인 성공:', userData);
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      throw error;
    }
  };

  // 로그아웃 함수
  const logout = async (): Promise<void> => {
    try {
      console.log('로그아웃 시작...');
      console.log('현재 사용자 상태:', user ? '로그인됨' : '로그인되지 않음');
      console.log('현재 플랫폼:', Platform.OS);
      
      // 서버에 로그아웃 요청 (선택적)
      try {
        await axiosInstance.post('/api/auth/logout');
        console.log('서버 로그아웃 요청 성공');
      } catch (error) {
        console.warn('서버 로그아웃 실패:', error);
        // 서버 로그아웃이 실패해도 로컬 로그아웃은 진행
      }
      
      // AsyncStorage에서 토큰과 사용자 데이터 제거
      console.log('AsyncStorage에서 토큰 및 사용자 데이터 제거 시작');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      console.log('AsyncStorage에서 토큰 및 사용자 데이터 제거 완료');
      
      // axios 헤더에서 토큰 제거
      delete axiosInstance.defaults.headers.common['Authorization'];
      console.log('axios 헤더에서 토큰 제거 완료');
      
      // 웹 환경에서 추가 처리
      if (Platform.OS === 'web') {
        console.log('웹 환경에서 추가 로그아웃 처리');
        // 웹 환경에서는 localStorage도 함께 정리
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem('token');
            window.localStorage.removeItem('user');
            window.localStorage.removeItem('userToken');
            console.log('localStorage에서 토큰 및 사용자 데이터 제거 완료');
          }
        } catch (webError) {
          console.error('웹 로그아웃 추가 처리 중 오류:', webError);
        }
      }
      
      // 상태 업데이트
      setUser(null);
      setIsLoading(false);
      
      console.log('로그아웃 성공');
      
      // 홈 화면으로 리다이렉트
      console.log('홈 화면으로 리다이렉트');
      router.replace('/');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      throw error;
    }
  };

  // 사용자 정보 업데이트
  const updateUser = async (userData: Partial<User>): Promise<void> => {
    if (user) {
      // 메모리의 사용자 상태 업데이트
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // AsyncStorage에도 업데이트
      try {
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
          const currentUserData = JSON.parse(userDataString);
          const mergedUserData = { ...currentUserData, ...userData };
          await AsyncStorage.setItem('user', JSON.stringify(mergedUserData));
          console.log('사용자 정보 업데이트 및 저장 완료:', userData);
        }
      } catch (error) {
        console.error('AsyncStorage 사용자 정보 업데이트 실패:', error);
      }
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 