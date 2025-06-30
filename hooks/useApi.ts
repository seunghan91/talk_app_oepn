import { useRef } from 'react';
import axiosInstance from '../app/lib/axios';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export const useApi = () => {
  const authTokenRef = useRef<string | null>(null);

  const setAuthToken = (token: string) => {
    authTokenRef.current = token;
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const clearAuthToken = () => {
    authTokenRef.current = null;
    delete axiosInstance.defaults.headers.common['Authorization'];
  };

  const get = async <T = any>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance.get<T>(url);
      return { data: response.data };
    } catch (error: any) {
      console.error(`GET ${url} 실패:`, error);
      return { error: error.response?.data?.error || error.message };
    }
  };

  const post = async <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance.post<T>(url, data);
      return { data: response.data };
    } catch (error: any) {
      console.error(`POST ${url} 실패:`, error);
      return { error: error.response?.data?.error || error.message };
    }
  };

  const put = async <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance.put<T>(url, data);
      return { data: response.data };
    } catch (error: any) {
      console.error(`PUT ${url} 실패:`, error);
      return { error: error.response?.data?.error || error.message };
    }
  };

  const del = async <T = any>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance.delete<T>(url);
      return { data: response.data };
    } catch (error: any) {
      console.error(`DELETE ${url} 실패:`, error);
      return { error: error.response?.data?.error || error.message };
    }
  };

  return {
    setAuthToken,
    clearAuthToken,
    get,
    post,
    put,
    delete: del,
  };
}; 