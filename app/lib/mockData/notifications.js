/**
 * 알림 관련 모의 데이터
 */

const notificationMocks = {
  // 알림 목록 조회
  '/api/v1/notifications': (config) => {
    return {
      notifications: [
        {
          id: 1,
          type: "broadcast_reply",
          title: "새 답장",
          body: "김철수님이 회원님의 방송에 답장했습니다.",
          related_id: 1, // 대화방 ID
          created_at: "2023-03-15T14:30:00Z",
          read: false
        },
        {
          id: 2,
          type: "new_message",
          title: "새 메시지",
          body: "박지민님이 음성 메시지를 보냈습니다.",
          related_id: 2, // 대화방 ID
          created_at: "2023-03-14T09:15:00Z",
          read: true
        },
        {
          id: 3,
          type: "system",
          title: "공지사항",
          body: "앱이 업데이트되었습니다. 새로운 기능을 확인해보세요.",
          related_id: null,
          created_at: "2023-03-13T10:30:00Z",
          read: false
        },
        {
          id: 4,
          type: "announcement",
          title: "새 공지사항",
          body: "새로운 공지사항이 등록되었습니다.",
          related_id: 1, // 공지사항 ID
          created_at: "2023-03-12T08:45:00Z",
          read: false
        }
      ],
      unread_count: 3
    };
  },
  
  // 알림 읽음 처리 API
  '/api/v1/notifications/([0-9]+)/read': (config, matches) => {
    const notificationId = parseInt(matches[1]);
    return {
      success: true,
      message: "알림이 읽음 처리되었습니다."
    };
  },
  
  // 모든 알림 읽음 처리 API
  '/api/v1/notifications/read_all': () => {
    return {
      success: true,
      message: "모든 알림이 읽음 처리되었습니다."
    };
  }
};

export default notificationMocks; 