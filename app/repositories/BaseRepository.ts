// app/repositories/BaseRepository.ts
import { IHttpClient, Response } from '../services/interfaces/IHttpClient';

export abstract class BaseRepository {
  constructor(protected httpClient: IHttpClient) {}

  protected async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.httpClient.get<T>(url, { params });
    return response.data;
  }

  protected async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.httpClient.post<T>(url, data);
    return response.data;
  }

  protected async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.httpClient.put<T>(url, data);
    return response.data;
  }

  protected async delete<T = any>(url: string): Promise<T> {
    const response = await this.httpClient.delete<T>(url);
    return response.data;
  }

  // 파일 업로드용 메서드
  protected async postFormData<T = any>(url: string, formData: FormData): Promise<T> {
    const response = await this.httpClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // 페이지네이션된 응답 처리
  protected async getPaginated<T = any>(
    url: string,
    page: number = 1,
    perPage: number = 20,
    params?: Record<string, any>
  ): Promise<{
    data: T[];
    meta: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      perPage: number;
    };
  }> {
    const response = await this.httpClient.get<any>(url, {
      params: {
        page,
        per_page: perPage,
        ...params,
      },
    });

    // 서버 응답 형식에 따라 조정 필요
    return {
      data: response.data.data || response.data,
      meta: {
        currentPage: response.data.meta?.current_page || page,
        totalPages: response.data.meta?.total_pages || 1,
        totalCount: response.data.meta?.total_count || 0,
        perPage: response.data.meta?.per_page || perPage,
      },
    };
  }
} 