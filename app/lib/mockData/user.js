/**
 * 사용자 관련 모의 데이터
 */

// Mock data for user-related APIs
const mockUserResponses = {
  // 사용자 프로필 조회 (v1 API)
  '/api/v1/users/profile': {
    success: true,
    user: {
      id: 2,
      nickname: "이영희",
      gender: "female",
      phone_number: "01022222222",
      age_group: "20s",
      region: "서울",
      cash_amount: 15000
    }
  },

  // 레거시 API 호환성
  '/api/users/profile': {
    success: true,
    user: {
      id: 2,
      nickname: "이영희",
      gender: "female",
      phone_number: "01022222222",
      age_group: "20s",
      region: "서울",
      cash_amount: 15000
    }
  },
  
  // 프로필 업데이트 (v1 API)
  '/api/v1/users/update_profile': (config) => {
    const body = JSON.parse(config.data);
    const user = body.user || {};
    
    return {
      success: true,
      message: "프로필이 성공적으로 업데이트되었습니다.",
      user: {
        id: 2,
        nickname: user.nickname || "이영희",
        gender: user.gender || "female",
        phone_number: "01022222222",
        age_group: user.age_group || "20s",
        region: user.region || "서울",
        cash_amount: 15000
      }
    };
  },

  // 레거시 API 호환성
  '/api/users/update_profile': (config) => {
    const body = JSON.parse(config.data);
    const user = body.user || {};
    
    return {
      success: true,
      message: "프로필이 성공적으로 업데이트되었습니다.",
      user: {
        id: 2,
        nickname: user.nickname || "이영희",
        gender: user.gender || "female",
        phone_number: "01022222222",
        age_group: user.age_group || "20s",
        region: user.region || "서울",
        cash_amount: 15000
      }
    };
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

export default mockUserResponses; 