import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import axiosInstance from '../lib/axios';
import { Alert } from 'react-native';

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
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        
        if (token && userData) {
          // 토큰을 axios 인스턴스의 기본 헤더에 설정
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(JSON.parse(userData));
          setIsLoading(false);
          console.log('자동 로그인 성공');
        }
      } catch (error) {
        console.error('자동 로그인 실패:', error);
      }
    };

    loadToken();
  }, []);

  // 로그인 함수
  const login = async (token: string, userData: User): Promise<void> => {
    try {
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
      // 서버에 로그아웃 요청 (선택적)
      try {
        await axiosInstance.post('/api/auth/logout');
      } catch (error) {
        console.warn('서버 로그아웃 실패:', error);
        // 서버 로그아웃이 실패해도 로컬 로그아웃은 진행
      }
      
      // AsyncStorage에서 토큰과 사용자 데이터 제거
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      
      // axios 헤더에서 토큰 제거
      delete axiosInstance.defaults.headers.common['Authorization'];
      
      // 상태 업데이트
      setUser(null);
      setIsLoading(false);
      
      console.log('로그아웃 성공');
      
      // 홈 화면으로 리다이렉트
      router.replace('/');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
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
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 