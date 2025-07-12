// app/services/implementations/__tests__/AxiosHttpClient.test.ts
import { AxiosHttpClient } from '../AxiosHttpClient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('AxiosHttpClient', () => {
  let httpClient: AxiosHttpClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: { headers: { common: {} } },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    // Create client instance
    httpClient = new AxiosHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('axios 인스턴스를 올바른 설정으로 생성한다', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    });

    it('인터셉터를 설정한다', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('HTTP methods', () => {
    describe('get', () => {
      it('GET 요청을 수행하고 응답을 반환한다', async () => {
        const mockResponse = {
          data: { id: 1, name: 'Test' },
          status: 200,
          headers: { 'content-type': 'application/json' }
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await httpClient.get('/users/1');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/1', {});
        expect(result).toEqual({
          data: mockResponse.data,
          status: mockResponse.status,
          headers: mockResponse.headers
        });
      });

      it('쿼리 파라미터를 전달한다', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: [], status: 200, headers: {} });

        await httpClient.get('/users', { params: { page: 1, limit: 10 } });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users', {
          params: { page: 1, limit: 10 }
        });
      });
    });

    describe('post', () => {
      it('POST 요청을 수행하고 응답을 반환한다', async () => {
        const postData = { name: 'New User', email: 'test@example.com' };
        const mockResponse = {
          data: { id: 2, ...postData },
          status: 201,
          headers: { 'content-type': 'application/json' }
        };
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await httpClient.post('/users', postData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', postData, {});
        expect(result).toEqual({
          data: mockResponse.data,
          status: mockResponse.status,
          headers: mockResponse.headers
        });
      });
    });

    describe('put', () => {
      it('PUT 요청을 수행한다', async () => {
        const updateData = { name: 'Updated User' };
        const mockResponse = {
          data: { id: 1, ...updateData },
          status: 200,
          headers: {}
        };
        mockAxiosInstance.put.mockResolvedValue(mockResponse);

        const result = await httpClient.put('/users/1', updateData);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/users/1', updateData, {});
        expect(result.data).toEqual(mockResponse.data);
      });
    });

    describe('delete', () => {
      it('DELETE 요청을 수행한다', async () => {
        const mockResponse = {
          data: { message: 'Deleted' },
          status: 204,
          headers: {}
        };
        mockAxiosInstance.delete.mockResolvedValue(mockResponse);

        const result = await httpClient.delete('/users/1');

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/users/1', {});
        expect(result.status).toBe(204);
      });
    });
  });

  describe('Authentication', () => {
    describe('setAuthToken', () => {
      it('인증 토큰을 설정한다', () => {
        const token = 'test-token-123';
        
        httpClient.setAuthToken(token);

        expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`);
      });
    });

    describe('clearAuthToken', () => {
      it('인증 토큰을 제거한다', () => {
        // First set a token
        httpClient.setAuthToken('test-token');
        expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe('Bearer test-token');

        // Then clear it
        httpClient.clearAuthToken();
        
        expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBeUndefined();
      });
    });
  });

  describe('Request Interceptor', () => {
    let requestInterceptor: any;

    beforeEach(() => {
      // Get the request interceptor function
      requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    });

    it('저장된 토큰이 있으면 헤더에 추가한다', async () => {
      mockedAsyncStorage.getItem.mockResolvedValue('stored-token');
      
      const config = { headers: {} };
      const result = await requestInterceptor(config);

      expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('token');
      expect(result.headers.Authorization).toBe('Bearer stored-token');
    });

    it('setAuthToken으로 설정한 토큰을 우선 사용한다', async () => {
      httpClient.setAuthToken('direct-token');
      
      const config = { headers: {} };
      const result = await requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer direct-token');
      expect(mockedAsyncStorage.getItem).not.toHaveBeenCalled();
    });
  });

  describe('Response Interceptor', () => {
    let responseInterceptor: any;
    let errorInterceptor: any;

    beforeEach(() => {
      // Get the response interceptor functions
      const interceptorCalls = mockAxiosInstance.interceptors.response.use.mock.calls[0];
      responseInterceptor = interceptorCalls[0];
      errorInterceptor = interceptorCalls[1];
    });

    it('성공적인 응답을 그대로 반환한다', () => {
      const response = { data: { success: true }, status: 200 };
      const result = responseInterceptor(response);
      
      expect(result).toBe(response);
    });

    it('401 에러 시 토큰을 제거한다', async () => {
      const error = {
        response: { status: 401, data: { error: 'Unauthorized' } },
        config: { url: '/test' }
      };

      mockedAsyncStorage.removeItem.mockResolvedValue();

      await expect(errorInterceptor(error)).rejects.toMatchObject({
        message: 'Unauthorized',
        status: 401
      });

      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('네트워크 에러를 적절히 변환한다', async () => {
      const error = {
        request: {},
        message: 'Network Error'
      };

      await expect(errorInterceptor(error)).rejects.toMatchObject({
        message: 'Network error - No response from server'
      });
    });

    it('서버 에러 응답을 적절히 변환한다', async () => {
      const error = {
        response: {
          status: 500,
          data: { error: 'Internal Server Error' }
        }
      };

      await expect(errorInterceptor(error)).rejects.toMatchObject({
        message: 'Internal Server Error',
        status: 500
      });
    });
  });

  describe('Error handling', () => {
    it('HTTP 에러를 HttpError 형식으로 변환한다', async () => {
      const axiosError = new Error('Request failed');
      (axiosError as any).response = {
        status: 400,
        data: { error: 'Bad Request', details: 'Invalid input' }
      };
      
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(httpClient.get('/test')).rejects.toMatchObject({
        message: 'Bad Request',
        status: 400,
        data: { error: 'Bad Request', details: 'Invalid input' }
      });
    });
  });
}); 