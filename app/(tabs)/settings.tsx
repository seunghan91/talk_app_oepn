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

export default function SettingsTab() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

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
              await logout();
              router.replace('/');
            } catch (error) {
              console.error('로그아웃 실패:', error);
              Alert.alert(t('common.error') || '오류', t('auth.logoutError') || '로그아웃 중 오류가 발생했습니다.');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  // 계정 설정 화면으로 이동
  const goToAccountSettings = () => {
    router.push('/settings/account');
  };

  // 알림 설정 화면으로 이동
  const goToNotificationSettings = () => {
    router.push('/settings/notifications');
  };

  // 프로필 화면으로 이동
  const goToProfile = () => {
    router.push('/profile');
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
          
          {/* 설정 메뉴 */}
          <ThemedView style={styles.section}>
            <TouchableOpacity style={styles.menuItem} onPress={goToAccountSettings}>
              <View style={styles.menuIcon}>
                <Ionicons name="person" size={24} color="#007AFF" />
              </View>
              <View style={styles.menuTextContainer}>
                <ThemedText style={styles.menuText}>{t('settings.account') || '계정 설정'}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={goToNotificationSettings}>
              <View style={styles.menuIcon}>
                <Ionicons name="notifications" size={24} color="#007AFF" />
              </View>
              <View style={styles.menuTextContainer}>
                <ThemedText style={styles.menuText}>{t('settings.notifications') || '알림 설정'}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
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
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 10,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
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