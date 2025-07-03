import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import StylishButton from '../components/StylishButton';

// 알림 타입 정의
interface Notification {
  id: number;
  type: 'message' | 'broadcast' | 'system';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  data?: {
    conversation_id?: number;
    broadcast_id?: number;
    [key: string]: any;
  };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 알림 데이터 로드
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // 테스트용 임시 데이터
        const testNotifications: Notification[] = [
          {
            id: 1,
            type: 'message',
            title: '새 메시지',
            body: '홍길동님이 메시지를 보냈습니다.',
            read: false,
            created_at: new Date().toISOString(),
            data: { conversation_id: 123 }
          },
          {
            id: 2,
            type: 'broadcast',
            title: '새 브로드캐스트',
            body: '김철수님이 새 브로드캐스트를 게시했습니다.',
            read: true,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            data: { broadcast_id: 456 }
          },
          {
            id: 3,
            type: 'system',
            title: '시스템 알림',
            body: '앱이 업데이트되었습니다. 새로운 기능을 확인해보세요.',
            read: false,
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        
        setNotifications(testNotifications);
      } catch (error) {
        console.error('알림 로드 실패:', error);
        Alert.alert(t('common.error'), t('notifications.loadError'));
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [t]);

  // 알림 읽음 처리
  const markAsRead = async (notification: Notification) => {
    try {
      // 서버에 읽음 처리 요청 (테스트에서는 생략)
      // await axiosInstance.post(`/api/notifications/${notification.id}/read`);
      
      // 로컬 상태 업데이트
      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // 알림 클릭 처리
  const handleNotificationPress = (notification: Notification) => {
    // 읽음 처리
    if (!notification.read) {
      markAsRead(notification);
    }
    
    // 알림 타입에 따라 다른 화면으로 이동
    switch (notification.type) {
      case 'message':
        if (notification.data?.conversation_id) {
          const params: any = { id: notification.data.conversation_id };
          // 특정 메시지가 있으면 자동 재생을 위해 message_id 추가
          if (notification.data?.message_id) {
            params.autoPlayMessageId = notification.data.message_id;
          }
          router.push({
            pathname: '/conversations/[id]',
            params: params
          });
        }
        break;
      case 'broadcast':
        if (notification.data?.broadcast_id) {
          router.push({
            pathname: '/broadcast'
          });
        }
        break;
      case 'system':
        // 시스템 알림은 특별한 처리 없음
        break;
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      // 서버에 모든 알림 읽음 처리 요청 (테스트에서는 생략)
      // await axiosInstance.post('/api/notifications/read_all');
      
      // 로컬 상태 업데이트
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      
      Alert.alert(t('common.success'), t('notifications.allMarkedAsRead'));
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
      Alert.alert(t('common.error'), t('notifications.markAllError'));
    }
  };

  // 알림 아이템 렌더링
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    // 알림 타입에 따른 아이콘 설정
    let icon;
    switch (item.type) {
      case 'message':
        icon = <Ionicons name="chatbubble" size={24} color="#007AFF" />;
        break;
      case 'broadcast':
        icon = <Ionicons name="radio" size={24} color="#FF9500" />;
        break;
      case 'system':
        icon = <Ionicons name="information-circle" size={24} color="#34C759" />;
        break;
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <ThemedView style={styles.notificationIcon}>
          {icon}
        </ThemedView>
        
        <ThemedView style={styles.notificationContent}>
          <ThemedText style={styles.notificationTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.notificationBody}>{item.body}</ThemedText>
          <ThemedText style={styles.notificationTime}>
            {new Date(item.created_at).toLocaleString()}
          </ThemedText>
        </ThemedView>
        
        {!item.read && (
          <ThemedView style={styles.unreadIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <ThemedText type="title">{t('notifications.title')}</ThemedText>
        
        <TouchableOpacity 
          style={styles.markAllButton}
          onPress={markAllAsRead}
        >
          <ThemedText style={styles.markAllText}>{t('notifications.markAllAsRead')}</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      {loading ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText>{t('common.loading')}</ThemedText>
        </ThemedView>
      ) : notifications.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#CCCCCC" />
          <ThemedText style={styles.emptyText}>{t('notifications.empty')}</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    color: '#007AFF',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#F0F8FF',
  },
  notificationIcon: {
    marginRight: 16,
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999999',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    alignSelf: 'center',
  },
}); 