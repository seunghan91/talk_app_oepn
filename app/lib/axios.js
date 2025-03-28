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

// 테스트용 서버 연결 상태 변수 설정
// 기본적으로 서버가 연결된 것으로 가정 (테스트 모드 비활성화)
let serverConnected = true;

// 앱 시작 시 서버 연결 테스트 실행
checkServerConnection().then(isConnected => {
  serverConnected = isConnected;
  console.log(`[API 연결 상태] ${isConnected ? '연결됨 (실제 API 사용)' : '연결 실패 (테스트 모드 활성화)'}`);
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
    const user = requestData.user || {};
    const { phone_number, password } = user;
    
    // 요청 데이터 로깅
    console.log('[테스트] 로그인 요청 데이터:', JSON.stringify(requestData, null, 2));
    
    // 테스트 계정 정보
    const testAccounts = [
      { phone: '01011111111', password: 'password', id: 1, nickname: 'A - 김철수', gender: 'male' },
      { phone: '01022222222', password: 'password', id: 2, nickname: 'B - 이영희', gender: 'female' },
      { phone: '01033333333', password: 'password', id: 3, nickname: 'C - 박지민', gender: 'male' },
      { phone: '01044444444', password: 'password', id: 4, nickname: 'D - 최수진', gender: 'female' },
      { phone: '01055555555', password: 'password', id: 5, nickname: 'E - 정민준', gender: 'male' }
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
      console.log('[테스트] 계정 로그인 실패: 일치하는 계정 정보 없음');
      console.log('요청된 전화번호:', phone_number);
      console.log('요청된 비밀번호:', password ? '[비밀번호 입력됨]' : '[비밀번호 없음]');
      
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
  
  console.log(`[테스트] 모의 응답 처리 시도: ${url}`);
  console.log(`요청 메서드: ${config.method}`);
  console.log(`요청 데이터: ${config.data || '없음'}`);
  
  // 모의 응답 데이터 확인
  let mockData = mockResponses[url];
  
  // 함수 형태의 모의 응답 처리
  if (typeof mockData === 'function') {
    try {
      mockData = mockData(config);
      console.log(`[테스트] 모의 응답 생성 성공: ${url}`);
    } catch (error) {
      console.error(`[테스트] 모의 응답 생성 오류: ${url}`, error);
      return null;
    }
  }
  
  if (mockData) {
    console.log(`[테스트] 모의 응답 사용: ${url}`, JSON.stringify(mockData, null, 2));
    return [200, mockData];
  }
  
  console.log(`[테스트] 일치하는 모의 응답 없음: ${url}`);
  return null;
};

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  async (config) => {
    // 요청 시작 로깅
    if (__DEV__) {
      console.log(`[API 요청] ${config.method?.toUpperCase() || 'UNKNOWN'} ${config.url}`, 
        config.params ? `\n파라미터: ${JSON.stringify(config.params)}` : '', 
        config.data ? `\n데이터: ${typeof config.data === 'string' ? config.data : JSON.stringify(config.data)}` : ''
      );
      console.log('헤더:', JSON.stringify(config.headers, null, 2));
    }
    
    // JWT 토큰 자동 추가
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[토큰 설정 오류]', error);
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
    // 응답 성공 로깅
    if (__DEV__) {
      console.log(`[API 응답] ${response.config.method?.toUpperCase() || 'UNKNOWN'} ${response.config.url}`, 
        `\n상태: ${response.status}`, 
        response.data ? `\n데이터: ${JSON.stringify(response.data)}` : ''
      );
    }
    return response;
  },
  async (error) => {
    // 서버 응답이 있는 오류 (400, 401, 500 등)
    if (error.response) {
      const { status, data, config } = error.response;
      
      // 오류 상세 내용 로깅
      console.error(`[API 오류] ${config.method?.toUpperCase() || 'UNKNOWN'} ${config.url}`);
      console.error(`상태: ${status}`);
      console.error(`오류 데이터:`, data);
      console.error(`오류 메시지: ${error.message}`);
      
      // 요청 내용 로깅
      console.error(`요청 URL: ${config.baseURL}${config.url}`);
      console.error(`요청 메서드: ${config.method?.toUpperCase() || 'UNKNOWN'}`);
      console.error(`요청 헤더:`, config.headers);
      
      if (config.data) {
        try {
          const requestData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
          console.error(`요청 데이터:`, requestData);
        } catch (e) {
          console.error(`요청 데이터 (원본):`, config.data);
        }
      }
      
      // 응답 헤더 로깅
      console.error(`응답 헤더:`, error.response.headers);
      
      // 401 Unauthorized (토큰 만료 등)
      if (status === 401) {
        try {
          // 토큰 삭제 (로그아웃 처리)
          await AsyncStorage.removeItem('token');
          
          // 개발 환경에서는 알림
          if (__DEV__) {
            // Alert.alert('세션 만료', '다시 로그인해주세요.');
            console.warn('[인증 오류] 토큰이 만료되었거나 유효하지 않습니다. 로그인 페이지로 이동이 필요합니다.');
          }
        } catch (e) {
          console.error('[토큰 삭제 오류]', e);
        }
      }
      // 400 Bad Request (잘못된 요청 형식)
      else if (status === 400) {
        console.error('[400 오류] 잘못된 요청 형식');
        console.error('응답 데이터:', JSON.stringify(data, null, 2));
      }
    }
    // 네트워크 오류 (서버 연결 실패 등)
    else if (error.request) {
      console.error('[네트워크 오류] 서버 응답 없음');
      console.error('요청 URL:', error.request._url || error.config?.url);
      console.error('오류 메시지:', error.message);
      console.error('요청 내용:', error.config);
      
      // 테스트 모드에서 모의 응답 반환 (서버 연결 실패 시)
      if (__DEV__ && !serverConnected) {
        // 요청 URL 가져오기 (baseURL 제외)
        const url = error.config.url.replace(/^\/api\//, '/api/');
        
        try {
          const mockResponse = await handleMockResponse(error.config);
          
          if (mockResponse) {
            console.log(`[테스트 모드] 모의 응답 사용: ${url}`);
            return { data: mockResponse, status: 200, statusText: 'OK (Mocked)', headers: {}, config: error.config };
          }
        } catch (mockError) {
          console.error('[테스트 모드] 모의 응답 생성 오류:', mockError);
        }
      }
    }
    // 그 외 오류 (요청 설정 오류 등)
    else {
      console.error('[API 기타 오류]', error.message);
      if (error.config) {
        console.error('요청 구성:', error.config);
      }
    }
    
    return Promise.reject(error);
  }
);

// 사용자 알림 설정 가져오기 함수
export const getUserNotificationSettings = async (userId) => {
  try {
    // userId가 없으면 현재 로그인된 사용자 ID를 가져옴
    if (!userId) {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        userId = JSON.parse(user).id;
      } else {
        throw new Error('사용자 ID가 필요합니다');
      }
    }
    
    // API 엔드포인트 변경: v1 네임스페이스 대신 루트 API 사용
    const response = await axiosInstance.get(`/api/users/notification_settings`);
    return response.data;
  } catch (error) {
    console.error('알림 설정 가져오기 실패:', error);
    throw error;
  }
};

// 사용자 알림 설정 업데이트 함수
export const updateUserNotificationSettings = async (userId, settings) => {
  try {
    // userId가 없으면 현재 로그인된 사용자 ID를 가져옴
    if (!userId) {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        userId = JSON.parse(user).id;
      } else {
        throw new Error('사용자 ID가 필요합니다');
      }
    }
    
    // API 엔드포인트 변경: v1 네임스페이스 대신 루트 API 사용
    const response = await axiosInstance.patch(`/api/users/notification_settings`, settings);
    return response.data;
  } catch (error) {
    console.error('알림 설정 업데이트 실패:', error);
    throw error;
  }
};

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