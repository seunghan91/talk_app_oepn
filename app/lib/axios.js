// app/lib/axios.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

// 개발 환경인지 확인
const isDev = __DEV__;

// 플랫폼에 따라 다른 baseURL 사용
const getBaseURL = () => {
  // 사용자 지정 IP 주소 사용
  return 'http://192.168.50.105:3000';
  
  // 아래는 기존 코드로, 필요시 주석 해제하여 사용
  /*
  if (Platform.OS === 'web') {
    // 웹에서는 상대 경로 사용 (동일 도메인 가정)
    return '';
  } else if (Platform.OS === 'ios') {
    // iOS 시뮬레이터에서는 localhost 대신 127.0.0.1 사용
    return 'http://127.0.0.1:3000';
  } else {
    // Android 에뮬레이터에서는 10.0.2.2 사용 (에뮬레이터의 localhost)
    return 'http://10.0.2.2:3000';
  }
  */
};

// API 서버 연결 상태 확인 함수
const checkServerConnection = async () => {
  try {
    // fetch API는 timeout 옵션을 직접 지원하지 않으므로 AbortController 사용
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
    
    const response = await fetch(`${getBaseURL()}/api/health_check`, {
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

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000, // 10초 타임아웃 설정
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
  '/api/me': {
    user: {
      id: 1,
      nickname: '테스트사용자',
      phone_number: '01012345678',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  '/api/generate_random_nickname': {
    nickname: generateRandomNickname()
  },
  '/api/auth/request_code': {
    message: '인증코드가 발송되었습니다.',
    success: true,
    test_code: '123456' // 테스트용 인증코드 추가
  },
  '/api/auth/verify_code': {
    token: 'test_token_' + Math.random().toString(36).substring(2),
    user: {
      id: 1,
      nickname: '테스트사용자',
      phone_number: '01012345678',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    is_new_user: false
  },
  '/api/auth/login': {
    token: 'test_token_' + Math.random().toString(36).substring(2),
    user: {
      id: 1,
      nickname: '테스트사용자',
      phone_number: '01012345678',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  '/api/auth/register': {
    token: 'test_token_' + Math.random().toString(36).substring(2),
    user: {
      id: 1,
      nickname: '테스트사용자',
      phone_number: '01012345678',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    message: '회원가입이 완료되었습니다.'
  },
  '/api/auth/logout': {
    message: '로그아웃이 완료되었습니다.',
    success: true
  },
  '/api/users/update_profile': {
    user: {
      id: 1,
      nickname: '테스트사용자',
      phone_number: '01012345678',
      gender: 'unspecified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    message: '프로필이 성공적으로 업데이트되었습니다.'
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
  ]
};

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  async (config) => {
    // 개발 환경에서 요청 로깅
    if (__DEV__) {
      console.log(`[API 요청] ${config.method?.toUpperCase() || 'UNKNOWN'} ${config.url}`, {
        headers: config.headers,
        data: config.data,
        params: config.params
      });
      
      // API 서버 연결 상태 확인 (개발 환경에서만)
      const isServerConnected = await checkServerConnection();
      if (!isServerConnected) {
        console.log('API 서버에 연결할 수 없습니다. 모의 응답을 사용합니다.');
        // 연결 실패 시 모의 응답을 사용하도록 설정
        config.headers['X-Use-Mock-Response'] = 'true';
      }
    }
    
    // 인증 토큰 추가
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (__DEV__) {
          console.log('인증 토큰 추가됨:', token.substring(0, 10) + '...');
        }
      } else if (__DEV__) {
        console.warn('인증 토큰이 없습니다');
      }
    } catch (error) {
      console.error('토큰 가져오기 실패:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('요청 인터셉터 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => {
    // 개발 환경에서 응답 로깅
    if (__DEV__) {
      console.log(`[API 응답] ${response.status} ${response.config.url}`, {
        data: response.data,
        headers: response.headers
      });
    }
    
    return response;
  },
  async (error) => {
    // 오류 로깅
    if (__DEV__) {
      console.error('[API 오류]', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    
    // 개발 환경에서 네트워크 오류 발생 시 모의 응답 제공
    if (__DEV__ && (error.message === 'Network Error' || error.config?.headers['X-Use-Mock-Response'] === 'true')) {
      const url = error.config?.url;
      console.log(`개발 환경: API 서버 연결 실패 또는 모의 응답 요청, 모의 응답 제공 (${url})`);
      
      // 요청 URL에 따라 모의 응답 제공
      if (url && typeof url === 'string' && Object.prototype.hasOwnProperty.call(mockResponses, url)) {
        console.log(`모의 응답 제공: ${url}`);
        
        // 로그인 요청의 경우 사용자 인증 확인
        if (url === '/api/auth/login' && error.config.data) {
          try {
            const loginData = JSON.parse(error.config.data);
            console.log('로그인 요청 데이터:', loginData);
            
            // 테스트 계정 확인 (01012345678/password)
            if (loginData.phone_number === '01012345678' && loginData.password === 'password') {
              // 로그인 성공 응답
              return new Promise(resolve => {
                setTimeout(() => {
                  resolve({
                    data: mockResponses[url]
                  });
                }, 1000);
              });
            } else {
              // 로그인 실패 응답
              return Promise.reject({
                response: {
                  status: 401,
                  data: { error: "전화번호 또는 비밀번호가 올바르지 않습니다." }
                }
              });
            }
          } catch (e) {
            console.log('로그인 데이터 파싱 오류:', e);
          }
        }
        
        // 기타 요청은 일반적인 모의 응답 제공
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              data: mockResponses[url]
            });
          }, 1000); // 1초 지연
        });
      } else if (url === '/api/users/update_profile') {
        // 프로필 업데이트 요청에 대한 모의 응답
        const userData = error.config.data ? JSON.parse(error.config.data).user : {};
        console.log(`프로필 업데이트 요청 처리:`, userData);
        
        return Promise.resolve({
          data: {
            user: {
              id: 1,
              nickname: userData.nickname || '테스트사용자',
              phone_number: '01012345678',
              gender: userData.gender || 'unspecified',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            message: '프로필이 성공적으로 업데이트되었습니다.'
          }
        });
      } else if (url === '/api/broadcasts') {
        // 브로드캐스트 전송 요청에 대한 모의 응답
        console.log(`브로드캐스트 전송 요청 처리`);
        
        // FormData 내용 확인 시도
        let formDataContent = {};
        
        // 모의 응답 제공
        return Promise.resolve({
          data: {
            success: true,
            message: '방송이 성공적으로 전송되었습니다.',
            broadcast: {
              id: Math.floor(Math.random() * 1000),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        });
      }
    }
    
    // 401 오류 처리 (인증 만료)
    if (error.response?.status === 401) {
      console.warn('인증 토큰이 만료되었거나 유효하지 않습니다');
      
      try {
        // 토큰 제거
        await AsyncStorage.removeItem('jwt_token');
        
        // 현재 경로가 로그인 페이지가 아닌 경우에만 리디렉션
        if (!error.config.url.includes('/auth/')) {
          // 리디렉션 전 알림
          Alert.alert(
            '로그인 필요',
            '세션이 만료되었습니다. 다시 로그인해주세요.',
            [
              {
                text: '확인',
                onPress: () => {
                  // 로그인 페이지로 이동
                  const router = require('expo-router').router;
                  router.replace('/auth/login');
                }
              }
            ]
          );
        }
      } catch (storageError) {
        console.error('토큰 제거 실패:', storageError);
      }
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