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
      console.log('로그아웃 시작...');
      
      // 서버에 로그아웃 요청 시도
      try {
        const token = await AsyncStorage.getItem('jwt_token');
        if (token) {
          console.log('서버에 로그아웃 요청 전송...');
          await axiosInstance.post('/api/auth/logout');
          console.log('서버 로그아웃 요청 성공');
        }
      } catch (serverError) {
        // 서버 오류가 있어도 로컬에서는 로그아웃 진행
        console.error('서버 로그아웃 요청 실패:', serverError);
        console.log('로컬에서만 로그아웃 진행');
      }
      
      // 로컬 스토리지에서 토큰 삭제
      await AsyncStorage.removeItem('jwt_token');
      console.log('토큰 삭제 완료');
      
      // 사용자 정보 초기화
      setUser(null);
      console.log('사용자 정보 초기화 완료');
      
      // 개발 환경에서 로그아웃 확인
      if (__DEV__) {
        console.log('로그아웃 성공');
      }
      
      // 홈 화면으로 리다이렉트
      router.replace('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error; // 에러를 상위로 전파하여 UI에서 처리할 수 있도록 함
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
            
            // 전화번호 형식 변경
            const digitsOnly = userData.phone_number.replace(/\D/g, '');
            // 국제 형식으로 변환 (한국)
            const formattedNumber = '+82' + digitsOnly.substring(1);
            
            // 사용자 정보 설정
            setUser({ ...userData, phone_number: formattedNumber });
            console.log('자동 로그인 성공:', userData.nickname);
          } catch (error) {
            console.error('자동 로그인 실패:', error);
            
            // 개발 환경에서도 자동 로그인 실패 시 토큰 삭제
            await AsyncStorage.removeItem('jwt_token');
            console.log('토큰 삭제됨: 자동 로그인 실패');
            
            // 테스트 사용자로 자동 로그인하지 않음
            setUser(null);
          }
        } else {
          console.log('저장된 토큰 없음, 로그인 필요');
          setUser(null);
        }
      } catch (error) {
        console.error('로그인 상태 확인 중 오류:', error);
        setUser(null);
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