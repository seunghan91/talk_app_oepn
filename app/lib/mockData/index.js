/**
 * 모의 API 응답 데이터 모듈
 * 
 * 이 파일은 모든 모의 API 응답 데이터를 중앙에서 관리하고 내보내는 역할을 합니다.
 * 각 API 도메인별로 모의 데이터는 개별 파일로 분리되어 있습니다.
 */

// 각 도메인별 모의 데이터 가져오기
import authMocks from './auth';
import userMocks from './user';
import conversationMocks from './conversations';
import broadcastMocks from './broadcasts';
import notificationMocks from './notifications';
import walletMocks from './wallet';
import announcementMocks from './announcements';

// 모든 모의 응답을 하나의 객체로 결합
const mockResponses = {
  ...authMocks,
  ...userMocks,
  ...conversationMocks,
  ...broadcastMocks,
  ...notificationMocks,
  ...walletMocks,
  ...announcementMocks,
};

export default mockResponses; 