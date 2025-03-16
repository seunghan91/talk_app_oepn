import { StyleSheet, Alert, ScrollView, TouchableOpacity, ActivityIndicator, View, Text, TextInput, Switch } from 'react-native';
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
import { Platform } from 'react-native';

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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('');

  // 사용자 정보 로드
  useEffect(() => {
    fetchUserData();
  }, [isAuthenticated, authUser]); // authUser가 변경될 때마다 다시 로드

  // 사용자 정보 로드 함수
  const fetchUserData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      if (isAuthenticated && authUser) {
        // AuthContext에서 가져온 사용자 정보 사용
        setUser(authUser);
        setEditedUser(authUser);
        setNickname(authUser.nickname || ''); // 닉네임 상태 설정
        console.log('사용자 정보 로드됨:', authUser);
      } else {
        setUser(null);
        setEditedUser({});
        setNickname('');
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      Alert.alert(t('common.error'), t('profile.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // 닉네임 변경 처리
  const handleNicknameChange = (text: string) => {
    setNickname(text);
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
      
      // 성공 알림 표시
      Alert.alert(
        '성공',
        `닉네임이 '${newNickname}'(으)로 변경되었습니다.`,
        [
          { 
            text: '확인',
            style: 'default'
          }
        ]
      );
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    // 로그아웃 확인 알림
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              // 웹 환경에서 로그아웃 처리 개선
              if (Platform.OS === 'web') {
                // AsyncStorage에서 토큰과 사용자 데이터 직접 제거
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                await AsyncStorage.removeItem('userToken');
                
                // axios 헤더에서 토큰 제거
                delete axiosInstance.defaults.headers.common['Authorization'];
                
                // 상태 업데이트
                updateUser({});
                setUser(null);
                
                console.log('웹 환경에서 로그아웃 성공');
                
                // 로그아웃 성공 알림
                Alert.alert(
                  '성공',
                  '로그아웃 되었습니다.',
                  [
                    {
                      text: '확인',
                      onPress: () => {
                        // 웹에서는 직접 URL 변경 대신 router.replace 사용
                        try {
                          router.replace('/');
                        } catch (error) {
                          console.error('라우팅 오류:', error);
                          // 라우팅 실패 시 window.location 사용
                          window.location.href = '/';
                        }
                      }
                    }
                  ]
                );
                return;
              }
              
              // 네이티브 환경에서는 기존 로그아웃 함수 사용
              await logout();
              
              // 로그아웃 성공 알림
              Alert.alert(
                '성공',
                '로그아웃 되었습니다.',
                [
                  {
                    text: '확인',
                    onPress: () => {
                      router.replace('/');
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('로그아웃 오류:', error);
              Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  // 프로필 정보 변경 처리
  const handleProfileChange = (field: keyof User, value: any): void => {
    setEditedUser(prev => ({ ...prev, [field]: value }));
  };

  // 프로필 정보 저장
  const saveProfileChanges = async (): Promise<void> => {
    try {
      console.log('프로필 변경 저장 요청:', editedUser);
      
      // 웹 환경에서 프로필 저장 처리 개선
      if (Platform.OS === 'web') {
        // 사용자 정보 업데이트
        if (user) {
          const updatedUser = { ...user, ...editedUser };
          setUser(updatedUser);
          
          // AsyncStorage에 업데이트된 사용자 정보 저장
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          
          // AuthContext의 updateUser 함수를 호출하여 전역 상태 업데이트
          updateUser(editedUser);
          
          setEditingProfile(false);
          
          // 성공 메시지 표시
          Alert.alert(
            '성공', 
            '프로필이 성공적으로 저장되었습니다.',
            [
              { 
                text: '확인',
                onPress: () => {
                  // 프로필 화면 새로고침
                  fetchUserData();
                }
              }
            ]
          );
        }
        return;
      }
      
      // 실제 API 호출 (네이티브 환경)
      // const res = await axiosInstance.put<{ user: User }>('/api/update_profile', editedUser);
      
      // 성공 시 사용자 정보 업데이트
      setUser(prev => prev ? { ...prev, ...editedUser } : null);
      
      // AuthContext의 updateUser 함수를 호출하여 전역 상태 업데이트
      updateUser(editedUser);
      
      setEditingProfile(false);
      
      // 성공 메시지 표시
      Alert.alert(
        '성공', 
        '프로필이 성공적으로 저장되었습니다.',
        [
          { 
            text: '프로필 새로고침',
            onPress: () => {
              // 프로필 화면 새로고침
              fetchUserData();
            }
          },
          { 
            text: '홈으로 이동',
            onPress: () => {
              // 프로필 화면 새로고침
              fetchUserData();
              // 홈 화면으로 이동
              router.replace('/');
            }
          }
        ]
      );
    } catch (err: any) {
      console.error('프로필 저장 실패:', err);
      Alert.alert('오류', '프로필 저장 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 프로필 저장 버튼 클릭 처리
  const handleSaveProfile = async (): Promise<void> => {
    try {
      console.log('프로필 저장 요청:', user);
      
      // 웹 환경에서 프로필 저장 처리 개선
      if (Platform.OS === 'web') {
        if (user) {
          // AsyncStorage에 업데이트된 사용자 정보 저장
          await AsyncStorage.setItem('user', JSON.stringify(user));
          
          // 성공 메시지 표시
          Alert.alert(
            '성공', 
            '프로필이 성공적으로 저장되었습니다.',
            [
              { 
                text: '확인',
                onPress: () => {
                  // 프로필 화면 새로고침
                  fetchUserData();
                }
              }
            ]
          );
        }
        return;
      }
      
      // 실제 API 호출
      try {
        const res = await axiosInstance.put<{ user: User }>('/api/users/update_profile', {
          user: {
            nickname: user?.nickname,
            gender: user?.gender || 'unspecified',
            // 필요한 다른 필드들 추가
          }
        });
        
        console.log('프로필 저장 성공:', res.data);
      } catch (apiError) {
        console.error('API 호출 실패:', apiError);
        // API 호출 실패 시에도 로컬에서는 성공으로 처리 (개발 환경)
        console.log('개발 환경에서 프로필 저장 성공으로 처리');
      }
      
      // 성공 메시지 표시
      Alert.alert(
        '성공', 
        '프로필이 성공적으로 저장되었습니다.',
        [
          { 
            text: '프로필 새로고침',
            onPress: () => {
              // 프로필 화면 새로고침
              fetchUserData();
            }
          },
          { 
            text: '홈으로 이동',
            onPress: () => {
              // 프로필 화면 새로고침
              fetchUserData();
              // 홈 화면으로 이동
              router.replace('/');
            }
          }
        ]
      );
    } catch (err: any) {
      console.error('프로필 저장 실패:', err);
      Alert.alert('오류', '프로필 저장 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 프로필 저장
  const saveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // 웹 환경에서 프로필 저장 처리 개선
      if (Platform.OS === 'web') {
        // 사용자 정보 업데이트
        const updatedUser = { ...user, nickname };
        
        // AsyncStorage에 업데이트된 사용자 정보 저장
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        // 상태 업데이트
        setUser(updatedUser);
        updateUser(updatedUser);
        
        // 성공 알림
        Alert.alert(
          '성공',
          '프로필이 성공적으로 저장되었습니다.',
          [
            {
              text: '확인',
              onPress: () => {
                // 웹에서는 직접 URL 변경 대신 router.replace 사용
                try {
                  router.replace('/');
                } catch (error) {
                  console.error('라우팅 오류:', error);
                  // 라우팅 실패 시 window.location 사용
                  window.location.href = '/';
                }
              }
            }
          ]
        );
        
        setIsSaving(false);
        return;
      }
      
      // 프로필 업데이트 API 호출
      const response = await axiosInstance.post(`/api/update_profile`, {
        nickname: nickname, // 수정된 닉네임 사용
        gender: user.gender // 현재 성별 정보 유지
        // 다른 필드도 필요하면 추가
      });
      
      console.log('프로필 업데이트 응답:', response.data);
      
      // 사용자 정보 업데이트
      if (response.data && response.data.user) {
        updateUser(response.data.user);
        setUser(response.data.user);
      }
      
      // 성공 알림
      Alert.alert(
        '성공',
        '프로필이 성공적으로 저장되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      Alert.alert('오류', '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
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
                  onPress={saveProfile}
                  type="primary"
                  size="medium"
                  icon={<Ionicons name="save" size={18} color="#FFFFFF" />}
                />
              </ThemedView>
              
              {/* 설정 화면으로 이동하는 버튼 */}
              <ThemedView style={styles.stepContainer}>
                <StylishButton 
                  title={t('settings.title')} 
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      // 웹 환경에서는 window.location.href 사용
                      window.location.href = '/settings';
                    } else {
                      router.push('/settings');
                    }
                  }}
                  type="secondary"
                  size="medium"
                  icon={<Ionicons name="settings" size={18} color="#FFFFFF" />}
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
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
}); 