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

// API 서버 연결 상태 확인 함수
const checkServerConnection = async () => {
  try {
    console.log('[API 연결 테스트] 시작...');
    
    // fetch API는 timeout 옵션을 직접 지원하지 않으므로 AbortController 사용
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
    
    const url = `${API_URL}/api/health_check`;
    console.log(`[API 연결 테스트] 요청 URL: ${url}`);
    
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
      const data = await response.json();
      console.log('[API 연결 테스트] 성공:', data);
      return true;
    } else {
      console.log('[API 연결 테스트] 응답 오류:', response.status);
      return false;
    }
  } catch (error) {
    console.log('[API 연결 테스트] 실패:', error);
    return false;
  }
};

// 앱 시작 시 서버 연결 테스트 실행
let serverConnected = false;
checkServerConnection().then(isConnected => {
  serverConnected = isConnected;
  console.log(`[API 연결 상태] ${isConnected ? '연결됨' : '연결 실패'}`);
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
      console.log(`[테스트] 계정 로그인 성공: ${account.nickname}`);
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
    console.log(`[테스트] 모의 응답 사용: ${url}`, mockData);
    return [200, mockData];
  }
  
  return null;
};

// 인터셉터 설정
axiosInstance.interceptors.request.use(
  async (config) => {
    console.log(`[API 요청] ${config.method?.toUpperCase()} ${config.url}`);
    
    // 베타 테스트 중이므로 테스트 모드 활성화
    const useMockResponses = true;
    
    try {
      // 토큰이 있으면 헤더에 추가
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API 요청] 토큰 설정됨');
      }
      
      // 베타 테스트 모드: API 서버가 연결되지 않거나 테스트 모드가 활성화된 경우 모의 응답 사용
      if (useMockResponses && (!serverConnected || config.url.includes('/api/auth/'))) {
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
    console.error(`[API 오류] ${error.response?.status || 'NETWORK ERROR'} ${error.config?.method?.toUpperCase() || 'UNKNOWN'} ${error.config?.url || 'UNKNOWN'}`);
    console.error('[API 오류 상세]', error.response?.data || error.message);
    
    // 테스트 모드가 활성화된 경우 모의 응답 시도
    if (error.config && error.config._useTestMode) {
      console.log('[테스트 모드] API 오류 발생, 테스트 응답으로 대체 시도');
      
      try {
        const mockResponse = handleMockResponse(error.config);
        if (mockResponse) {
          const [status, data] = mockResponse;
          console.log(`[테스트 모드] 모의 응답 반환 (${error.config.url})`);
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