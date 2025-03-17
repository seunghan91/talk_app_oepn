// app/lib/axios.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

// 개발 환경인지 확인
const isDev = __DEV__;

// 웹 환경인지 확인
const isWeb = Platform.OS === 'web';

// API 서버 URL 설정
const API_URL = (() => {
  if (__DEV__) {
    // 개발 환경
    if (isWeb) {
      // 웹 환경에서는 상대 경로 사용 (CORS 이슈 방지)
      return '';
    } else {
      // 네이티브 환경에서는 IP 주소 사용
      return 'http://192.168.50.105:3000';
    }
  } else {
    // 프로덕션 환경 - Render.com 배포 URL로 변경
    return 'https://talkk-api.onrender.com';
  }
})();

console.log(`현재 환경: ${isDev ? '개발' : '프로덕션'}, 플랫폼: ${Platform.OS}, API URL: ${API_URL || '상대 경로'}`);

// API 서버 연결 상태 확인 함수
const checkServerConnection = async () => {
  try {
    // fetch API는 timeout 옵션을 직접 지원하지 않으므로 AbortController 사용
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
    
    const url = API_URL ? `${API_URL}/api/health_check` : '/api/health_check';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('API 서버 연결 성공');
      return true;
    } else {
      console.log('API 서버 응답 오류:', response.status);
      return false;
    }
  } catch (error) {
    console.log('API 서버 연결 실패:', error);
    return false;
  }
};

// axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30초
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 랜덤 닉네임 생성 함수
const generateRandomNickname = () => {
  const adjectives = ['행복한', '즐거운', '신나는', '멋진', '귀여운', '용감한', '똑똑한', '친절한', '재미있는', '활발한'];
  const nouns = ['고양이', '강아지', '토끼', '여우', '사자', '호랑이', '판다', '코끼리', '기린', '원숭이'];
  const randomNum = Math.floor(Math.random() * 1000);
  
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${randomAdj}${randomNoun}${randomNum}`;
};

// 모의 응답 데이터
const mockResponses = {
  '/api/generate_random_nickname': {
    nickname: generateRandomNickname()
  },
  '/api/auth/request_code': {
    message: '인증코드가 발송되었습니다.',
    success: true,
    test_code: '123456' // 테스트용 인증코드 추가
  },
  '/api/auth/verify_code': {
    message: '인증코드가 확인되었습니다.',
    success: true,
    verified: true
  },
  '/api/auth/register': (config) => {
    // 요청 데이터 파싱
    const requestData = JSON.parse(config.data || '{}');
    const { phone_number, password, nickname } = requestData;
    
    return {
      message: '회원가입에 성공했습니다.',
      token: `test_token_${Date.now()}`,
      user: {
        id: Math.floor(Math.random() * 1000) + 10,
        phone_number: phone_number,
        nickname: nickname || generateRandomNickname(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  },
  '/api/auth/login': (config) => {
    // 요청 데이터 파싱
    const requestData = JSON.parse(config.data || '{}');
    const { phone_number, password } = requestData;
    
    // 테스트 계정 정보
    const testAccounts = [
      { phone: '01011111111', password: 'test1234', id: 1, nickname: 'A - 김철수', gender: 'male' },
      { phone: '01022222222', password: 'test1234', id: 2, nickname: 'B - 이영희', gender: 'female' },
      { phone: '01033333333', password: 'test1234', id: 3, nickname: 'C - 박지민', gender: 'male' },
      { phone: '01044444444', password: 'test1234', id: 4, nickname: 'D - 최수진', gender: 'female' },
      { phone: '01055555555', password: 'test1234', id: 5, nickname: 'E - 정민준', gender: 'male' }
    ];
    
    // 테스트 계정 확인
    const account = testAccounts.find(acc => acc.phone === phone_number && acc.password === password);
    
    if (account) {
      console.log(`테스트 계정 로그인 성공: ${account.nickname}`);
      return {
        message: '로그인에 성공했습니다.',
        token: `test_token_${account.id}_${Date.now()}`,
        user: {
          id: account.id,
          phone_number: account.phone,
          nickname: account.nickname,
          gender: account.gender,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    } else {
      // 로그인 실패 시 오류 응답
      throw {
        response: {
          status: 401,
          data: { error: '전화번호 또는 비밀번호가 올바르지 않습니다.' }
        }
      };
    }
  },
  '/api/broadcasts': (config) => {
    // 테스트용 브로드캐스트 응답 생성
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 6); // 6일 후 만료
    
    return {
      message: "방송이 성공적으로 생성되었습니다.",
      broadcast: {
        id: Date.now(),
        created_at: now.toISOString(),
        expired_at: expiry.toISOString(),
        user: {
          id: 2, // 이영희의 ID
          nickname: "B - 이영희"
        }
      },
      recipient_count: 4, // 자기 자신 제외
      recipients: [
        { id: 1, nickname: "김철수" },
        { id: 3, nickname: "박지민" },
        { id: 4, nickname: "최수진" },
        { id: 5, nickname: "정민준" }
      ]
    };
  },
  '/api/conversations': [
    {
      id: 1,
      user: {
        id: 101,
        nickname: '김철수',
        profile_image: 'https://randomuser.me/api/portraits/men/32.jpg',
      },
      last_message: {
        content: '안녕하세요, 오늘 방송 잘 들었습니다!',
        created_at: '2023-03-15T14:30:00Z',
        is_read: false,
      },
      is_favorite: true,
      unread_count: 3,
    },
    {
      id: 2,
      user: {
        id: 102,
        nickname: '이영희',
        profile_image: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
      last_message: {
        content: '다음 방송은 언제 하시나요?',
        created_at: '2023-03-14T09:15:00Z',
        is_read: true,
      },
      is_favorite: false,
      unread_count: 0,
    }
  ],
  '/api/users/notification_settings': {
    receive_new_letter: true,
    letter_receive_alarm: true
  }
};

// 모의 응답 처리 함수
const handleMockResponse = (config) => {
  const url = config.url.replace(/^\/api\//, '/api/');
  
  // 모의 응답 데이터 확인
  let mockData = mockResponses[url];
  
  // 함수 형태의 모의 응답 처리
  if (typeof mockData === 'function') {
    mockData = mockData(config);
  }
  
  if (mockData) {
    console.log(`모의 응답 사용: ${url}`, mockData);
    return [200, mockData];
  }
  
  return null;
};

// 인터셉터 설정
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // 개발 환경에서 테스트 용도로 요청 우회 처리
      if (__DEV__) {
        // 로그인 요청 특별 처리
        if (config.url && config.url.includes('/api/auth/login') && config.method === 'post') {
          const requestData = JSON.parse(config.data || '{}');
          const { phone_number, password } = requestData;
          
          // 전화번호 형식 정리 (하이픈 제거)
          const digits_only = phone_number ? phone_number.replace(/-/g, '') : '';
          
          console.log('로그인 요청 데이터:', { phone_number: digits_only, password });
          
          // 테스트 계정 확인
          const testAccounts = [
            { phone: '01011111111', password: 'test1234', id: 1, nickname: 'A - 김철수', gender: 'male' },
            { phone: '01022222222', password: 'test1234', id: 2, nickname: 'B - 이영희', gender: 'female' },
            { phone: '01033333333', password: 'test1234', id: 3, nickname: 'C - 박지민', gender: 'male' },
            { phone: '01044444444', password: 'test1234', id: 4, nickname: 'D - 최수진', gender: 'female' },
            { phone: '01055555555', password: 'test1234', id: 5, nickname: 'E - 정민준', gender: 'male' }
          ];
          
          // 전화번호 형식 수정 (하이픈 제거)
          config.data = JSON.stringify({
            ...requestData,
            phone_number: digits_only
          });
        }
      }
      
      // AsyncStorage에서 토큰 가져오기
      const token = await AsyncStorage.getItem('token');
      
      // 토큰이 있으면 헤더에 추가
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // 개발 환경에서 요청 로깅
      if (__DEV__) {
        console.log('API 요청:', {
          url: config.url,
          method: config.method,
          data: config.data,
          headers: config.headers,
        });
      }
      
      return config;
    } catch (error) {
      console.error('요청 인터셉터 오류:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
axiosInstance.interceptors.response.use(
  (response) => {
    // 개발 환경에서 응답 로깅
    if (__DEV__) {
      console.log('API 응답:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }
    
    return response;
  },
  async (error) => {
    // 개발 환경에서 모의 응답 처리
    if (__DEV__ && error.config) {
      // 웹 환경이거나 서버 연결 실패 시 모의 응답 사용
      if (isWeb || !(await checkServerConnection())) {
        const mockResponse = handleMockResponse(error.config);
        if (mockResponse) {
          const [status, data] = mockResponse;
          console.log(`모의 응답 반환 (${error.config.url}):`, data);
          return Promise.resolve({ status, data });
        }
      }
      
      // 특정 API 요청에 대한 모의 응답 처리
      if (error.config.url) {
        const url = error.config.url.replace(API_URL, '');
        
        // 로그인 요청 특별 처리
        if (url.includes('/api/auth/login') && error.config.method === 'post') {
          try {
            const requestData = JSON.parse(error.config.data || '{}');
            const { phone_number, password } = requestData;
            
            // 테스트 계정 정보
            const testAccounts = [
              { phone: '01011111111', password: 'test1234', id: 1, nickname: 'A - 김철수', gender: 'male' },
              { phone: '01022222222', password: 'test1234', id: 2, nickname: 'B - 이영희', gender: 'female' },
              { phone: '01033333333', password: 'test1234', id: 3, nickname: 'C - 박지민', gender: 'male' },
              { phone: '01044444444', password: 'test1234', id: 4, nickname: 'D - 최수진', gender: 'female' },
              { phone: '01055555555', password: 'test1234', id: 5, nickname: 'E - 정민준', gender: 'male' }
            ];
            
            // 테스트 계정 확인
            const account = testAccounts.find(acc => acc.phone === phone_number && acc.password === password);
            
            if (account) {
              console.log(`테스트 계정 로그인 성공: ${account.nickname}`);
              return Promise.resolve({
                status: 200,
                data: {
                  message: '로그인에 성공했습니다.',
                  token: `test_token_${account.id}_${Date.now()}`,
                  user: {
                    id: account.id,
                    phone_number: account.phone,
                    nickname: account.nickname,
                    gender: account.gender,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                }
              });
            }
          } catch (e) {
            console.error('로그인 모의 응답 처리 오류:', e);
          }
        }
        
        // 회원가입 요청 특별 처리
        if (url.includes('/api/auth/register') && error.config.method === 'post') {
          try {
            const requestData = JSON.parse(error.config.data || '{}');
            const { phone_number, password, nickname } = requestData;
            
            console.log(`테스트 회원가입 성공: ${nickname || '신규 사용자'}`);
            return Promise.resolve({
              status: 200,
              data: {
                message: '회원가입에 성공했습니다.',
                token: `test_token_${Date.now()}`,
                user: {
                  id: Math.floor(Math.random() * 1000) + 10,
                  phone_number: phone_number,
                  nickname: nickname || generateRandomNickname(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              }
            });
          } catch (e) {
            console.error('회원가입 모의 응답 처리 오류:', e);
          }
        }
      }
    }
    
    // 개발 환경에서 오류 로깅
    if (__DEV__) {
      console.log('API 오류:', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    
    // 401 Unauthorized 오류 처리 (토큰 만료 등)
    if (error.response && error.response.status === 401) {
      // 로그인 페이지로 리다이렉트하는 로직 (필요시 구현)
    }
    
    return Promise.reject(error);
  }
);

/*
참고: Rails API 서버에서 CORS 설정이 필요합니다.

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'
    resource '*', headers: :any, methods: [:get, :post, :patch, :put, :delete, :options, :head]
  end
end

Rails Gemfile에 gem 'rack-cors'를 추가하고, config/initializers/cors.rb 파일에 위 설정을 추가해야 합니다.
*/

export default axiosInstance;