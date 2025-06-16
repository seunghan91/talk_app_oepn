import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert, View, Text, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import StylishButton from '../components/StylishButton';
import axiosInstance from './lib/axios';
import { useAuth } from './context/AuthContext';

// 알림 타입 정의
interface Notification {
  id: number;
  type: 'message' | 'broadcast' | 'system' | 'broadcast_reply' | 'new_message' | 'conversation_closed' | 'announcement';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  data?: {
    conversation_id?: number;
    broadcast_id?: number;
    [key: string]: any;
  };
  related_id?: number | null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 알림 데이터 로드
  const loadNotifications = async () => {
    if (!isAuthenticated) {
      router.replace('/');
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/v1/notifications');
      
      if (response.data && response.data.notifications) {
        setNotifications(response.data.notifications);
      } else {
        // 오류 처리
        console.error('알림 데이터 형식 오류:', response.data);
        Alert.alert(t('common.error'), t('notifications.loadError'));
      }
    } catch (error) {
      console.error('알림 로드 실패:', error);
      Alert.alert(t('common.error'), t('notifications.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 초기 로드 및 새로고침
  useEffect(() => {
    loadNotifications();
  }, [isAuthenticated]);

  // 새로고침 처리
  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  // 알림 읽음 처리
  const markAsRead = async (notification: Notification) => {
    try {
      // 서버에 읽음 처리 요청
      await axiosInstance.patch(`/api/v1/notifications/${notification.id}`, { read: true });
      
      // 로컬 상태 업데이트
      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
      // 에러가 발생해도 로컬에서는 읽음 처리
      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      ));
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
          router.push({
            pathname: '/conversations/[id]',
            params: { id: notification.data.conversation_id }
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
      case 'broadcast_reply':
      case 'new_message':
        if (notification.related_id) {
          router.push(`/conversations/${notification.related_id}`);
        }
        break;
      case 'conversation_closed':
        // 대화방 종료는 특별한 처리 없음
        break;
      case 'announcement':
        if (notification.related_id) {
          router.push(`/announcements/${notification.related_id}`);
        } else {
          router.push('/announcements');
        }
        break;
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      // 서버에 모든 알림 읽음 처리 요청
      await axiosInstance.patch('/api/v1/notifications/mark_all_read');
      
      // 로컬 상태 업데이트
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      
      Alert.alert(t('common.success'), t('notifications.allMarkedAsRead'));
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
      // 에러가 발생해도 로컬에서는 읽음 처리
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      Alert.alert(t('common.notice'), '알림이 읽음 처리되었습니다');
    }
  };

  // 알림 아이템 렌더링
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    // 알림 종류에 따른 아이콘 및 색상 결정
    let iconName = 'notifications-outline';
    let iconColor = '#007AFF';
    
    switch (item.type) {
      case 'broadcast_reply':
        iconName = 'chatbubble-outline';
        iconColor = '#4CAF50';
        break;
      case 'new_message':
        iconName = 'mail-outline';
        iconColor = '#FF9500';
        break;
      case 'conversation_closed':
        iconName = 'close-circle-outline';
        iconColor = '#FF3B30';
        break;
      case 'announcement':
        iconName = 'megaphone-outline';
        iconColor = '#8E44AD';
        break;
      case 'system':
        iconName = 'information-circle-outline';
        iconColor = '#3498DB';
        break;
      default:
        iconName = 'notifications-outline';
        iconColor = '#007AFF';
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.notificationIcon, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={iconName as any} size={24} color={iconColor} />
        </View>
        
        <View style={styles.notificationContent}>
          <ThemedText style={styles.notificationTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.notificationBody}>{item.body}</ThemedText>
          <ThemedText style={styles.notificationTime}>
            {new Date(item.created_at).toLocaleString('ko-KR')}
          </ThemedText>
        </View>
        
        {!item.read && (
          <View style={styles.unreadIndicator} />
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
      
      {loading && !refreshing ? (
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor={'#007AFF'}
            />
          }
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