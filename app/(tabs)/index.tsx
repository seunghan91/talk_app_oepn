// app/(tabs)/index.tsx
import { Image, StyleSheet, View, TouchableOpacity, Text, Alert, Linking, Platform, RefreshControl, ScrollView } from 'react-native';
import React from 'react';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { registerForPushNotificationsAsync, sendTestNotification, configurePushNotifications } from '../utils/_pushNotificationHelper.util';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native';
import StylishButton from '../../components/StylishButton';
import axiosInstance from '../lib/axios';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, user, logout, updateUser } = useAuth();
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 사용자 정보 로드 (캐시 금액 등)
  const loadUserInfo = useCallback(async () => {
    try {
      if (isAuthenticated && user) {
        // 서버에서 프로필 정보 새로고침
        try {
          const response = await axiosInstance.get('/api/users/profile');
          if (response.data && response.data.user) {
            updateUser({
              nickname: response.data.user.nickname,
              // 기타 필요한 정보 업데이트
            });
            
            // 캐시 금액 설정 (서버에서 실제 데이터 사용)
            if (response.data.user.cash_amount !== undefined) {
              setCashAmount(response.data.user.cash_amount);
            }
          }
        } catch (error) {
          console.error('프로필 새로고침 실패:', error);
        }
        
        // 읽지 않은 메시지 수 가져오기
        try {
          const notificationsResponse = await axiosInstance.get('/api/notifications/unread_count');
          if (notificationsResponse.data && notificationsResponse.data.count !== undefined) {
            setUnreadMessages(notificationsResponse.data.count);
          }
        } catch (error) {
          console.error('알림 개수 로드 실패:', error);
        }
      } else {
        // 로그인하지 않은 경우 초기화
        setCashAmount(0);
        setUnreadMessages(0);
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated, user, updateUser]);

  // 새로고침 처리
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserInfo();
  }, [loadUserInfo]);

  useEffect(() => {
    // 세션 확인 및 푸시 알림 설정
    const setupNotifications = async () => {
      // 사용자가 로그인한 상태에서만 푸시 알림 설정
      if (isAuthenticated && user) {
        try {
          // 푸시 알림 권한 요청
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          
          // 권한이 부여되지 않은 경우 사용자에게 설정 변경 요청
          if (finalStatus !== 'granted') {
            Alert.alert(
              t('notifications.permissionTitle'),
              t('notifications.permissionMessage'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                  text: t('common.settings'), 
                  onPress: () => Linking.openSettings() 
                }
              ]
            );
            return;
          }
          
          // Expo 푸시 토큰 가져오기
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
          });
          
          // 서버에 토큰 업데이트
          await axiosInstance.post('/api/users/update_push_token', {
            token: token.data,
            device_id: Constants.deviceId || Constants.installationId,
            platform: Platform.OS
          });
          
          console.log('푸시 알림 설정 완료');
        } catch (error) {
          console.error('푸시 알림 설정 오류:', error);
        }
      }
    };

    setupNotifications();
    
    // 사용자 정보 로드
    loadUserInfo();

    // 알림이 수신되었을 때 실행되는 리스너
    let subscription: Notifications.Subscription | undefined;
    try {
      subscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log('알림 수신:', notification);
      });
    } catch (error) {
      console.error('알림 리스너 설정 실패:', error);
    }

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isAuthenticated, loadUserInfo]);

  // 방송 화면으로 이동
  const handleBroadcastPress = () => {
    if (isAuthenticated) {
      router.push('/broadcast');
    } else {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/auth/login') }
        ]
      );
    }
  };

  // 탑업 화면으로 이동
  const handleTopupPress = () => {
    if (isAuthenticated) {
      router.push('/cash/topup' as any);
    } else {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/auth/login' as any) }
        ]
      );
    }
  };

  // 녹음 화면으로 이동
  const handleRecordPress = () => {
    if (isAuthenticated) {
      router.push('/record' as any);
    } else {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/auth/login' as any) }
        ]
      );
    }
  };

  // 알림 화면으로 이동
  const handleNotificationsPress = () => {
    if (isAuthenticated) {
      router.push('/notifications');
    } else {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/auth/login') }
        ]
      );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#3498db']}
          tintColor={'#3498db'}
        />
      }
    >
      <ThemedView style={styles.header}>
        <View style={styles.userInfo}>
          {/* 좌측: 캐시 금액 */}
          {isAuthenticated ? (
            <TouchableOpacity style={styles.cashContainer} onPress={handleTopupPress}>
              <Image source={require('../../assets/images/cash_icon.png')} style={styles.cashIcon} />
              <ThemedText style={styles.cashAmount}>{cashAmount.toLocaleString()} {t('common.cash')}</ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyContainer} />
          )}

          {/* 우측: 알림 아이콘 */}
          <TouchableOpacity onPress={handleNotificationsPress} style={styles.notificationContainer}>
            <Ionicons name="notifications-outline" size={24} color="#333333" />
            {unreadMessages > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadMessages > 9 ? '9+' : unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* 퀵 액션 버튼 */}
      <ThemedView style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleBroadcastPress}>
          <Ionicons name="mic" size={28} color="#3498db" style={styles.actionIcon} />
          <ThemedText style={styles.actionText}>{t('home.broadcast')}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleRecordPress}>
          <Ionicons name="recording" size={28} color="#e74c3c" style={styles.actionIcon} />
          <ThemedText style={styles.actionText}>{t('home.record')}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleTopupPress}>
          <Ionicons name="card" size={28} color="#2ecc71" style={styles.actionIcon} />
          <ThemedText style={styles.actionText}>{t('home.topup')}</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* 인기 방송 목록 */}
      <ThemedView style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>{t('home.popularBroadcasts')}</ThemedText>
      </ThemedView>

      {/* 샘플 방송 (실제로는 API에서 가져온 데이터로 대체) */}
      <TouchableOpacity style={styles.broadcastItem} onPress={() => router.push('/broadcast/detail/1')}>
        <Image 
          source={{uri: 'https://randomuser.me/api/portraits/women/33.jpg'}}
          style={styles.broadcastImage}
        />
        <View style={styles.broadcastDetails}>
          <ThemedText style={styles.broadcastTitle}>보이는 라디오 방송</ThemedText>
          <ThemedText style={styles.broadcastSubtitle}>현재 청취자: 238명</ThemedText>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.broadcastItem} onPress={() => router.push('/broadcast/detail/2')}>
        <Image 
          source={{uri: 'https://randomuser.me/api/portraits/men/46.jpg'}}
          style={styles.broadcastImage}
        />
        <View style={styles.broadcastDetails}>
          <ThemedText style={styles.broadcastTitle}>심야 토크쇼</ThemedText>
          <ThemedText style={styles.broadcastSubtitle}>현재 청취자: 124명</ThemedText>
        </View>
      </TouchableOpacity>

      {/* 더 많은 방송 보기 버튼 */}
      <View style={styles.buttonContainer}>
        <StylishButton 
          title={t('home.viewMoreBroadcasts')}
          onPress={() => router.push('/broadcast/list' as any)}
          type="outline"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  cashContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cashIcon: {
    width: 24,
    height: 24,
    marginRight: 4,
  },
  cashAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  broadcastItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  broadcastImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  broadcastDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  broadcastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  broadcastSubtitle: {
    fontSize: 14,
    color: '#777777',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#777777',
  },
  buttonContainer: {
    padding: 16,
  },
  emptyContainer: {
    width: 100,
  },
});