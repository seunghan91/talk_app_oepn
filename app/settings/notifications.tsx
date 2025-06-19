import React, { useState, useEffect } from 'react';
import { StyleSheet, Switch, Alert, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { registerForPushNotificationsAsync, sendTestNotification } from '../utils/pushNotifications';
import axiosInstance from '@lib/axios';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { SafeAreaView } from 'react-native';

interface NotificationSettings {
  notificationsEnabled: boolean;
  newMessageReceiveEnabled: boolean;
  messageAlarmEnabled: boolean;
  broadcastNotifications: boolean;
  commentNotifications: boolean;
  likeNotifications: boolean;
  mentionNotifications: boolean;
  systemNotifications: boolean;
  marketingNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export default function NotificationsSettings() {
  const router = useRouter();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<NotificationSettings>({
    notificationsEnabled: false,
    newMessageReceiveEnabled: true,
    messageAlarmEnabled: true,
    broadcastNotifications: true,
    commentNotifications: true,
    likeNotifications: true,
    mentionNotifications: true,
    systemNotifications: true,
    marketingNotifications: false,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });
  const [loading, setLoading] = useState<boolean>(true);

  // 알림 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('app_settings');
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          setSettings(prev => ({
            ...prev,
            ...parsedSettings,
          }));
        }
      } catch (error) {
        console.error('설정 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 알림 설정 저장
  const saveSettings = async (newSettings: NotificationSettings, key?: keyof NotificationSettings) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      
      // 알림 활성화 상태가 변경된 경우
      if (newSettings.notificationsEnabled !== settings.notificationsEnabled) {
        if (newSettings.notificationsEnabled) {
          // 알림 활성화
          const token = await registerForPushNotificationsAsync();
          if (token) {
            console.log('Push token:', token);
            try {
              // 서버에 토큰 전송
              const response = await axiosInstance.patch('/api/v1/users/notification_settings', { 
                push_token: token,
                notifications_enabled: true 
              });
              console.log('알림 설정 업데이트 결과:', response.data);
              Alert.alert(t('common.success'), '알림 설정이 저장되었습니다 (삭제예정)');
            } catch (error) {
              console.log('토큰 저장 실패:', error);
              // Alert.alert(t('common.error'), t('settings.saveError')); // 에러 알림 제거
            }
          } else {
            // 토큰 발급 실패 또는 권한 거부
            Alert.alert(t('common.error'), t('settings.saveError'));
            // 설정 롤백
            newSettings.notificationsEnabled = false;
            await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
            setSettings(newSettings);
            return;
          }
        } else {
          // 알림 비활성화
          try {
            await axiosInstance.patch('/api/v1/users/notification_settings', { 
              notifications_enabled: false 
            });
            Alert.alert(t('common.success'), '알림 설정이 저장되었습니다 (삭제예정)');
          } catch (error) {
            console.log('알림 비활성화 실패:', error);
            // 오류가 발생해도 로컬 설정은 유지
          }
        }
      }
      
      setSettings(newSettings);
      
      // 다른 설정들도 저장 알림 표시 (삭제예정)
      if (key !== 'notificationsEnabled') {
        Alert.alert(t('common.success'), '설정이 저장되었습니다 (삭제예정)');
      }
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      // Alert.alert(t('common.error'), t('settings.saveError')); // 에러 알림 제거
    }
  };

  // 설정 변경 처리
  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    
    // 알림이 비활성화된 경우 다른 설정들도 비활성화
    if (key === 'notificationsEnabled' && value === false) {
      // 설정은 유지하되 UI에서는 비활성화
    }
    
    saveSettings(newSettings, key);
  };

  // 테스트 알림 전송
  const handleTestNotification = async () => {
    if (!settings.notificationsEnabled) {
      Alert.alert(t('common.notice'), t('settings.enableNotificationsFirst'));
      return;
    }

    try {
      await sendTestNotification();
      Alert.alert(t('common.success'), t('settings.testNotificationSent'));
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
      Alert.alert(t('common.error'), t('settings.testNotificationError'));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.loadingContainer}>
          <Ionicons name="notifications" size={48} color="#CCCCCC" />
          <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title">{t('settings.notifications')}</ThemedText>

          {/* 알림 기본 설정 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name="notifications" size={22} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('notifications.generalSettings')}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('settings.notificationsEnabled')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('settings.notificationsEnabledDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => handleSettingChange('notificationsEnabled', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.notificationsEnabled ? '#FFFFFF' : '#F4F3F4'}
                disabled={loading}
              />
            </ThemedView>
            
            {/* 새로운 편지 수신 설정 */}
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>새로운 편지 수신</ThemedText>
                <ThemedText style={styles.settingDescription}>새로운 편지 수신을 허용합니다. 비활성화하면 새 편지를 받지 않습니다.</ThemedText>
              </ThemedView>
              <Switch
                value={settings.newMessageReceiveEnabled}
                onValueChange={(value) => handleSettingChange('newMessageReceiveEnabled', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.newMessageReceiveEnabled ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled || loading}
              />
            </ThemedView>
            
            {/* 편지 수신 알람 설정 */}
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>편지 수신 알람</ThemedText>
                <ThemedText style={styles.settingDescription}>새 편지가 도착하면 알림을 표시합니다.</ThemedText>
              </ThemedView>
              <Switch
                value={settings.messageAlarmEnabled}
                onValueChange={(value) => handleSettingChange('messageAlarmEnabled', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.messageAlarmEnabled ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled || !settings.newMessageReceiveEnabled || loading}
              />
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('notifications.sound')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('notifications.soundDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => handleSettingChange('soundEnabled', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.soundEnabled ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled || loading}
              />
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('notifications.vibration')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('notifications.vibrationDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.vibrationEnabled}
                onValueChange={(value) => handleSettingChange('vibrationEnabled', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.vibrationEnabled ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled || loading}
              />
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('notifications.quietHours')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('notifications.quietHoursDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.quietHoursEnabled}
                onValueChange={(value) => handleSettingChange('quietHoursEnabled', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.quietHoursEnabled ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled || loading}
              />
            </ThemedView>
            
            {settings.quietHoursEnabled && (
              <ThemedView style={styles.quietHoursContainer}>
                <ThemedText style={styles.quietHoursText}>
                  {t('notifications.quietHoursTime', { start: settings.quietHoursStart, end: settings.quietHoursEnd })}
                </ThemedText>
                <TouchableOpacity 
                  style={styles.quietHoursButton}
                  onPress={() => {/* 시간 설정 기능 추가 */}}
                  disabled={!settings.notificationsEnabled}
                >
                  <ThemedText style={styles.quietHoursButtonText}>{t('notifications.changeTime')}</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
            
            <StylishButton
              title={t('settings.testNotification')}
              onPress={handleTestNotification}
              type="secondary"
              size="medium"
              icon={<Ionicons name="paper-plane" size={18} color="#FFFFFF" />}
              style={styles.button}
              disabled={!settings.notificationsEnabled || loading}
            />
          </ThemedView>

          {/* 알림 유형 설정 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name="list" size={22} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('notifications.notificationTypes')}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('notifications.broadcastNotifications')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('notifications.broadcastNotificationsDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.broadcastNotifications}
                onValueChange={(value) => handleSettingChange('broadcastNotifications', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.broadcastNotifications ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled || loading}
              />
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('notifications.commentNotifications')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('notifications.commentNotificationsDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.commentNotifications}
                onValueChange={(value) => handleSettingChange('commentNotifications', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.commentNotifications ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled || loading}
              />
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('notifications.likeNotifications')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('notifications.likeNotificationsDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.likeNotifications}
                onValueChange={(value) => handleSettingChange('likeNotifications', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.likeNotifications ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled || loading}
              />
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('notifications.mentionNotifications')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('notifications.mentionNotificationsDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.mentionNotifications}
                onValueChange={(value) => handleSettingChange('mentionNotifications', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.mentionNotifications ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled || loading}
              />
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('notifications.systemNotifications')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('notifications.systemNotificationsDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.systemNotifications}
                onValueChange={(value) => handleSettingChange('systemNotifications', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.systemNotifications ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled || loading}
              />
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('notifications.marketingNotifications')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('notifications.marketingNotificationsDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.marketingNotifications}
                onValueChange={(value) => handleSettingChange('marketingNotifications', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.marketingNotifications ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled || loading}
              />
            </ThemedView>
          </ThemedView>
          
          <StylishButton
            title={t('common.back')}
            onPress={() => router.back()}
            type="outline"
            size="medium"
            icon={<Ionicons name="arrow-back" size={18} color="#000000" />}
            style={styles.backButton}
          />
        </ThemedView>
      </ScrollView>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    maxWidth: '80%',
  },
  button: {
    marginTop: 16,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  quietHoursContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  quietHoursText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  quietHoursButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  quietHoursButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
}); 