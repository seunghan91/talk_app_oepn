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
  // 프로덕션 환경과 개발 환경 모두 Render.com 배포 URL 사용
  return 'https://talkk-api.onrender.com';
})();

console.log(`[API 설정] 현재 환경: ${isDev ? '개발' : '프로덕션'}, 플랫폼: ${Platform.OS}, API URL: ${API_URL}`);

// 테스트 모드 기본값 = 비활성화
let useMockResponses = false;

// 서버 연결 상태 체크 함수
export async function checkServerConnection() {
  console.log('[API 연결 테스트] 시작...');
  
  // 연결 테스트를 위한 요청 URL
  const healthCheckUrl = `${API_URL}/api/health_check`;
  console.log('[API 연결 테스트] 요청 URL:', healthCheckUrl);
  
  try {
    // 요청 타임아웃 설정 (8초)
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 8000);
    
    // 서버 헬스 체크 요청
    const response = await fetch(healthCheckUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
    });
    
    // 타임아웃 취소
    clearTimeout(timeoutId);
    
    // 응답 처리
    if (response.ok) {
      const data = await response.json();
      console.log('[API 연결 테스트] 성공:', data);
      return { 
        connected: true, 
        data: data,
        status: response.status,
        timestamp: new Date().toISOString()
      };
    } else {
      console.error('[API 연결 테스트] 실패 - 응답 오류:', response.status, response.statusText);
      
      // 폴백 엔드포인트로 연결 시도
      return await checkFallbackEndpoint();
    }
  } catch (error) {
    // 타임아웃이나 네트워크 오류 처리
    console.error('[API 연결 테스트] 실패 - 네트워크 오류:', error.message || error);
    
    if (error.name === 'AbortError') {
      console.error('[API 연결 테스트] 타임아웃 발생 - 서버가 응답하지 않습니다.');
    }
    
    // 폴백 엔드포인트로 연결 시도
    return await checkFallbackEndpoint();
  }
}

