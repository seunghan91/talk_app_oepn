// app/services/implementations/AxiosHttpClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IHttpClient, RequestConfig, Response, HttpError } from '../interfaces/IHttpClient';

export interface AxiosHttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class AxiosHttpClient implements IHttpClient {
  private axiosInstance: AxiosInstance;
  private authToken: string | null = null;

  constructor(config: AxiosHttpClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 요청 인터셉터
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // 토큰 설정
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        } else {
          // AsyncStorage에서 토큰 확인
          const token = await AsyncStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // 로깅 (개발 환경)
        if (__DEV__) {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        if (__DEV__) {
          console.error(`[API Error] ${error.response?.status || 'NETWORK ERROR'} ${error.config?.method?.toUpperCase() || 'UNKNOWN'} ${error.config?.url || 'UNKNOWN'}`);
        }

        // 401 처리
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  private transformError(error: any): HttpError {
    if (error.response) {
      return {
        message: error.response.data?.error || error.response.data?.message || 'Server error',
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      return {
        message: 'Network error - No response from server',
      };
    } else {
      return {
        message: error.message || 'Unknown error',
      };
    }
  }

  private async handleUnauthorized(): Promise<void> {
    // 토큰 제거
    await AsyncStorage.removeItem('token');
    this.authToken = null;
    
    // 이벤트 발행 (옵션)
    // EventBus.emit('auth:unauthorized');
  }

  private toAxiosConfig(config?: RequestConfig): AxiosRequestConfig {
    return {
      headers: config?.headers,
      params: config?.params,
      timeout: config?.timeout,
      signal: config?.signal,
    };
  }

  async get<T = any>(url: string, config?: RequestConfig): Promise<Response<T>> {
    const response = await this.axiosInstance.get<T>(url, this.toAxiosConfig(config));
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    };
  }

  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>> {
    const response = await this.axiosInstance.post<T>(url, data, this.toAxiosConfig(config));
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    };
  }

  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>> {
    const response = await this.axiosInstance.put<T>(url, data, this.toAxiosConfig(config));
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    };
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<Response<T>> {
    const response = await this.axiosInstance.delete<T>(url, this.toAxiosConfig(config));
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    };
  }

  setAuthToken(token: string): void {
    this.authToken = token;
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    this.authToken = null;
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  addRequestInterceptor(onFulfilled: (config: any) => any, onRejected?: (error: any) => any): void {
    this.axiosInstance.interceptors.request.use(onFulfilled, onRejected);
  }

  addResponseInterceptor(onFulfilled: (response: any) => any, onRejected?: (error: any) => any): void {
    this.axiosInstance.interceptors.response.use(onFulfilled, onRejected);
  }
} 