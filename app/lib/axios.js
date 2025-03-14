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
    }
    
    // 인증 토큰 추가
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (__DEV__) {
          console.log('인증 토큰 추가됨');
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
    if (__DEV__ && error.message === 'Network Error') {
      const url = error.config?.url;
      console.log(`개발 환경: API 서버 연결 실패, 모의 응답 제공 (${url})`);
      
      // 요청 URL에 따라 모의 응답 제공
      if (url === '/api/users/update_profile') {
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
        let hasVoiceFile = false;
        
        try {
          if (error.config.data && error.config.data instanceof FormData) {
            console.log('FormData 객체 감지됨');
            // FormData 내용을 로그로 출력 (디버깅용)
            for (let pair of error.config.data.entries()) {
              console.log(`FormData 항목: ${pair[0]}, 값 유형: ${typeof pair[1]}`);
              if (pair[0] === 'voice_file' && pair[1]) {
                hasVoiceFile = true;
                console.log('음성 파일 정보:', {
                  name: pair[1].name,
                  type: pair[1].type,
                  uri: pair[1].uri ? pair[1].uri.substring(0, 50) + '...' : 'undefined'
                });
              } else {
                // 로그만 출력하고 객체에 저장하지 않음
                console.log(`기타 FormData 항목: ${pair[0]} = ${pair[1]}`);
              }
            }
          } else {
            console.log('FormData 객체가 아님:', typeof error.config.data);
          }
        } catch (e) {
          console.log('FormData 내용 확인 중 오류:', e);
        }
        
        // 음성 파일이 없으면 오류 반환
        if (!hasVoiceFile) {
          return Promise.reject({
            response: {
              status: 400,
              data: { error: "음성 파일이 필요합니다." }
            }
          });
        }
        
        // 지연 효과 추가 (실제 API 호출처럼 보이게)
        return new Promise(resolve => {
          setTimeout(() => {
            // 브로드캐스트 ID 생성
            const broadcastId = Math.floor(Math.random() * 1000);
            console.log(`모의 브로드캐스트 생성: ID ${broadcastId}`);
            
            resolve({
              data: {
                message: "방송이 성공적으로 생성되었습니다.",
                broadcast: {
                  id: broadcastId,
                  created_at: new Date().toISOString(),
                  expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  user: {
                    id: 1,
                    nickname: '테스트사용자'
                  }
                }
              }
            });
          }, 1500); // 1.5초 지연
        });
      } else if (url && url.includes('/api/conversations/') && url.includes('/send_message')) {
        // 대화 메시지 전송 요청에 대한 모의 응답
        console.log(`대화 메시지 전송 요청 처리: ${url}`);
        
        // 대화 ID 추출
        const conversationId = url.split('/')[3];
        console.log(`대화 ID: ${conversationId}`);
        
        // FormData 내용 확인 시도
        let hasVoiceFile = false;
        
        try {
          if (error.config.data && error.config.data instanceof FormData) {
            console.log('FormData 객체 감지됨');
            // FormData 내용을 로그로 출력 (디버깅용)
            for (let pair of error.config.data.entries()) {
              console.log(`FormData 항목: ${pair[0]}, 값 유형: ${typeof pair[1]}`);
              if (pair[0] === 'voice_file' && pair[1]) {
                hasVoiceFile = true;
                console.log('음성 파일 정보:', {
                  name: pair[1].name,
                  type: pair[1].type,
                  uri: pair[1].uri ? pair[1].uri.substring(0, 50) + '...' : 'undefined'
                });
              }
            }
          }
        } catch (e) {
          console.log('FormData 내용 확인 중 오류:', e);
        }
        
        // 음성 파일이 없으면 오류 반환
        if (!hasVoiceFile) {
          return Promise.reject({
            response: {
              status: 400,
              data: { error: "음성 파일이 필요합니다." }
            }
          });
        }
        
        // 지연 효과 추가 (실제 API 호출처럼 보이게)
        return new Promise(resolve => {
          setTimeout(() => {
            // 메시지 ID 생성
            const messageId = Math.floor(Math.random() * 10000);
            console.log(`모의 메시지 생성: ID ${messageId}, 대화 ID ${conversationId}`);
            
            resolve({
              data: {
                message: "메시지가 성공적으로 전송되었습니다.",
                conversation_message: {
                  id: messageId,
                  created_at: new Date().toISOString(),
                  user: {
                    id: 1,
                    nickname: '테스트사용자'
                  }
                }
              }
            });
          }, 1500); // 1.5초 지연
        });
      }
    }
    
    // 401 오류 처리 (인증 만료)
    if (error.response?.status === 401) {
      console.warn('인증 토큰이 만료되었거나 유효하지 않습니다');
      
      // 로그인 페이지로 리디렉션 (개발 환경에서는 제외)
      if (!__DEV__) {
        try {
          // 토큰 제거
          await AsyncStorage.removeItem('jwt_token');
          
          // 현재 경로가 로그인 페이지가 아닌 경우에만 리디렉션
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/auth')) {
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
                    router.replace('/auth');
                  }
                }
              ]
            );
          }
        } catch (storageError) {
          console.error('토큰 제거 실패:', storageError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;