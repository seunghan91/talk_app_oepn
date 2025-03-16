import React, { useState, useEffect } from 'react';
import { StyleSheet, Switch, Alert, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { SafeAreaView } from 'react-native';
import LanguageSelector from '../../components/LanguageSelector';

interface SettingsState {
  notificationsEnabled: boolean;
  newMessageReceiveEnabled: boolean;
  messageAlarmEnabled: boolean;
  darkMode: 'system' | 'light' | 'dark';
  autoPlayAudio: boolean;
  dataUsage: 'low' | 'medium' | 'high';
  receiveNewLetters: boolean;
  receiveLetterAlerts: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<SettingsState>({
    notificationsEnabled: true,
    newMessageReceiveEnabled: true,
    messageAlarmEnabled: true,
    darkMode: 'system',
    autoPlayAudio: true,
    dataUsage: 'medium',
    receiveNewLetters: true,
    receiveLetterAlerts: true,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // 앱 설정 로드
        const storedSettings = await AsyncStorage.getItem('app_settings');
        let newSettings = { ...settings };
        
        if (storedSettings) {
          newSettings = { ...newSettings, ...JSON.parse(storedSettings) };
        }
        
        // 사용자 설정 로드 (이전 프로필 화면에서 사용하던 설정)
        const userSettingsJson = await AsyncStorage.getItem('userSettings');
        if (userSettingsJson) {
          const userSettings = JSON.parse(userSettingsJson);
          if (userSettings.receiveNewLetters !== undefined) {
            newSettings.receiveNewLetters = userSettings.receiveNewLetters;
          }
          if (userSettings.receiveLetterAlerts !== undefined) {
            newSettings.receiveLetterAlerts = userSettings.receiveLetterAlerts;
          }
        }
        
        setSettings(newSettings);
      } catch (error) {
        console.error('설정 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 추가: 설정 화면이 표시될 때마다 항상 최신 설정을 불러옴
  useEffect(() => {
    // 페이지가 표시될 때마다 설정을 다시 로드
    const loadSettingsOnFocus = async () => {
      try {
        console.log('설정 화면 포커스');
        const storedSettings = await AsyncStorage.getItem('app_settings');
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error('설정 포커스 시 로드 실패:', error);
      }
    };

    // 초기 로드
    loadSettingsOnFocus();

    // 주기적으로 설정 리로드 (5초마다)
    const intervalId = setInterval(loadSettingsOnFocus, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // 설정 저장
  const saveSettings = async (newSettings: SettingsState) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      // 성공 메시지는 모든 변경에 표시하지 않고 중요한 변경에만 표시
    } catch (error) {
      console.error('설정 저장 실패:', error);
      Alert.alert(t('common.error'), t('settings.saveError'));
    }
  };

  // 설정 변경 처리
  const handleSettingChange = (key: keyof SettingsState, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // 모든 설정 저장
  const saveAllSettings = async () => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(settings));
      
      // 사용자 설정도 함께 저장 (이전 프로필 화면에서 사용하던 설정)
      const userSettings = {
        receiveNewLetters: settings.receiveNewLetters,
        receiveLetterAlerts: settings.receiveLetterAlerts
      };
      await AsyncStorage.setItem('userSettings', JSON.stringify(userSettings));
      
      Alert.alert(
        t('common.success'),
        t('settings.settingsSaved'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              // 웹 환경에서는 라우팅 처리 개선
              if (Platform.OS === 'web') {
                try {
                  router.back();
                } catch (error) {
                  console.error('라우팅 오류:', error);
                  // 라우팅 실패 시 홈으로 이동
                  window.location.href = '/';
                }
              } else {
                router.back();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('설정 저장 실패:', error);
      Alert.alert(t('common.error'), t('settings.saveError'));
    }
  };

  // 알림 설정 화면으로 이동
  const goToNotificationSettings = () => {
    router.push('/settings/notifications' as any);
  };
  
  // 계정 설정 화면으로 이동
  const goToAccountSettings = () => {
    router.push('/settings/account' as any);
  };
  
  // 개인정보 처리방침 화면으로 이동
  const goToPrivacyPolicy = () => {
    router.push('/settings/privacy' as any);
  };
  
  // 이용약관 화면으로 이동
  const goToTermsOfService = () => {
    router.push('/settings/terms' as any);
  };
  
  // 문의하기 화면으로 이동
  const goToContactUs = () => {
    router.push('/settings/contact' as any);
  };
  
  // 다크 모드 설정 변경
  const handleDarkModeChange = (mode: 'system' | 'light' | 'dark') => {
    handleSettingChange('darkMode', mode);
    // 실제 다크 모드 적용 로직 추가 필요
  };
  
  // 데이터 사용량 설정 변경
  const handleDataUsageChange = (usage: 'low' | 'medium' | 'high') => {
    handleSettingChange('dataUsage', usage);
    Alert.alert(t('settings.dataUsageChanged'), t(`settings.dataUsage${usage.charAt(0).toUpperCase() + usage.slice(1)}Description`));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.loadingContainer}>
          <Ionicons name="settings" size={48} color="#CCCCCC" />
          <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title">{t('settings.title')}</ThemedText>

          {/* 계정 설정 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name="person" size={22} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('settings.account')}</ThemedText>
            </ThemedView>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={goToAccountSettings}
            >
              <ThemedView style={styles.menuItemContent}>
                <ThemedText>{t('settings.accountSettings')}</ThemedText>
                <ThemedText style={styles.menuItemDescription}>{t('settings.accountSettingsDescription')}</ThemedText>
              </ThemedView>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          </ThemedView>

          {/* 알림 설정 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name="notifications" size={22} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('settings.notifications')}</ThemedText>
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
              />
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('settings.newMessageReceiveEnabled')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('settings.newMessageReceiveDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.newMessageReceiveEnabled}
                onValueChange={(value) => handleSettingChange('newMessageReceiveEnabled', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.newMessageReceiveEnabled ? '#FFFFFF' : '#F4F3F4'}
                disabled={!settings.notificationsEnabled}
              />
            </ThemedView>
            
            {/* 새로운 편지 수신 설정 */}
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('profile.receiveNewLetters')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('settings.receiveNewLettersDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.receiveNewLetters}
                onValueChange={(value) => handleSettingChange('receiveNewLetters', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.receiveNewLetters ? '#FFFFFF' : '#F4F3F4'}
              />
            </ThemedView>
            
            {/* 편지 수신 알림 설정 */}
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('profile.receiveLetterAlerts')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('settings.receiveLetterAlertsDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.receiveLetterAlerts}
                onValueChange={(value) => handleSettingChange('receiveLetterAlerts', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.receiveLetterAlerts ? '#FFFFFF' : '#F4F3F4'}
              />
            </ThemedView>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={goToNotificationSettings}
            >
              <ThemedText>{t('settings.notificationAdvanced')}</ThemedText>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          </ThemedView>

          {/* 표시 설정 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name="color-palette" size={22} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('settings.display')}</ThemedText>
            </ThemedView>
            
            <ThemedText style={styles.settingLabel}>{t('settings.darkMode')}</ThemedText>
            <ThemedView style={styles.optionsContainer}>
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  settings.darkMode === 'system' && styles.optionButtonSelected
                ]}
                onPress={() => handleDarkModeChange('system')}
              >
                <Ionicons 
                  name="settings" 
                  size={20} 
                  color={settings.darkMode === 'system' ? '#FFFFFF' : '#007AFF'} 
                />
                <ThemedText style={[
                  styles.optionText,
                  settings.darkMode === 'system' && styles.optionTextSelected
                ]}>
                  {t('settings.system')}
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  settings.darkMode === 'light' && styles.optionButtonSelected
                ]}
                onPress={() => handleDarkModeChange('light')}
              >
                <Ionicons 
                  name="sunny" 
                  size={20} 
                  color={settings.darkMode === 'light' ? '#FFFFFF' : '#007AFF'} 
                />
                <ThemedText style={[
                  styles.optionText,
                  settings.darkMode === 'light' && styles.optionTextSelected
                ]}>
                  {t('settings.light')}
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  settings.darkMode === 'dark' && styles.optionButtonSelected
                ]}
                onPress={() => handleDarkModeChange('dark')}
              >
                <Ionicons 
                  name="moon" 
                  size={20} 
                  color={settings.darkMode === 'dark' ? '#FFFFFF' : '#007AFF'} 
                />
                <ThemedText style={[
                  styles.optionText,
                  settings.darkMode === 'dark' && styles.optionTextSelected
                ]}>
                  {t('settings.dark')}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          {/* 언어 설정 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name="language" size={22} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('settings.language')}</ThemedText>
            </ThemedView>
            
            <LanguageSelector />
          </ThemedView>

          {/* 데이터 사용 설정 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name="cellular" size={22} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('settings.dataUsage')}</ThemedText>
            </ThemedView>
            
            <ThemedText style={styles.settingLabel}>{t('settings.dataUsageOptions')}</ThemedText>
            <ThemedView style={styles.optionsContainer}>
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  settings.dataUsage === 'low' && styles.optionButtonSelected
                ]}
                onPress={() => handleDataUsageChange('low')}
              >
                <ThemedText style={[
                  styles.optionText,
                  settings.dataUsage === 'low' && styles.optionTextSelected
                ]}>
                  {t('settings.low')}
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  settings.dataUsage === 'medium' && styles.optionButtonSelected
                ]}
                onPress={() => handleDataUsageChange('medium')}
              >
                <ThemedText style={[
                  styles.optionText,
                  settings.dataUsage === 'medium' && styles.optionTextSelected
                ]}>
                  {t('settings.medium')}
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  settings.dataUsage === 'high' && styles.optionButtonSelected
                ]}
                onPress={() => handleDataUsageChange('high')}
              >
                <ThemedText style={[
                  styles.optionText,
                  settings.dataUsage === 'high' && styles.optionTextSelected
                ]}>
                  {t('settings.high')}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
            <ThemedText style={styles.settingDescription}>
              {t(`settings.dataUsage${settings.dataUsage.charAt(0).toUpperCase() + settings.dataUsage.slice(1)}Description`)}
            </ThemedText>
          </ThemedView>

          {/* 앱 정보 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={22} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('settings.about')}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>{t('settings.version')}:</ThemedText>
              <ThemedText>1.0.0</ThemedText>
            </ThemedView>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={goToPrivacyPolicy}
            >
              <ThemedText>{t('settings.privacyPolicy')}</ThemedText>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={goToTermsOfService}
            >
              <ThemedText>{t('settings.termsOfService')}</ThemedText>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={goToContactUs}
            >
              <ThemedText>{t('settings.contactUs')}</ThemedText>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          </ThemedView>

          {/* 설정 저장 버튼 */}
          <ThemedView style={styles.saveButtonContainer}>
            <StylishButton
              title={t('common.save')}
              onPress={saveAllSettings}
              type="primary"
              size="large"
              icon={<Ionicons name="save" size={20} color="#FFFFFF" />}
            />
          </ThemedView>
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
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    flex: 1,
    marginHorizontal: 4,
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    color: '#007AFF',
    marginLeft: 4,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
});