// app/lib/axios.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 개발 환경인지 확인
const isDev = __DEV__;

// 플랫폼에 따라 다른 baseURL 사용
const getBaseURL = () => {
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
    const token = await AsyncStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 개발 환경에서 네트워크 오류 발생 시 모의 응답 제공
    if (isDev && error.message === 'Network Error') {
      const url = error.config.url;
      console.log(`개발 환경: API 서버 연결 실패, 모의 응답 제공 (${url})`);
      
      // 요청 URL에 따라 모의 응답 제공
      if (url === '/api/generate_random_nickname') {
        // 랜덤 닉네임은 매번 새로 생성
        return Promise.resolve({ 
          data: { 
            nickname: generateRandomNickname() 
          } 
        });
      } else if (url === '/api/change_nickname') {
        // 닉네임 변경 요청에 대한 모의 응답
        const nickname = error.config.data ? JSON.parse(error.config.data).nickname : '기본닉네임';
        console.log(`닉네임 변경 요청 처리: ${nickname}`);
        return Promise.resolve({
          data: {
            user: {
              id: 1,
              nickname: nickname,
              phone_number: '01012345678',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            message: '닉네임이 성공적으로 변경되었습니다.'
          }
        });
      } else if (mockResponses[url]) {
        return Promise.resolve({ data: mockResponses[url] });
      }
    }
    
    // 401 Unauthorized 오류 처리
    if (error.response && error.response.status === 401) {
      console.log('인증 오류 발생: 토큰이 만료되었거나 유효하지 않습니다.');
      // 로컬 스토리지에서 토큰 제거
      AsyncStorage.removeItem('jwt_token').catch(err => {
        console.error('토큰 제거 실패:', err);
      });
      
      // 개발 환경에서는 모의 응답 제공
      if (isDev) {
        const url = error.config.url;
        if (url === '/api/change_nickname') {
          const nickname = error.config.data ? JSON.parse(error.config.data).nickname : '기본닉네임';
          console.log(`인증 오류 발생했지만 개발 환경에서 닉네임 변경 요청 처리: ${nickname}`);
          return Promise.resolve({
            data: {
              user: {
                id: 1,
                nickname: nickname,
                phone_number: '01012345678',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              message: '닉네임이 성공적으로 변경되었습니다.'
            }
          });
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;