// 폴백(대체) 엔드포인트 체크 함수
async function checkFallbackEndpoint() {
  const fallbackUrl = `${API_URL}/api/ping`;
  console.log('[API 연결 테스트] 폴백 엔드포인트 시도:', fallbackUrl);
  
  try {
    // 폴백 요청 실행 (5초 타임아웃)
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 5000);
    
    // 폴백 엔드포인트 요청
    const response = await fetch(fallbackUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
    });
    
    // 타임아웃 취소
    clearTimeout(timeoutId);
    
    // 응답 처리
    if (response.ok) {
      let responseData = null;
      try {
        responseData = await response.json();
      } catch (e) {
        // JSON이 아닌 경우 텍스트로 처리
        responseData = { message: await response.text() };
      }
      
      console.log('[API 연결 테스트] 폴백 성공:', responseData);
      return { 
        connected: true,
        fallback: true,
        data: responseData,
        status: response.status,
        timestamp: new Date().toISOString()
      };
    } else {
      console.error('[API 연결 테스트] 폴백 실패 - 응답 오류:', response.status, response.statusText);
      return { 
        connected: false,
        error: 'server_error',
        status: response.status,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    // 네트워크 오류로 모든 요청이 실패한 경우
    console.error('[API 연결 테스트] 폴백도 실패 - 서버 연결 불가:', error.message || error);
    
    return { 
      connected: false,
      error: 'network_error',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

// 앱 시작 시 서버 연결 테스트 실행
let isServerConnected = false;
checkServerConnection().then(result => {
  if (result.connected) {
    console.log('[API 연결 상태] 연결됨');
    if (result.fallback) {
      console.log('[API 연결 상태] 폴백 엔드포인트를 통해 연결됨');
    }
    // 연결됨 상태 설정
    isServerConnected = true;
  } else {
    console.error('[API 연결 상태] 연결 실패:', result.error);
    isServerConnected = false;
  }
});

// axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30초
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 테스트 모드 설정 - 필요시 변경 가능
export const setTestMode = (enabled) => {
  useMockResponses = enabled;
  console.log(`[테스트 모드] ${enabled ? '활성화' : '비활성화'}`);
  
  // 테스트 모드 상태 저장 (앱 재시작 시에도 유지)
  try {
    AsyncStorage.setItem('testMode', JSON.stringify(enabled))
      .then(() => console.log(`[테스트 모드] 설정 저장됨: ${enabled}`));
  } catch (err) {
    console.error('[테스트 모드] 설정 저장 실패:', err);
  }
};

// 테스트 모드 상태 불러오기
const loadTestModeState = async () => {
  try {
    const savedTestMode = await AsyncStorage.getItem('testMode');
    if (savedTestMode !== null) {
      useMockResponses = JSON.parse(savedTestMode);
      console.log(`[테스트 모드] 설정 불러옴: ${useMockResponses}`);
    }
  } catch (err) {
    console.error('[테스트 모드] 설정 불러오기 실패:', err);
  }
};

// 앱 시작 시 테스트 모드 상태 불러오기
loadTestModeState();

// 테스트 모드 기본값 설정 (개발 환경에서도 기본적으로 비활성화)
if (isDev) {
  // 이제 개발 환경에서도 기본적으로 테스트 모드 비활성화
  // useMockResponses = true; // 이 코드는 제거
  console.log('[테스트 모드] 개발 환경에서도 기본값은 비활성화입니다. 필요시 명시적으로 활성화하세요.');
}

// 랜덤 닉네임 생성 함수
const generateRandomNickname = () => {
  const adjectives = [
    '행복한', '즐거운', '신나는', '멋진', '귀여운', '용감한', '똑똑한', '친절한', '재미있는', '활발한',
    '다정한', '유쾌한', '엉뚱한', '낙천적인', '예리한', '명랑한', '따뜻한', '깔끔한', '차분한', '온화한',
    '진지한', '열정적인', '우아한', '평화로운', '창의적인', '밝은', '조용한', '강인한', '섬세한', '순수한',
    '사려깊은', '재치있는', '정직한', '담대한', '겸손한', '매력적인', '영리한', '상냥한', '직관적인', '독창적인'
  ];
  
  const nouns = [
    '고양이', '강아지', '토끼', '여우', '사자', '호랑이', '판다', '코끼리', '기린', '원숭이',
    '앵무새', '펭귄', '코알라', '햄스터', '다람쥐', '곰', '늑대', '족제비', '표범', '재규어',
    '캥거루', '참새', '청설모', '하마', '수달', '너구리', '담비', '알파카', '비버', '순록',
    '미어캣', '고슴도치', '카피바라', '치타', '물개', '해달', '판다', '하늘다람쥐', '두루미', '독수리',
    '부엉이', '뱀', '악어', '거북이', '공작새', '올빼미', '까치', '두꺼비', '청개구리', '나비'
  ];
  
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
    
    // 테스트 계정 정보 (베타테스트용 추가 계정 포함)
    const testAccounts = [
      // 기존 테스트 계정
      { phone: '01011111111', password: 'test1234', id: 1, nickname: 'A - 김철수', gender: 'male', is_beta_tester: true },
      { phone: '01022222222', password: 'test1234', id: 2, nickname: 'B - 이영희', gender: 'female', is_beta_tester: true },
      { phone: '01033333333', password: 'test1234', id: 3, nickname: 'C - 박지민', gender: 'male', is_beta_tester: true },
      { phone: '01044444444', password: 'test1234', id: 4, nickname: 'D - 최수진', gender: 'female', is_beta_tester: true },
      { phone: '01055555555', password: 'test1234', id: 5, nickname: 'E - 정민준', gender: 'male', is_beta_tester: true },
      
      // 베타테스트용 추가 계정
      { phone: '01066666666', password: 'beta1234', id: 6, nickname: 'BETA - 강현우', gender: 'male', is_beta_tester: true },
      { phone: '01077777777', password: 'beta1234', id: 7, nickname: 'BETA - 김미나', gender: 'female', is_beta_tester: true },
      { phone: '01088888888', password: 'beta1234', id: 8, nickname: 'BETA - 이준호', gender: 'male', is_beta_tester: true },
      { phone: '01099999999', password: 'beta1234', id: 9, nickname: 'BETA - 박서연', gender: 'female', is_beta_tester: true }
    ];
    
    // 테스트 계정 확인
    const account = testAccounts.find(acc => acc.phone === phone_number && acc.password === password);
    
    if (account) {
      console.log(`[테스트] 계정 로그인 성공: ${account.nickname} (${account.is_beta_tester ? '베타 테스터' : '일반 계정'})`);
      return {
        message: '로그인에 성공했습니다.',
        token: `test_token_${account.id}_${Date.now()}`,
        user: {
          id: account.id,
          phone_number: account.phone,
          nickname: account.nickname,
          gender: account.gender,
          is_beta_tester: account.is_beta_tester,
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
  // 대화 목록 조회용 테스트 응답 추가
  '/api/conversations': (config) => {
    // 현재 로그인된 사용자의 ID와 닉네임을 가져오는 로직
    const getUserInfo = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          return JSON.parse(userDataStr);
        }
        
        // userData가 없는 경우 user 키로도 확인
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          return JSON.parse(userStr);
        }
      } catch (e) {
        console.error('[테스트 모드] 사용자 정보 조회 실패', e);
      }
      return { id: 1, nickname: '김철수' }; // 기본값
    };
    
    // 테스트 데이터 생성
    const generateConversations = async () => {
      const userData = await getUserInfo();
      console.log('[테스트 모드] 현재 사용자:', userData);
      
      // 사용자 ID에 따라 다른 대화 목록 반환
      if (userData.id === 1) { // 김철수 계정
        return {
          conversations: [
            {
              id: 100,
              user: {
                id: 2,
                nickname: 'B - 이영희',
                profile_image: null
              },
              last_message: {
                content: '방송 들어주셔서 감사합니다!',
                created_at: new Date().toISOString(),
                is_read: false
              },
              is_favorite: false,
              unread_count: 1
            },
            {
              id: 101,
              user: {
                id: 3,
                nickname: 'C - 박지민',
                profile_image: null
              },
              last_message: {
                content: '안녕하세요, 반갑습니다!',
                created_at: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
                is_read: true
              },
              is_favorite: true,
              unread_count: 0
            }
          ]
        };
      } else if (userData.id === 2) { // 이영희 계정
        return {
          conversations: [
            {
              id: 100,
              user: {
                id: 1,
                nickname: 'A - 김철수',
                profile_image: null
              },
              last_message: {
                content: '방송 잘 들었습니다!',
                created_at: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
                is_read: true
              },
              is_favorite: true,
              unread_count: 0
            },
            {
              id: 102,
              user: {
                id: 4,
                nickname: 'D - 최수진',
                profile_image: null
              },
              last_message: {
                content: '오늘 날씨 어떤가요?',
                created_at: new Date(Date.now() - 86400000).toISOString(), // 하루 전
                is_read: true
              },
              is_favorite: false,
              unread_count: 0
            }
          ]
        };
      } else {
        // 다른 모든 계정에 대한 기본 대화 목록
        return {
          conversations: [
            {
              id: 103,
              user: {
                id: 1,
                nickname: 'A - 김철수',
                profile_image: null
              },
              last_message: {
                content: '테스트 메시지입니다.',
                created_at: new Date().toISOString(),
                is_read: false
              },
              is_favorite: false,
              unread_count: 1
            }
          ]
        };
      }
    };
    
    // 프로미스를 반환해야 하므로 별도 처리
    return generateConversations();
  },
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
    console.log(`[테스트] 모의 응답 사용: ${url}`, mockData);
    return [200, mockData];
  }
  
  return null;
};

// 인터셉터 설정
axiosInstance.interceptors.request.use(
  async (config) => {
    console.log(`[API 요청] ${config.method?.toUpperCase()} ${config.url}`);
    
    try {
      // 토큰이 있으면 헤더에 추가
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API 요청] 토큰 설정됨');
      }
      
      // 테스트 모드: API 서버가 연결되지 않거나 테스트 모드가 활성화된 경우 모의 응답 사용
      if (useMockResponses || !isServerConnected) {
        console.log('[테스트 모드] 활성화됨, 테스트 응답 사용');
        config._useTestMode = true;
      }
    } catch (error) {
      console.error('[API 요청] 토큰 설정 오류:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('[API 요청 오류]', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[API 응답] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    
    return response;
  },
  async (error) => {
    // 오류 디버깅 메시지 상세화
    console.error(`[API 오류] ${error.response?.status || 'NETWORK ERROR'} ${error.config?.method?.toUpperCase() || 'UNKNOWN'} ${error.config?.url || 'UNKNOWN'}`);
    
    if (error.response) {
      console.error('[API 오류 상세] 서버 응답:', error.response.data);
      
      // 오류 정보 상세 로깅
      console.error('[API 오류 정보]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.config?.headers,
        data: error.config?.data,
        timestamp: new Date().toISOString()
      });
      
      // 401 Unauthorized (인증 실패)
      if (error.response.status === 401) {
        console.error('[API 오류] 인증 오류가 발생했습니다. 로그인이 필요하거나 토큰이 만료되었습니다.');
      }
      
      // 500 서버 오류
      if (error.response.status >= 500) {
        console.error('[API 오류] 서버 오류가 발생했습니다. 백엔드 서버가 불안정하거나 다운되었을 수 있습니다.');
      }
    } else if (error.request) {
      // 요청이 이루어졌으나 응답이 없는 경우 (네트워크 문제)
      console.error('[API 오류 상세] 네트워크 오류:', error.message);
      console.error('[API 오류] 서버에 연결할 수 없습니다. 네트워크 연결을 확인하거나 서버가 실행 중인지 확인해 주세요.');
    } else {
      // 요청 설정 중 오류가 발생한 경우
      console.error('[API 오류 상세] 요청 오류:', error.message);
    }
    
    // 테스트 모드가 활성화된 경우 모의 응답 시도
    if (error.config && error.config._useTestMode) {
      console.log('[테스트 모드] API 오류 발생, 테스트 응답으로 대체 시도');
      
      try {
        const mockResponse = handleMockResponse(error.config);
        if (mockResponse) {
          const [status, data] = mockResponse;
          console.log(`[테스트 모드] 모의 응답 반환 (${error.config.url})`);
          
          // 테스트 응답 데이터와 원본 오류 정보를 함께 로깅
          console.log('[테스트 vs 실제]', {
            url: error.config.url,
            realError: error.response?.data || error.message,
            mockData: data,
            timestamp: new Date().toISOString()
          });
          
          return Promise.resolve({ status, data });
        }
      } catch (mockError) {
        console.error('[테스트 모드] 모의 응답 처리 오류:', mockError);
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