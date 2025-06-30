import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface StorageUser {
  id: number;
  nickname: string;
  phone_number: string;
  [key: string]: any;
}

export const useStorage = () => {
  const setToken = async (token: string) => {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('토큰 저장 실패:', error);
      throw error;
    }
  };

  const getToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('토큰 조회 실패:', error);
      return null;
    }
  };

  const setUser = async (user: StorageUser) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('사용자 정보 저장 실패:', error);
      throw error;
    }
  };

  const getUser = async (): Promise<StorageUser | null> => {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      return null;
    }
  };

  const clearAuth = async () => {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'user', 'token']);
      
      // 웹 환경에서 localStorage 정리
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('저장소 정리 실패:', error);
      throw error;
    }
  };

  return {
    setToken,
    getToken,
    setUser,
    getUser,
    clearAuth,
  };
}; 