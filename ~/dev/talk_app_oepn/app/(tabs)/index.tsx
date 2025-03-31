import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App: React.FC = () => {
  const [unreadMessages, setUnreadMessages] = useState(3);

  useEffect(() => {
    // 읽지 않은 메시지 수 가져오기
    const fetchUnreadMessages = async () => {
      try {
        const notificationsResponse = await axios.get('/api/v1/notifications');
        if (notificationsResponse.data && notificationsResponse.data.unread_count !== undefined) {
          setUnreadMessages(notificationsResponse.data.unread_count);
        } else {
          setUnreadMessages(3); // 기본값
        }
      } catch (error) {
        console.error('알림 개수 로드 실패:', error);
        setUnreadMessages(3); // 오류 시 기본값
      }
    };

    fetchUnreadMessages();
  }, []);

  return (
    <div>
      {/* 기존의 코드 부분 */}
    </div>
  );
};

export default App; 