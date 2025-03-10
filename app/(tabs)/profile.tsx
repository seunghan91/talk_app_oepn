import { StyleSheet, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../lib/axios';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import LanguageSelector from '../../components/LanguageSelector';
import NicknameEditor from '../../components/NicknameEditor';
import StylishButton from '../../components/StylishButton';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';

// 성별 타입 정의
type Gender = 'male' | 'female' | 'unspecified';

interface User {
  id: number;
  nickname: string;
  phone_number: string;
  gender?: Gender;
  [key: string]: any;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user: authUser, isAuthenticated, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [changingNickname, setChangingNickname] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [user, setUser] = useState<User | null>(null);

  // 사용자 정보 로드
  useEffect(() => {
    const fetchUserData = async (): Promise<void> => {
      try {
        setLoading(true);
        
        if (isAuthenticated && authUser) {
          // AuthContext에서 가져온 사용자 정보 사용
          setUser(authUser);
          setEditedUser(authUser);
          console.log('사용자 정보 로드됨:', authUser);
        } else {
          setUser(null);
          setEditedUser({});
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        Alert.alert(t('common.error'), t('profile.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, authUser]); // authUser가 변경될 때마다 다시 로드

  // 로그아웃 처리
  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
    } catch (err) {
      console.error('로그아웃 실패:', err);
      Alert.alert(t('common.error'), t('profile.logoutError'));
    }
  };

  // 닉네임 변경 저장
  const handleNicknameSaved = (newNickname: string): void => {
    if (user) {
      const updatedUser = { ...user, nickname: newNickname };
      setUser(updatedUser);
      setChangingNickname(false);
      
      // AuthContext의 updateUser 함수를 호출하여 전역 상태 업데이트
      updateUser({ nickname: newNickname });
      
      // 성공 메시지 표시
      console.log('닉네임 변경됨:', newNickname);
    }
  };

  // 프로필 정보 변경 처리
  const handleProfileChange = (field: keyof User, value: any): void => {
    setEditedUser(prev => ({ ...prev, [field]: value }));
  };

  // 프로필 정보 저장
  const saveProfileChanges = async (): Promise<void> => {
    try {
      // 실제 API 호출 (현재는 더미 구현)
      // const res = await axiosInstance.put<{ user: User }>('/api/update_profile', editedUser);
      
      // 성공 시 사용자 정보 업데이트
      setUser(prev => prev ? { ...prev, ...editedUser } : null);
      
      // AuthContext의 updateUser 함수를 호출하여 전역 상태 업데이트
      updateUser(editedUser);
      
      setEditingProfile(false);
      Alert.alert(t('common.success'), t('profile.updateSuccess'));
    } catch (err: any) {
      console.error('프로필 업데이트 실패:', err);
      Alert.alert(t('common.error'), t('profile.updateError'));
    }
  };

  // 성별 표시 텍스트
  const getGenderText = (gender?: Gender): string => {
    if (!gender || gender === 'unspecified') return t('profile.genderUnspecified');
    return gender === 'male' ? t('profile.genderMale') : t('profile.genderFemale');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title">{t('profile.title')}</ThemedText>
          
          {/* 언어 선택 */}
          <LanguageSelector />
          
          {loading ? (
            <ThemedView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
            </ThemedView>
          ) : isAuthenticated && user ? (
            <ThemedView style={styles.profileInfo}>
              {/* 전화번호 */}
              <ThemedView style={styles.stepContainer}>
                <ThemedText type="subtitle">{t('profile.phoneNumber')}</ThemedText>
                <ThemedText>{user.phone_number}</ThemedText>
              </ThemedView>
              
              {/* 닉네임 */}
              <ThemedView style={styles.stepContainer}>
                <ThemedText type="subtitle">{t('profile.nickname')}</ThemedText>
                {changingNickname ? (
                  <NicknameEditor 
                    initialNickname={user.nickname}
                    onSave={handleNicknameSaved}
                    onCancel={() => setChangingNickname(false)}
                  />
                ) : (
                  <ThemedView style={styles.infoRow}>
                    <ThemedText>{user.nickname}</ThemedText>
                    <StylishButton 
                      title={t('profile.changeNickname')} 
                      onPress={() => setChangingNickname(true)}
                      type="secondary"
                      size="small"
                      icon={<Ionicons name="pencil" size={16} color="#FFFFFF" />}
                    />
                  </ThemedView>
                )}
              </ThemedView>
              
              {/* 추가 프로필 정보 */}
              {editingProfile ? (
                <ThemedView style={styles.stepContainer}>
                  <ThemedText type="subtitle">{t('profile.editProfile')}</ThemedText>
                  
                  {/* 성별 선택 */}
                  <ThemedView style={styles.fieldContainer}>
                    <ThemedText>{t('profile.gender')}</ThemedText>
                    <ThemedView style={styles.optionsRow}>
                      <StylishButton 
                        title={t('profile.genderMale')} 
                        onPress={() => handleProfileChange('gender', 'male')}
                        type={editedUser.gender === 'male' ? 'primary' : 'outline'}
                        size="small"
                      />
                      <StylishButton 
                        title={t('profile.genderFemale')} 
                        onPress={() => handleProfileChange('gender', 'female')}
                        type={editedUser.gender === 'female' ? 'primary' : 'outline'}
                        size="small"
                      />
                      <StylishButton 
                        title={t('profile.genderUnspecified')} 
                        onPress={() => handleProfileChange('gender', 'unspecified')}
                        type={(!editedUser.gender || editedUser.gender === 'unspecified') ? 'primary' : 'outline'}
                        size="small"
                      />
                    </ThemedView>
                  </ThemedView>
                  
                  {/* 저장/취소 버튼 */}
                  <ThemedView style={styles.buttonRow}>
                    <StylishButton 
                      title={t('common.cancel')} 
                      onPress={() => {
                        setEditedUser(user);
                        setEditingProfile(false);
                      }}
                      type="outline"
                      size="medium"
                    />
                    <StylishButton 
                      title={t('common.save')} 
                      onPress={saveProfileChanges}
                      type="primary"
                      size="medium"
                    />
                  </ThemedView>
                </ThemedView>
              ) : (
                <ThemedView style={styles.stepContainer}>
                  <ThemedText type="subtitle">{t('profile.additionalInfo')}</ThemedText>
                  
                  <ThemedView style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>{t('profile.gender')}:</ThemedText>
                    <ThemedText>{getGenderText(user.gender as Gender)}</ThemedText>
                  </ThemedView>
                  
                  <StylishButton 
                    title={t('profile.editProfile')} 
                    onPress={() => setEditingProfile(true)}
                    type="secondary"
                    size="medium"
                    icon={<Ionicons name="create" size={18} color="#FFFFFF" />}
                    style={styles.editButton}
                  />
                </ThemedView>
              )}
              
              {/* 프로필 저장 버튼 */}
              <ThemedView style={styles.stepContainer}>
                <StylishButton 
                  title={t('profile.saveProfile')} 
                  onPress={() => {
                    // 현재 프로필 정보를 서버에 저장
                    Alert.alert(
                      t('common.success'),
                      t('profile.profileSaved'),
                      [{ text: t('common.ok') }]
                    );
                  }}
                  type="primary"
                  size="medium"
                  icon={<Ionicons name="save" size={18} color="#FFFFFF" />}
                />
              </ThemedView>
              
              {/* 로그아웃 버튼 */}
              <ThemedView style={styles.stepContainer}>
                <StylishButton 
                  title={t('profile.logout')} 
                  onPress={handleLogout}
                  type="danger"
                  size="medium"
                  icon={<Ionicons name="log-out" size={18} color="#FFFFFF" />}
                />
              </ThemedView>
            </ThemedView>
          ) : (
            <ThemedView style={styles.stepContainer}>
              <ThemedText style={styles.loginRequiredText}>{t('profile.loginRequired')}</ThemedText>
              <StylishButton 
                title={t('profile.login')} 
                onPress={() => router.push({
                  pathname: '/auth'
                })}
                type="primary"
                size="medium"
                icon={<Ionicons name="log-in" size={18} color="#FFFFFF" />}
              />
            </ThemedView>
          )}
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
  profileInfo: {
    marginTop: 20,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  editButton: {
    marginTop: 8,
  },
  loginRequiredText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: '#666666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  }
}); 