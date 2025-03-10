import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface AccountSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingConsent: boolean;
  twoFactorAuth: boolean;
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<AccountSettings>({
    emailNotifications: true,
    smsNotifications: true,
    marketingConsent: false,
    twoFactorAuth: false,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('account_settings');
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error('계정 설정 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 설정 저장
  const saveSettings = async (newSettings: AccountSettings) => {
    try {
      await AsyncStorage.setItem('account_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('계정 설정 저장 실패:', error);
      Alert.alert(t('common.error'), t('settings.saveError'));
    }
  };

  // 설정 변경 처리
  const handleSettingChange = (key: keyof AccountSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // 비밀번호 변경 화면으로 이동
  const goToChangePassword = () => {
    router.push('/settings/change-password' as any);
  };

  // 개인정보 수정 화면으로 이동
  const goToEditProfile = () => {
    router.push('/settings/edit-profile' as any);
  };

  // 계정 삭제 확인
  const confirmDeleteAccount = () => {
    Alert.alert(
      t('account.deleteAccountTitle'),
      t('account.deleteAccountConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('account.deleteAccount'),
          style: 'destructive',
          onPress: deleteAccount,
        },
      ]
    );
  };

  // 계정 삭제 처리
  const deleteAccount = async () => {
    try {
      // 실제 API 호출 (현재는 더미 구현)
      // await axiosInstance.delete('/api/account');
      
      // 로컬 스토리지 정리
      await AsyncStorage.clear();
      
      // 성공 메시지 표시
      Alert.alert(
        t('account.deleteAccountSuccess'),
        t('account.deleteAccountSuccessMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              // 로그아웃 처리 후 인증 화면으로 이동
              logout();
              router.replace('/auth' as any);
            },
          },
        ]
      );
    } catch (error) {
      console.error('계정 삭제 실패:', error);
      Alert.alert(t('common.error'), t('account.deleteAccountError'));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.loadingContainer}>
          <Ionicons name="person" size={48} color="#CCCCCC" />
          <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title">{t('account.title')}</ThemedText>

          {/* 계정 정보 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name="person" size={22} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('account.personalInfo')}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>{t('profile.nickname')}:</ThemedText>
              <ThemedText>{user?.nickname || '-'}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>{t('profile.phoneNumber')}:</ThemedText>
              <ThemedText>{user?.phone_number || '-'}</ThemedText>
            </ThemedView>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={goToEditProfile}
            >
              <ThemedText>{t('account.editPersonalInfo')}</ThemedText>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          </ThemedView>

          {/* 보안 설정 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name="shield" size={22} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('account.security')}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('account.twoFactorAuth')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('account.twoFactorAuthDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.twoFactorAuth}
                onValueChange={(value) => handleSettingChange('twoFactorAuth', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.twoFactorAuth ? '#FFFFFF' : '#F4F3F4'}
              />
            </ThemedView>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={goToChangePassword}
            >
              <ThemedText>{t('account.changePassword')}</ThemedText>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          </ThemedView>

          {/* 알림 설정 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name="notifications" size={22} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('account.communicationPreferences')}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('account.emailNotifications')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('account.emailNotificationsDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.emailNotifications}
                onValueChange={(value) => handleSettingChange('emailNotifications', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.emailNotifications ? '#FFFFFF' : '#F4F3F4'}
              />
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('account.smsNotifications')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('account.smsNotificationsDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.smsNotifications}
                onValueChange={(value) => handleSettingChange('smsNotifications', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.smsNotifications ? '#FFFFFF' : '#F4F3F4'}
              />
            </ThemedView>
            
            <ThemedView style={styles.settingRow}>
              <ThemedView>
                <ThemedText>{t('account.marketingConsent')}</ThemedText>
                <ThemedText style={styles.settingDescription}>{t('account.marketingConsentDescription')}</ThemedText>
              </ThemedView>
              <Switch
                value={settings.marketingConsent}
                onValueChange={(value) => handleSettingChange('marketingConsent', value)}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : settings.marketingConsent ? '#FFFFFF' : '#F4F3F4'}
              />
            </ThemedView>
          </ThemedView>

          {/* 계정 관리 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <Ionicons name="settings" size={22} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('account.accountManagement')}</ThemedText>
            </ThemedView>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => logout()}
            >
              <ThemedText>{t('profile.logout')}</ThemedText>
              <Ionicons name="log-out" size={20} color="#FF3B30" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.dangerItem]}
              onPress={confirmDeleteAccount}
            >
              <ThemedText style={styles.dangerText}>{t('account.deleteAccount')}</ThemedText>
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
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
    width: 80,
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
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#FF3B30',
  },
}); 