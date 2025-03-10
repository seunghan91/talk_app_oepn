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
      
      // 로그아웃 후 인증 화면으로 이동
      router.replace({
        pathname: '/auth',
        params: { fromHome: 'true' }
      });
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
    const loadUser = async (): Promise<void> => {
      try {
        const token = await AsyncStorage.getItem('jwt_token');
        
        if (token) {
          try {
            // 토큰이 있으면 사용자 정보 요청
            const response = await axiosInstance.get<{ user: User }>('/api/me');
            
            // 사용자 정보가 있으면 설정
            if (response.data && response.data.user) {
              setUser(response.data.user);
            } else {
              // 응답은 성공했지만 사용자 정보가 없는 경우
              await AsyncStorage.removeItem('jwt_token');
              setUser(null);
            }
          } catch (error) {
            console.error('사용자 정보 요청 실패:', error);
            
            // 개발 모드에서는 토큰이 있으면 테스트 사용자로 자동 로그인
            if (__DEV__) {
              console.log('개발 모드: 테스트 사용자로 자동 로그인합니다.');
              // 개발 모드에서도 자동 로그인 비활성화
              // const testUser: User = {
              //   id: 1,
              //   nickname: '테스트사용자',
              //   phone_number: '01012345678',
              //   created_at: new Date().toISOString(),
              //   updated_at: new Date().toISOString()
              // };
              // setUser(testUser);
              // return; // 토큰 삭제하지 않고 테스트 사용자로 로그인 유지
              
              // 개발 모드에서도 토큰이 유효하지 않으면 삭제
              await AsyncStorage.removeItem('jwt_token');
              setUser(null);
            } else {
              // 토큰이 유효하지 않으면 삭제
              await AsyncStorage.removeItem('jwt_token');
              setUser(null);
            }
          }
        } else {
          // 토큰이 없는 경우
          setUser(null);
        }
      } catch (error) {
        console.error('자동 로그인 실패:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
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