// app/repositories/__tests__/BroadcastRepository.test.ts
import { BroadcastRepository } from '../BroadcastRepository';
import { IHttpClient } from '../../services/interfaces/IHttpClient';
import { 
  Broadcast, 
  BroadcastCreateParams, 
  BroadcastListResponse 
} from '../../types/broadcast';

describe('BroadcastRepository', () => {
  let httpClient: jest.Mocked<IHttpClient>;
  let repository: BroadcastRepository;

  beforeEach(() => {
    // Mock HTTP client
    httpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      setAuthToken: jest.fn(),
      clearAuthToken: jest.fn()
    };

    repository = new BroadcastRepository(httpClient);
  });

  describe('create', () => {
    it('브로드캐스트를 생성하고 응답을 반환한다', async () => {
      const createParams: BroadcastCreateParams = {
        audio: new File(['audio'], 'test.wav', { type: 'audio/wav' }),
        recipientGender: 'female',
        recipientCount: 3
      };

      const mockResponse: Broadcast = {
        id: 1,
        userId: 123,
        recipientGender: 'female',
        recipientCount: 3,
        cost: 1500,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-01-08T00:00:00Z',
        audioUrl: 'https://example.com/audio/1.wav'
      };

      httpClient.post.mockResolvedValue({
        data: mockResponse,
        status: 201,
        headers: {}
      });

      const result = await repository.create(createParams);

      // FormData 검증
      expect(httpClient.post).toHaveBeenCalledWith(
        '/api/v1/broadcasts',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // FormData 내용 검증
      const calledFormData = httpClient.post.mock.calls[0][1] as FormData;
      expect(calledFormData.get('broadcast[audio]')).toBe(createParams.audio);
      expect(calledFormData.get('broadcast[recipient_gender]')).toBe('female');
      expect(calledFormData.get('broadcast[recipient_count]')).toBe('3');

      expect(result).toEqual(mockResponse);
    });

    it('오디오 파일 없이 요청 시 에러를 발생시킨다', async () => {
      const createParams: BroadcastCreateParams = {
        audio: null as any,
        recipientGender: 'female',
        recipientCount: 2
      };

      await expect(repository.create(createParams)).rejects.toThrow('Audio file is required');
    });

    it('서버 에러를 적절히 전달한다', async () => {
      const createParams: BroadcastCreateParams = {
        audio: new File(['audio'], 'test.wav'),
        recipientGender: 'female',
        recipientCount: 2
      };

      const error = new Error('Insufficient balance');
      (error as any).status = 422;
      httpClient.post.mockRejectedValue(error);

      await expect(repository.create(createParams)).rejects.toMatchObject({
        message: 'Insufficient balance',
        status: 422
      });
    });
  });

  describe('getAll', () => {
    it('브로드캐스트 목록을 반환한다', async () => {
      const mockResponse: BroadcastListResponse = {
        broadcasts: [
          {
            id: 1,
            userId: 123,
            recipientGender: 'female',
            recipientCount: 2,
            cost: 1000,
            active: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            expiresAt: '2024-01-08T00:00:00Z',
            audioUrl: 'https://example.com/audio/1.wav'
          },
          {
            id: 2,
            userId: 123,
            recipientGender: 'male',
            recipientCount: 1,
            cost: 500,
            active: false,
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
            expiresAt: '2024-01-09T00:00:00Z',
            audioUrl: 'https://example.com/audio/2.wav'
          }
        ],
        meta: {
          currentPage: 1,
          totalPages: 5,
          totalCount: 50,
          perPage: 10
        }
      };

      httpClient.get.mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: {}
      });

      const result = await repository.getAll();

      expect(httpClient.get).toHaveBeenCalledWith('/api/v1/broadcasts', {});
      expect(result).toEqual(mockResponse);
    });

    it('페이지네이션 파라미터를 전달한다', async () => {
      const mockResponse: BroadcastListResponse = {
        broadcasts: [],
        meta: {
          currentPage: 2,
          totalPages: 1,
          totalCount: 10,
          perPage: 10
        }
      };

      httpClient.get.mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: {}
      });

      await repository.getAll({ page: 2, perPage: 10 });

      expect(httpClient.get).toHaveBeenCalledWith('/api/v1/broadcasts', {
        params: { page: 2, per_page: 10 }
      });
    });

    it('필터 파라미터를 전달한다', async () => {
      const mockResponse: BroadcastListResponse = {
        broadcasts: [],
        meta: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 5,
          perPage: 10
        }
      };

      httpClient.get.mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: {}
      });

      await repository.getAll({ 
        active: true,
        recipientGender: 'female'
      });

      expect(httpClient.get).toHaveBeenCalledWith('/api/v1/broadcasts', {
        params: { 
          active: true,
          recipient_gender: 'female'
        }
      });
    });
  });

  describe('getById', () => {
    it('특정 브로드캐스트를 반환한다', async () => {
      const mockBroadcast: Broadcast = {
        id: 1,
        userId: 123,
        recipientGender: 'female',
        recipientCount: 2,
        cost: 1000,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-01-08T00:00:00Z',
        audioUrl: 'https://example.com/audio/1.wav',
        recipients: [
          { id: 1, userId: 456, listened: true, listenedAt: '2024-01-02T00:00:00Z' },
          { id: 2, userId: 789, listened: false, listenedAt: null }
        ]
      };

      httpClient.get.mockResolvedValue({
        data: mockBroadcast,
        status: 200,
        headers: {}
      });

      const result = await repository.getById(1);

      expect(httpClient.get).toHaveBeenCalledWith('/api/v1/broadcasts/1', {});
      expect(result).toEqual(mockBroadcast);
    });

    it('존재하지 않는 브로드캐스트 조회 시 에러를 발생시킨다', async () => {
      const error = new Error('Broadcast not found');
      (error as any).status = 404;
      httpClient.get.mockRejectedValue(error);

      await expect(repository.getById(999)).rejects.toMatchObject({
        message: 'Broadcast not found',
        status: 404
      });
    });
  });

  describe('reply', () => {
    it('브로드캐스트에 답장을 전송한다', async () => {
      const replyParams = {
        broadcastId: 1,
        audio: new File(['audio'], 'reply.wav', { type: 'audio/wav' })
      };

      const mockResponse = {
        success: true,
        message: 'Reply sent successfully',
        conversationId: 123
      };

      httpClient.post.mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: {}
      });

      const result = await repository.reply(replyParams.broadcastId, replyParams.audio);

      // FormData 검증
      expect(httpClient.post).toHaveBeenCalledWith(
        '/api/v1/broadcasts/1/reply',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const calledFormData = httpClient.post.mock.calls[0][1] as FormData;
      expect(calledFormData.get('reply[audio]')).toBe(replyParams.audio);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('cancel', () => {
    it('브로드캐스트를 취소한다', async () => {
      const mockResponse = {
        success: true,
        message: 'Broadcast cancelled'
      };

      httpClient.delete.mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: {}
      });

      const result = await repository.cancel(1);

      expect(httpClient.delete).toHaveBeenCalledWith('/api/v1/broadcasts/1', {});
      expect(result).toEqual(mockResponse);
    });

    it('이미 취소된 브로드캐스트 재취소 시 에러를 발생시킨다', async () => {
      const error = new Error('Broadcast already cancelled');
      (error as any).status = 422;
      httpClient.delete.mockRejectedValue(error);

      await expect(repository.cancel(1)).rejects.toMatchObject({
        message: 'Broadcast already cancelled',
        status: 422
      });
    });
  });

  describe('getRecipients', () => {
    it('브로드캐스트 수신자 목록을 반환한다', async () => {
      const mockRecipients = [
        { 
          id: 1, 
          userId: 456, 
          listened: true, 
          listenedAt: '2024-01-02T00:00:00Z',
          user: { id: 456, nickname: 'User1', gender: 'female' }
        },
        { 
          id: 2, 
          userId: 789, 
          listened: false, 
          listenedAt: null,
          user: { id: 789, nickname: 'User2', gender: 'female' }
        }
      ];

      httpClient.get.mockResolvedValue({
        data: { recipients: mockRecipients },
        status: 200,
        headers: {}
      });

      const result = await repository.getRecipients(1);

      expect(httpClient.get).toHaveBeenCalledWith('/api/v1/broadcasts/1/recipients', {});
      expect(result).toEqual(mockRecipients);
    });
  });

  describe('getStatistics', () => {
    it('브로드캐스트 통계를 반환한다', async () => {
      const mockStats = {
        totalBroadcasts: 50,
        activeBroadcasts: 10,
        totalCost: 25000,
        totalRecipients: 150,
        listenedCount: 120,
        listenRate: 0.8,
        averageRecipientsPerBroadcast: 3
      };

      httpClient.get.mockResolvedValue({
        data: mockStats,
        status: 200,
        headers: {}
      });

      const result = await repository.getStatistics();

      expect(httpClient.get).toHaveBeenCalledWith('/api/v1/broadcasts/statistics', {});
      expect(result).toEqual(mockStats);
    });

    it('특정 기간의 통계를 요청한다', async () => {
      const mockStats = {
        totalBroadcasts: 10,
        activeBroadcasts: 2,
        totalCost: 5000,
        totalRecipients: 30,
        listenedCount: 25,
        listenRate: 0.83,
        averageRecipientsPerBroadcast: 3
      };

      httpClient.get.mockResolvedValue({
        data: mockStats,
        status: 200,
        headers: {}
      });

      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-01-31');
      
      await repository.getStatistics({ from: fromDate, to: toDate });

      expect(httpClient.get).toHaveBeenCalledWith('/api/v1/broadcasts/statistics', {
        params: {
          from: '2024-01-01T00:00:00.000Z',
          to: '2024-01-31T00:00:00.000Z'
        }
      });
    });
  });
}); 