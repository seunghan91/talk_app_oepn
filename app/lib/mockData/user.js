/**
 * 사용자 관련 모의 데이터
 */

const userMocks = {
  // 사용자 프로필 정보
  '/api/users/profile': {
    id: 2,
    nickname: '이영희',
    gender: 'female',
    age_range: '30-39',
    created_at: '2023-01-15T08:30:00Z',
    updated_at: '2023-03-20T14:22:00Z',
    broadcast_count: 12,
    message_count: 48
  },
  
  // 사용자 정보 업데이트
  '/api/users/update_profile': (config) => {
    try {
      const requestData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      
      return {
        success: true,
        message: '프로필이 성공적으로 업데이트되었습니다.',
        user: {
          id: 2,
          nickname: requestData.nickname || '이영희',
          gender: requestData.gender || 'female',
          age_range: requestData.age_range || '30-39',
          updated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: '프로필 업데이트에 실패했습니다.'
      };
    }
  },
  
  // 사용자 알림 설정
  '/api/v1/users/notification_settings': {
    push_enabled: true,
    broadcast_push_enabled: true,
    message_push_enabled: true,
    receive_new_letter: true,
    letter_receive_alarm: true,
    updated_at: '2023-05-10T09:15:00Z'
  }
};

export default userMocks; 