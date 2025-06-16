// app/(tabs)/index.tsx
import { Image, StyleSheet, View, TouchableOpacity, Text, Alert, RefreshControl, ScrollView, Platform } from 'react-native';
import React from 'react';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { registerForPushNotificationsAsync, sendTestNotification, configurePushNotifications } from '../utils/pushNotifications';
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
          const response = await axiosInstance.get('/api/v1/users/profile');
          if (response.data && response.data.user) {
            updateUser({
              nickname: response.data.user.nickname,
              // 기타 필요한 정보 업데이트
            });
            
            // 캐시 금액 로드 - 지갑 API 호출
            try {
              // 지갑 API 호출
              const walletResponse = await axiosInstance.get('/api/v1/wallet');
              console.log('지갑 API 응답:', walletResponse.data);
              
              if (walletResponse.data && walletResponse.data.balance !== undefined) {
                const walletBalance = parseInt(walletResponse.data.balance);
                console.log('지갑 잔액 설정:', walletBalance);
                setCashAmount(walletBalance);
                updateUser({ cash_amount: walletBalance });
              } else {
                // 기본값 설정
                setCashAmount(0);
                updateUser({ cash_amount: 0 });
              }
            } catch (walletError) {
              console.error('지갑 정보 로드 실패:', walletError);
              // 오류 발생 시 기본값 설정
              setCashAmount(0);
              updateUser({ cash_amount: 0 });
            }
          }
        } catch (error) {
          console.error('프로필 새로고침 실패:', error);
          const defaultBalance = user.cash_amount || 5000;
          console.log('프로필 오류 시 기본 잔액 사용:', defaultBalance);
          setCashAmount(defaultBalance); // 오류 시 기본값
        }
        
        // 읽지 않은 메시지 수 가져오기
        try {
          const notificationsResponse = await axiosInstance.get('/api/v1/notifications');
          if (notificationsResponse.data && notificationsResponse.data.unread_count !== undefined) {
            setUnreadMessages(notificationsResponse.data.unread_count);
          } else {
            setUnreadMessages(3); // 기본값
          }
        } catch (error) {
          console.error('알림 개수 로드 실패:', error);
          setUnreadMessages(3); // 오류 시 기본값
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
    // 푸시 알림 설정
    configurePushNotifications();
    
    // 푸시 알림 권한 요청 및 토큰 획득
    const setupPushNotifications = async () => {
      try {
        await registerForPushNotificationsAsync();
      } catch (error) {
        console.error('푸시 알림 설정 실패:', error);
      }
    };
    
    setupPushNotifications();

    // 알림이 수신되었을 때 실행되는 리스너
    let subscription: Notifications.Subscription | undefined;
    try {
      subscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log('알림 수신:', notification);
      });
    } catch (error) {
      console.error('알림 리스너 설정 실패:', error);
    }

    // 사용자 정보 로드
    loadUserInfo();

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isAuthenticated, loadUserInfo]);

  // 녹음 화면으로 이동
  const goToRecordScreen = () => {
    if (!isAuthenticated) {
      // 로그인하지 않은 경우 로그인 화면으로 이동
      Alert.alert(
        t('common.notice'),
        t('profile.loginRequired'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('profile.login'),
            onPress: () => router.push('/auth' as any),
          },
        ]
      );
      return;
    }
    
    router.push('/broadcast/record' as any);
  };

  // 프로필 화면으로 이동
  const goToProfileScreen = () => {
                router.push('/mypage' as any);
  };

  // 알림 화면으로 이동
  const goToNotificationsScreen = () => {
    router.push('/notifications' as any);
  };
  
  // 로그인 화면으로 이동
  const goToLoginScreen = () => {
    router.push('/auth' as any);
  };

  // 지갑 화면으로 이동
  const goToWalletScreen = () => {
    // 월렛 기능 비활성화 - 사용자 증가 시 오픈 예정
    Alert.alert(
      '준비 중인 기능',
      '월렛 기능은 사용자가 늘어나면 오픈할 예정입니다.\n조금만 기다려주세요! 🙏',
      [{ text: '확인' }]
    );
    // router.push('/wallet' as any); // 비활성화
  };

  return (
    <ScrollView
      style={styles.safeArea}
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#3498db']}
          tintColor={'#3498db'}
        />
      }
    >
      <ThemedView style={styles.container}>
        {/* 상단 헤더 */}
        <ThemedView style={styles.header}>
          {/* 좌측: 캐시 금액 */}
          {isAuthenticated ? (
            <TouchableOpacity 
              style={[styles.cashContainer, styles.disabledCashContainer]}
              onPress={goToWalletScreen}
              activeOpacity={0.7}
            >
              <Ionicons name="wallet-outline" size={24} color="#CCCCCC" />
              <ThemedText style={styles.disabledCashAmount}>준비 중</ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyContainer} />
          )}

          {/* 우측: 프로필 및 알림 버튼 */}
          <ThemedView style={styles.headerButtons}>
            {isAuthenticated && (
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={goToNotificationsScreen}
              >
                <Ionicons name="notifications-outline" size={24} color="#007AFF" />
                {unreadMessages > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadMessages > 9 ? '9+' : unreadMessages}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={goToProfileScreen}
            >
              <Ionicons name="person-circle-outline" size={28} color="#007AFF" />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* 메인 콘텐츠 */}
        <ThemedView style={styles.content}>
          {/* 로그인 상태 표시 */}
          {isAuthenticated && user ? (
            <ThemedView style={styles.userInfoContainer}>
              <ThemedText style={styles.userInfoText}>
                {user.nickname}님으로 로그인 되었습니다
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedView style={styles.loginRequiredContainer}>
              <ThemedText style={styles.loginRequiredText}>
                {t('profile.loginRequired')}
              </ThemedText>
              <StylishButton 
                title={t('profile.login')} 
                onPress={goToLoginScreen}
                type="primary"
                size="medium"
                icon={<Ionicons name="log-in" size={18} color="#FFFFFF" />}
              />
            </ThemedView>
          )}

          {/* 중앙 녹음 버튼 */}
          <ThemedView style={styles.recordButtonContainer}>
            <TouchableOpacity 
              style={[styles.recordButton, !isAuthenticated && styles.recordButtonDisabled]}
              onPress={goToRecordScreen}
            >
              <Ionicons name="mic" size={64} color="#FFFFFF" />
            </TouchableOpacity>
            <ThemedText style={styles.recordButtonText}>
              {t('broadcast.recordingInstructions')}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 60, // 상단 패딩 값을 증가시킴
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  cashContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  disabledCashContainer: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  cashIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  emptyContainer: {
    width: 100,
  },
  cashAmount: {
    marginLeft: 6,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    position: 'relative',
    marginLeft: 15,
    padding: 5
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 30, // 하단 여백 추가
  },
  userInfoContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  userInfoText: {
    fontSize: 16,
  },
  loginRequiredContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    alignItems: 'center',
  },
  loginRequiredText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  recordButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
      default: {
        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.3)',
      }
    }),
    marginBottom: 16,
  },
  recordButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  recordButtonText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
    color: '#666666',
  },
  disabledCashAmount: {
    marginLeft: 6,
    fontWeight: 'bold',
    color: '#999999',
  },
});