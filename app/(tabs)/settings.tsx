import React, { useState, useEffect } from 'react';
import { StyleSheet, Switch, Alert, ScrollView, TouchableOpacity, Platform, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { registerForPushNotificationsAsync, sendTestNotification } from '../utils/pushNotifications';
import axiosInstance from '@lib/axios';

// 알림 설정 인터페이스 정의
interface NotificationSettings {
  notificationsEnabled: boolean;
  receive_new_letter: boolean;
  letter_receive_alarm: boolean;
}

export default function SettingsTab() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // 알림 설정 상태
  const [settings, setSettings] = useState<NotificationSettings>({
    notificationsEnabled: true,
    receive_new_letter: true,
    letter_receive_alarm: true,
  });

  // 설정 불러오기
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserSettings();
    } else {
      loadLocalSettings();
    }
  }, [isAuthenticated]);

  // 서버에서 사용자 설정 불러오기
  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      // 서버 API 호출
      const response = await axiosInstance.get('/api/v1/users/notification_settings');
      console.log('서버에서 불러온 설정:', response.data);
      
      // 서버에서 받은 설정으로 상태 업데이트
      setSettings(prev => ({
        ...prev,
        receive_new_letter: response.data.receive_new_letter,
        letter_receive_alarm: response.data.letter_receive_alarm,
      }));
      
      // 로컬 저장소에도 저장
      await AsyncStorage.setItem('app_settings', JSON.stringify({
        notificationsEnabled: true,
        receive_new_letter: response.data.receive_new_letter,
        letter_receive_alarm: response.data.letter_receive_alarm,
      }));
    } catch (error) {
      console.error('설정 로드 실패:', error);
      // 오류 발생 시 로컬 설정 불러오기
      loadLocalSettings();
    } finally {
      setLoading(false);
    }
  };

  // 로컬 저장소에서 설정 불러오기
  const loadLocalSettings = async () => {
    try {
      setLoading(true);
      const storedSettings = await AsyncStorage.getItem('app_settings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsedSettings,
        }));
      }
    } catch (error) {
      console.error('로컬 설정 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 설정 저장 함수
  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      setSavingSettings(true);
      
      // 로컬 저장소에 저장
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      
      // 로그인 상태인 경우 서버에도 저장
      if (isAuthenticated) {
        try {
          // 서버 API 호출 - POST 대신 PATCH 사용
          const response = await axiosInstance.patch('/api/v1/users/notification_settings', {
            receive_new_letter: newSettings.receive_new_letter,
            letter_receive_alarm: newSettings.letter_receive_alarm,
          });
          console.log('서버 설정 저장 결과:', response.data);
          
          // 성공 메시지 표시
          Alert.alert('알림', '설정이 저장되었습니다.');
        } catch (error) {
          console.error('서버 설정 저장 실패:', error);
          Alert.alert('오류', '서버에 설정을 저장하는 중 문제가 발생했습니다.');
        }
      }
      
      // 알림 활성화 상태가 변경된 경우
      if (newSettings.notificationsEnabled !== settings.notificationsEnabled) {
        if (newSettings.notificationsEnabled) {
          // 알림 활성화
          const token = await registerForPushNotificationsAsync();
          if (token) {
            console.log('Push token:', token);
            try {
              // 서버에 토큰 전송 - 알림 설정 업데이트로 대체
              const response = await axiosInstance.patch('/api/v1/users/notification_settings', { 
                push_enabled: true,
                push_token: token 
              });
              console.log('알림 활성화 결과:', response.data);
            } catch (error) {
              console.log('토큰 저장 실패:', error);
              Alert.alert('오류', '알림 설정을 저장하는 중 문제가 발생했습니다.');
            }
          } else {
            // 토큰 발급 실패 또는 권한 거부
            Alert.alert('오류', '알림 권한을 획득할 수 없습니다.');
            // 설정 롤백
            newSettings.notificationsEnabled = false;
            await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
            setSettings(newSettings);
            setSavingSettings(false);
            return;
          }
        } else {
          // 알림 비활성화
          try {
            await axiosInstance.patch('/api/v1/users/notification_settings', { 
              push_enabled: false 
            });
          } catch (error) {
            console.log('알림 비활성화 실패:', error);
            // 오류가 발생해도 로컬 설정은 유지
          }
        }
      }
      
      setSettings(newSettings);
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      Alert.alert('오류', '설정을 저장하는 중 문제가 발생했습니다.');
    } finally {
      setSavingSettings(false);
    }
  };

  // 설정 변경 처리
  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    
    // 알림이 비활성화된 경우 다른 설정들도 비활성화
    if (key === 'notificationsEnabled' && value === false) {
      // 설정은 유지하되 UI에서는 비활성화
    }
    
    saveSettings(newSettings);
  };

  // 로그아웃 처리
  const handleLogout = () => {
    Alert.alert(
      t('auth.logoutConfirmTitle') || '로그아웃',
      t('auth.logoutConfirmMessage') || '정말 로그아웃 하시겠습니까?',
      [
        {
          text: t('common.cancel') || '취소',
          style: 'cancel'
        },
        {
          text: t('auth.logout') || '로그아웃',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('로그아웃 시작 - 설정 화면에서 요청');
              
              // 로그아웃 전 현재 상태 확인
              const token = await AsyncStorage.getItem('token');
              console.log('로그아웃 전 토큰 존재 여부:', !!token);
              
              // 로그아웃 실행
              await logout();
              console.log('로그아웃 함수 실행 완료');
              
              // 로그아웃 후 상태 확인
              const tokenAfter = await AsyncStorage.getItem('token');
              console.log('로그아웃 후 토큰 존재 여부:', !!tokenAfter);
              
              // 사용자에게 피드백 제공
              Alert.alert(
                '로그아웃 완료',
                '성공적으로 로그아웃되었습니다.',
                [
                  {
                    text: '확인',
                    onPress: () => {
                      console.log('홈으로 이동');
                      router.replace('/');
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('로그아웃 실패:', error);
              
              // 오류 발생 시 수동으로 로그아웃 시도
              try {
                console.log('수동 로그아웃 시도');
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                
                // 웹 환경에서 추가 처리
                if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
                  window.localStorage.removeItem('token');
                  window.localStorage.removeItem('user');
                }
                
                Alert.alert(
                  '로그아웃',
                  '로그아웃 처리가 완료되었습니다.',
                  [
                    {
                      text: '확인',
                      onPress: () => {
                        console.log('홈으로 이동 (수동 로그아웃 후)');
                        window.location.reload(); // 웹에서는 페이지 새로고침
                        router.replace('/');
                      }
                    }
                  ]
                );
              } catch (manualError) {
                console.error('수동 로그아웃 실패:', manualError);
                Alert.alert(t('common.error') || '오류', '로그아웃 처리에 실패했습니다. 앱을 다시 시작해주세요.');
              }
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  // 프로필 화면으로 이동
  const goToProfile = () => {
    router.push('/mypage' as any);
  };

  // 테스트 알림 전송
  const handleTestNotification = async () => {
    if (!settings.notificationsEnabled) {
      Alert.alert('알림', '먼저 알림을 활성화해주세요.');
      return;
    }

    try {
      await sendTestNotification();
      Alert.alert('성공', '테스트 알림이 전송되었습니다.');
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
      Alert.alert('오류', '테스트 알림 전송에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>설정</ThemedText>
          
          {/* 프로필 섹션 */}
          {isAuthenticated && (
            <TouchableOpacity style={styles.profileSection} onPress={goToProfile}>
              <View style={styles.profileInfo}>
                <View style={styles.profileImageContainer}>
                  {user?.profile_image ? (
                    <Image source={{ uri: user.profile_image }} style={styles.profileImage} />
                  ) : (
                    <Ionicons name="person-circle" size={60} color="#CCCCCC" />
                  )}
                </View>
                <View style={styles.profileTextContainer}>
                  <ThemedText style={styles.profileName}>{user?.nickname || '사용자'}</ThemedText>
                  <ThemedText style={styles.profileSubtext}>{t('settings.viewProfile') || '프로필 보기'}</ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
            </TouchableOpacity>
          )}
          
          {/* 알림 설정 섹션 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name="notifications" size={22} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>알림 설정</ThemedText>
            </ThemedView>
            
            {/* 알림 활성화 설정 */}
            <ThemedView style={styles.settingRow}>
              <ThemedView style={styles.settingTextContainer}>
                <ThemedText style={styles.settingText}>알림 활성화</ThemedText>
                <ThemedText style={styles.settingDescription}>앱 알림을 활성화합니다</ThemedText>
              </ThemedView>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => handleSettingChange('notificationsEnabled', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.notificationsEnabled ? '#FFFFFF' : '#F4F3F4'}
                disabled={savingSettings}
              />
            </ThemedView>
            
            {/* 새로운 편지 수신 설정 */}
            <ThemedView style={styles.settingRow}>
              <ThemedView style={styles.settingTextContainer}>
                <ThemedText style={styles.settingText}>새로운 편지 수신</ThemedText>
                <ThemedText style={styles.settingDescription}>새로운 편지 수신을 허용합니다</ThemedText>
              </ThemedView>
              <Switch
                value={settings.receive_new_letter}
                onValueChange={(value) => handleSettingChange('receive_new_letter', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.receive_new_letter ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled || savingSettings}
              />
            </ThemedView>
            
            {/* 편지 수신 알람 설정 */}
            <ThemedView style={styles.settingRow}>
              <ThemedView style={styles.settingTextContainer}>
                <ThemedText style={styles.settingText}>편지 수신 알람</ThemedText>
                <ThemedText style={styles.settingDescription}>새 편지가 도착하면 알림을 표시합니다</ThemedText>
              </ThemedView>
              <Switch
                value={settings.letter_receive_alarm}
                onValueChange={(value) => handleSettingChange('letter_receive_alarm', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.letter_receive_alarm ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled || !settings.receive_new_letter || savingSettings}
              />
            </ThemedView>
            
            {/* 저장 버튼 */}
            <StylishButton
              title="설정 저장"
              onPress={() => saveSettings(settings)}
              type="primary"
              style={styles.saveButton}
              loading={savingSettings}
            />
            
            {/* 테스트 알림 버튼 */}
            <TouchableOpacity 
              style={[
                styles.testButton, 
                (!settings.notificationsEnabled || savingSettings) && styles.disabledButton
              ]}
              onPress={handleTestNotification}
              disabled={!settings.notificationsEnabled || savingSettings}
            >
              <ThemedText style={styles.testButtonText}>테스트 알림 보내기</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          {/* 로그아웃 버튼 */}
          {isAuthenticated && (
            <ThemedView style={styles.logoutContainer}>
              <StylishButton
                title={t('auth.logout') || '로그아웃'}
                onPress={handleLogout}
                type="danger"
                loading={loading}
              />
            </ThemedView>
          )}
          
          {/* 로그인 버튼 (비로그인 상태) */}
          {!isAuthenticated && (
            <ThemedView style={styles.logoutContainer}>
              <StylishButton
                title={t('auth.login') || '로그인'}
                onPress={() => router.push('/auth/login')}
                type="primary"
              />
            </ThemedView>
          )}
          
          {/* 앱 정보 */}
          <ThemedView style={styles.appInfoContainer}>
            <ThemedText style={styles.appVersion}>버전 1.0.0</ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileTextContainer: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  settingText: {
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666666',
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  logoutContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  appInfoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  appVersion: {
    fontSize: 14,
    color: '#999999',
  },
});
