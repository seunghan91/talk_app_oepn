// app/repositories/BroadcastRepository.ts
import { BaseRepository } from './BaseRepository';
import { IHttpClient } from '../services/interfaces/IHttpClient';
import { 
  Broadcast, 
  BroadcastListResponse, 
  BroadcastCreateParams,
  BroadcastListParams,
  BroadcastReplyResponse,
  BroadcastCancelResponse,
  BroadcastRecipient,
  BroadcastStatistics,
  BroadcastStatisticsParams
} from '../types/broadcast';

export class BroadcastRepository extends BaseRepository {
  protected basePath: string = '/api/v1/broadcasts';

  constructor(httpClient: IHttpClient) {
    super(httpClient);
  }

  async create(params: BroadcastCreateParams): Promise<Broadcast> {
    if (!params.audio) {
      throw new Error('Audio file is required');
    }

    const formData = new FormData();
    formData.append('broadcast[audio]', params.audio);
    formData.append('broadcast[recipient_gender]', params.recipientGender);
    formData.append('broadcast[recipient_count]', params.recipientCount.toString());
    
    if (params.text) {
      formData.append('broadcast[text]', params.text);
    }
    
    if (params.selectionStrategy) {
      formData.append('broadcast[selection_strategy]', params.selectionStrategy);
    }

    const response = await this.httpClient.post<Broadcast>(
      this.basePath,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  }

  async getAll(params?: BroadcastListParams): Promise<BroadcastListResponse> {
    const queryParams: any = {};
    
    if (params?.page) {
      queryParams.page = params.page;
    }
    
    if (params?.perPage) {
      queryParams.per_page = params.perPage;
    }
    
    if (params?.active !== undefined) {
      queryParams.active = params.active;
    }
    
    if (params?.recipientGender) {
      queryParams.recipient_gender = params.recipientGender;
    }

    const response = await this.httpClient.get<BroadcastListResponse>(
      this.basePath,
      { params: queryParams }
    );
    
    return response.data;
  }

  async getById(id: number): Promise<Broadcast> {
    const response = await this.httpClient.get<Broadcast>(
      `${this.basePath}/${id}`,
      {}
    );
    
    return response.data;
  }

  async reply(broadcastId: number, audio: File | Blob): Promise<BroadcastReplyResponse> {
    const formData = new FormData();
    formData.append('reply[audio]', audio);

    const response = await this.httpClient.post<BroadcastReplyResponse>(
      `${this.basePath}/${broadcastId}/reply`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  }

  async cancel(id: number): Promise<BroadcastCancelResponse> {
    const response = await this.httpClient.delete<BroadcastCancelResponse>(
      `${this.basePath}/${id}`,
      {}
    );
    
    return response.data;
  }

  async getRecipients(broadcastId: number): Promise<BroadcastRecipient[]> {
    const response = await this.httpClient.get<{ recipients: BroadcastRecipient[] }>(
      `${this.basePath}/${broadcastId}/recipients`,
      {}
    );
    
    return response.data.recipients;
  }

  async getStatistics(params?: BroadcastStatisticsParams): Promise<BroadcastStatistics> {
    const queryParams: any = {};
    
    if (params?.from) {
      queryParams.from = params.from.toISOString();
    }
    
    if (params?.to) {
      queryParams.to = params.to.toISOString();
    }

    const response = await this.httpClient.get<BroadcastStatistics>(
      `${this.basePath}/statistics`,
      { params: queryParams }
    );
    
    return response.data;
  }
} 