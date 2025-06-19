// app/(tabs)/index.tsx
import { Image, StyleSheet, View, TouchableOpacity, Text, Alert, RefreshControl, ScrollView, Platform, Animated } from 'react-native';
import React from 'react';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useEffect, useState, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { registerForPushNotificationsAsync, configurePushNotifications } from '../utils/pushNotifications';
import StylishButton from '../../components/StylishButton';
import axiosInstance from '@lib/axios';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated, updateUser } = useAuth();
  const [cashAmount, setCashAmount] = useState<number | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 사용자 정보 로드 (캐시 금액 등)
  const loadUserInfo = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCashAmount(null);
      setUnreadMessages(0);
      setRefreshing(false);
      return;
    }

    try {
      // 지갑 정보 로드
      const fetchWalletInfo = async (): Promise<{ balance: number } | null> => {
        try {
          const response = await axiosInstance.get<{ balance: number }>('/api/v1/wallet');
          return response.data;
        } catch (error: any) {
          console.error('Wallet info fetch error:', error);
          return null;
        }
      };

      const fetchNotifications = async (): Promise<{ unread_count: number }> => {
        try {
          const response = await axiosInstance.get<{ unread_count: number }>('/api/v1/notifications');
          return response.data;
        } catch (error: any) {
          console.error('Notifications fetch error:', error);
          return { unread_count: 0 };
        }
      };

      const walletInfo = await fetchWalletInfo();
      const notifications = await fetchNotifications();

      const balance = walletInfo?.balance ?? 0;
      setCashAmount(balance);
      updateUser({ cash_amount: balance });

      const unreadCount = notifications.unread_count ?? 0;
      setUnreadMessages(unreadCount);

    } catch (error: any) {
      console.error('사용자 정보 로드 실패:', error);
      // 에러 발생 시 기존 컨텍스트 값 또는 기본값으로 설정
      setCashAmount(user.cash_amount || 0);
      setUnreadMessages(0);
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated, user?.id, updateUser]);

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
      } catch (error: any) {
        console.error('푸시 알림 설정 실패:', error);
      }
    };
    
    setupPushNotifications();

    // 알림이 수신되었을 때 실행되는 리스너
    let subscription: Notifications.Subscription | undefined;
    try {
      subscription = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
        console.log('알림 수신:', notification);
        // 새 알림이 왔을 때 알림 개수 업데이트
        loadUserInfo();
      });
    } catch (error: any) {
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

  // 화면이 포커스될 때마다 알림 개수 업데이트
  useFocusEffect(
    useCallback(() => {
      loadUserInfo();
    }, [loadUserInfo])
  );

  // 녹음 버튼 pulse 애니메이션
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse 애니메이션 시작
  useEffect(() => {
    const startPulseAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    if (isAuthenticated) {
      startPulseAnimation();
    }
  }, [isAuthenticated, pulseAnim]);

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

  /**
   * 지갑 화면으로 이동하는 함수.
   * 현재는 기능이 준비 중이므로 알림을 표시합니다.
   * 사용자가 헤더의 캐시 영역을 탭했을 때 호출됩니다.
   * 
   * @version 2.0.1
   * @description 2025-06-17: 사용자 요청에 따라 기능 출시 전까지 '준비 중' 알림을 표시하도록 다시 수정했습니다.
   */
  const goToWalletScreen = () => {
    Alert.alert(
      '준비 중인 기능',
      '지갑 기능은 현재 준비 중입니다. 조금만 기다려주세요!'
    );
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
          <TouchableOpacity 
            style={isAuthenticated ? styles.cashContainer : [styles.cashContainer, styles.disabledCashContainer]} 
            onPress={isAuthenticated ? goToWalletScreen : goToLoginScreen}
            disabled={!isAuthenticated}
          >
            <Image source={require('../../assets/images/cash_icon.png')} style={styles.cashIcon} />
            <ThemedText style={isAuthenticated ? styles.cashAmount : styles.disabledCashAmount}>
              {isAuthenticated ? (cashAmount ? cashAmount.toLocaleString() : '0') : t('home.loginRequired')}
            </ThemedText>
          </TouchableOpacity>

          {/* 우측: 알림, 설정 버튼 */}
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

          {/* 중앙 콘텐츠 영역 - 음성 메시지 녹음 버튼 */}
          <ThemedView style={styles.recordButtonContainer}>
            {isAuthenticated ? (
              <ThemedView style={styles.recordButtonWrapper}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity 
                    style={styles.recordButton}
                    onPress={() => router.push('/broadcast/record')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="mic" size={48} color="#FFFFFF" />
                  </TouchableOpacity>
                </Animated.View>
                <ThemedText style={styles.recordButtonText}>
                  {t('home.recordButton', '음성 메시지 보내기')}
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView style={styles.recordButtonWrapper}>
                <TouchableOpacity
                  style={[styles.recordButton, styles.recordButtonDisabled]}
                  onPress={goToLoginScreen}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mic" size={48} color="#FFFFFF" />
                </TouchableOpacity>
                <ThemedText style={styles.recordButtonText}>
                  {t('home.loginToRecord', '로그인 후 음성 메시지 보내기')}
                </ThemedText>
              </ThemedView>
            )}
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
  recordButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
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