/**
 * 공지사항 관련 모의 데이터
 */

const announcementMocks = {
  // 공지사항 목록 조회 API
  '/api/v1/announcements': (config) => {
    return {
      success: true,
      announcements: [
        {
          id: 1,
          title: "앱 업데이트 안내",
          content: "안녕하세요, 토크 앱을 이용해 주셔서 감사합니다. 새로운 버전이 출시되었습니다. 더 나은 사용자 경험을 위해 업데이트를 진행해 주세요.",
          created_at: "2023-05-10T09:00:00Z",
          updated_at: "2023-05-10T09:00:00Z",
          is_important: true
        },
        {
          id: 2,
          title: "서비스 점검 안내",
          content: "6월 15일 오전 2시부터 4시까지 서버 점검이 있을 예정입니다. 해당 시간에는 서비스 이용이 원활하지 않을 수 있으니 양해 부탁드립니다.",
          created_at: "2023-06-10T10:30:00Z",
          updated_at: "2023-06-10T10:30:00Z",
          is_important: true
        },
        {
          id: 3,
          title: "신규 기능 안내",
          content: "이제 음성 메시지에 이모티콘을 첨부할 수 있습니다. 다양한 감정을 표현해보세요!",
          created_at: "2023-06-20T14:15:00Z",
          updated_at: "2023-06-20T14:15:00Z",
          is_important: false
        }
      ]
    };
  },
  
  // 공지사항 상세 조회 API
  '/api/v1/announcements/([0-9]+)': (config, matches) => {
    const announcementId = parseInt(matches[1]);
    
    // 공지사항 ID에 따라 다른 내용 반환
    let announcement = {
      id: announcementId,
      title: "공지사항",
      content: "공지사항 내용입니다.",
      created_at: "2023-05-01T00:00:00Z",
      updated_at: "2023-05-01T00:00:00Z",
      is_important: false
    };
    
    switch (announcementId) {
      case 1:
        announcement = {
          id: 1,
          title: "앱 업데이트 안내",
          content: "안녕하세요, 토크 앱을 이용해 주셔서 감사합니다.\n\n새로운 버전이 출시되었습니다. 더 나은 사용자 경험을 위해 업데이트를 진행해 주세요.\n\n주요 변경사항:\n- 사용자 인터페이스 개선\n- 음성 메시지 품질 향상\n- 버그 수정 및 성능 최적화",
          created_at: "2023-05-10T09:00:00Z",
          updated_at: "2023-05-10T09:00:00Z",
          is_important: true
        };
        break;
      case 2:
        announcement = {
          id: 2,
          title: "서비스 점검 안내",
          content: "안녕하세요, 토크 앱 운영팀입니다.\n\n6월 15일 오전 2시부터 4시까지 서버 점검이 있을 예정입니다. 해당 시간에는 서비스 이용이 원활하지 않을 수 있으니 양해 부탁드립니다.\n\n점검 내용:\n- 데이터베이스 최적화\n- 보안 업데이트 적용\n- 시스템 안정성 강화",
          created_at: "2023-06-10T10:30:00Z",
          updated_at: "2023-06-10T10:30:00Z",
          is_important: true
        };
        break;
      case 3:
        announcement = {
          id: 3,
          title: "신규 기능 안내",
          content: "안녕하세요, 토크 앱 사용자 여러분!\n\n이제 음성 메시지에 이모티콘을 첨부할 수 있습니다. 다양한 감정을 표현해보세요!\n\n사용 방법:\n1. 음성 메시지 녹음 화면에서 이모티콘 버튼 클릭\n2. 원하는 이모티콘 선택\n3. 메시지와 함께 전송\n\n더 다양한 기능을 준비 중이니 많은 관심 부탁드립니다.",
          created_at: "2023-06-20T14:15:00Z",
          updated_at: "2023-06-20T14:15:00Z",
          is_important: false
        };
        break;
    }
    
    return {
      success: true,
      announcement: announcement
    };
  }
};

export default announcementMocks; 