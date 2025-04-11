/**
 * 대화방 관련 모의 데이터
 */

const conversationMocks = {
  // 대화방 목록 조회
  '/api/conversations': (config) => {
    // 현재 사용자 ID (JWT 토큰에서 추출해야 함)
    const currentUserId = 2; // 예시: 이영희 ID
    
    // 사용자에게 표시 가능한 대화방만 반환
    return {
      success: true,
      conversations: [
        {
          id: 1,
          with_user: {
            id: 1,
            nickname: "김철수",
            gender: "male"
          },
          last_message: {
            id: 101,
            content: "음성 메시지",
            created_at: "2023-03-15T14:30:00Z",
            message_type: "voice"
          },
          updated_at: "2023-03-15T14:30:00Z",
          favorite: false
        },
        {
          id: 2,
          with_user: {
            id: 3,
            nickname: "박지민",
            gender: "female"
          },
          last_message: {
            id: 102,
            content: "음성 메시지",
            created_at: "2023-03-14T09:15:00Z",
            message_type: "voice"
          },
          updated_at: "2023-03-14T09:15:00Z",
          favorite: true
        },
        {
          id: 3,
          with_user: {
            id: 4,
            nickname: "최수진",
            gender: "female"
          },
          last_message: {
            id: 103,
            content: "대화가 종료되었습니다.",
            created_at: "2023-03-13T16:45:00Z",
            message_type: "system"
          },
          updated_at: "2023-03-13T16:45:00Z",
          favorite: false
        }
      ],
      request_id: `req-${Date.now()}`
    };
  },
  
  // 개별 대화방 정보
  '/api/conversations/([0-9]+)': (config, matches) => {
    const conversationId = parseInt(matches[1]);
    // 현재 사용자 ID (JWT 토큰에서 추출해야 함)
    const currentUserId = 2; // 예시: 이영희 ID
    
    let otherUserName = "김철수";
    let otherUserId = 1;
    
    // 대화방 ID에 따라 상대방 정보 변경
    if (conversationId === 2) {
      otherUserName = "박지민";
      otherUserId = 3;
    } else if (conversationId === 3) {
      otherUserName = "최수진";
      otherUserId = 4;
    }
    
    // 대화방 상태 확인
    let status = "active";
    
    // 대화방 ID가 3인 경우 종료된 대화방
    if (conversationId === 3) {
      status = "closed";
    }
    
    const conversation = {
      id: conversationId,
      status: status,
      created_at: "2023-03-15T14:00:00Z",
      updated_at: "2023-03-15T14:30:00Z",
      with_user: {
        id: otherUserId,
        nickname: otherUserName,
        gender: "unspecified"
      }
    };
    
    // 메시지 목록
    const messages = [
      {
        id: 1,
        conversation_id: conversationId,
        sender: { id: 2, nickname: "이영희" },
        message_type: "voice",
        content: null, // 음성 메시지는 content 없음
        voice_file_url: "https://example.com/audio/broadcast1.m4a",
        duration: 15, // 15초
        created_at: "2023-03-15T14:00:00Z",
        is_read: true
      }
    ];
    
    // 대화 상태가 활성 상태인 경우만 메시지 추가
    if (status === "active") {
      messages.push({
        id: 2,
        conversation_id: conversationId,
        sender: { id: otherUserId, nickname: otherUserName },
        message_type: "voice",
        content: null,
        voice_file_url: "https://example.com/audio/reply1.m4a",
        duration: 8, // 8초
        created_at: "2023-03-15T14:15:00Z",
        is_read: true
      });
      
      messages.push({
        id: 3,
        conversation_id: conversationId,
        sender: { id: 2, nickname: "이영희" },
        message_type: "voice",
        content: null,
        voice_file_url: "https://example.com/audio/message3.m4a",
        duration: 12, // 12초
        created_at: "2023-03-15T14:30:00Z",
        is_read: false
      });
    } else if (status === "closed") {
      // 종료된 대화방인 경우 시스템 메시지 추가
      messages.push({
        id: 2,
        conversation_id: conversationId,
        sender: null, // 시스템 메시지
        message_type: "system",
        content: "대화가 종료되었습니다.",
        voice_file_url: null,
        created_at: "2023-03-15T15:00:00Z",
        is_read: true
      });
    }
    
    return {
      conversation: conversation,
      messages: messages
    };
  },
  
  // 대화방 종료 API
  '/api/conversations/([0-9]+)/close': (config, matches) => {
    const conversationId = parseInt(matches[1]);
    return {
      success: true,
      message: "대화가 종료되었습니다.",
      conversation: {
        id: conversationId,
        status: "closed", // 현재 사용자가 종료
        updated_at: new Date().toISOString()
      }
    };
  }
};

export default conversationMocks; 