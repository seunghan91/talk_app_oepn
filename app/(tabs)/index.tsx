// app/(tabs)/index.tsx
import { Image, StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import React from 'react';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { registerForPushNotificationsAsync, sendTestNotification, configurePushNotifications } from '../utils/_pushNotificationHelper.util';
import Constants from 'expo-constants';
import { SafeAreaView, Platform } from 'react-native';
import StylishButton from '../../components/StylishButton';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);

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

    // 사용자 정보 로드 (캐시 금액 등)
    const loadUserInfo = async () => {
      try {
        if (isAuthenticated && user) {
          // 실제 API에서 사용자 정보 로드
          // 테스트용 임시 데이터
          setCashAmount(5000);
          setUnreadMessages(3);
          console.log('사용자 정보 로드됨:', user.nickname);
        } else {
          // 로그인하지 않은 경우 초기화
          setCashAmount(0);
          setUnreadMessages(0);
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      }
    };

    loadUserInfo();

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isAuthenticated, user]);

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
    router.push('/profile' as any);
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
    router.push('/wallet' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* 상단 헤더 */}
        <ThemedView style={styles.header}>
          {/* 좌측: 캐시 금액 */}
          {isAuthenticated ? (
            <TouchableOpacity 
              style={styles.cashContainer} 
              onPress={goToWalletScreen}
            >
              <Ionicons name="wallet-outline" size={24} color="#007AFF" />
              <ThemedText style={styles.cashAmount}>{cashAmount.toLocaleString()}원</ThemedText>
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
                    <Text style={styles.badgeText}>{unreadMessages}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 50,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
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
});