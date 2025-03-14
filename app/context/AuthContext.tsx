import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import axiosInstance from '../lib/axios';

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

  // 토큰 저장 및 사용자 정보 설정
  const login = async (token: string, userData: User): Promise<void> => {
    try {
      await AsyncStorage.setItem('jwt_token', token);
      setUser(userData);
    } catch (error) {
      console.error('로그인 실패:', error);
    }
  };

  // 로그아웃 및 토큰 삭제
  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('jwt_token');
      setUser(null);
      router.replace('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  // 사용자 정보 업데이트
  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // 앱 시작 시 자동 로그인 시도
  useEffect(() => {
    const checkLoginStatus = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('jwt_token');
        
        if (token) {
          console.log('저장된 토큰 발견, 자동 로그인 시도...');
          
          try {
            // 토큰이 있으면 사용자 정보 요청
            const response = await axiosInstance.get<{ user: User }>('/api/me');
            const userData = response.data.user;
            
            // 사용자 정보 설정
            setUser(userData);
            console.log('자동 로그인 성공:', userData.nickname);
          } catch (error) {
            console.error('자동 로그인 실패:', error);
            
            // 개발 환경에서는 테스트 사용자로 로그인
            if (__DEV__) {
              console.log('개발 환경에서 테스트 사용자로 자동 로그인');
              const testUser = {
                id: 1,
                nickname: '테스트사용자',
                phone_number: '01012345678',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              setUser(testUser);
            } else {
              // 프로덕션 환경에서는 토큰 삭제
              await AsyncStorage.removeItem('jwt_token');
            }
          }
        }
      } catch (error) {
        console.error('로그인 상태 확인 중 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkLoginStatus();
  }, []);

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