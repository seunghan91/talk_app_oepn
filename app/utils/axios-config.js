import axios from 'axios';

// Node.js 환경에 의존하는 기능 비활성화
axios.defaults.adapter = 'http';

// API 기본 URL 설정 (필요시 변경)
axios.defaults.baseURL = 'https://api.example.com';

// 응답 타임아웃 설정
axios.defaults.timeout = 10000;

// 공통 헤더 설정
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// 요청 인터셉터 설정
axios.interceptors.request.use(
  config => {
    // 요청 전에 수행할 작업
    return config;
  },
  error => {
    // 요청 오류 처리
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
axios.interceptors.response.use(
  response => {
    // 응답 데이터 처리
    return response;
  },
  error => {
    // 응답 오류 처리
    return Promise.reject(error);
  }
);

export default axios; 