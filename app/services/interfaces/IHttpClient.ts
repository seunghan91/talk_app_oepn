// app/services/interfaces/IHttpClient.ts

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  signal?: AbortSignal;
}

export interface Response<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface HttpError {
  message: string;
  status?: number;
  data?: any;
}

// HTTP 클라이언트 인터페이스 (DIP 적용)
export interface IHttpClient {
  // 기본 HTTP 메서드
  get<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;
  
  // 인증 관련
  setAuthToken(token: string): void;
  clearAuthToken(): void;
  
  // 인터셉터 (선택적)
  addRequestInterceptor?(onFulfilled: (config: any) => any, onRejected?: (error: any) => any): void;
  addResponseInterceptor?(onFulfilled: (response: any) => any, onRejected?: (error: any) => any): void;
} 