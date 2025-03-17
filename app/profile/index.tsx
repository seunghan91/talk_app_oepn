import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../lib/axios';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout, isAuthenticated, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // 프로필 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadProfileData();
    }
  }, [isAuthenticated]);

  // 프로필 데이터 로드 함수
  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // 실제 API 호출
      const response = await axiosInstance.get('/api/users/profile');
      
      // 프로필 이미지 설정
      if (response.data.profile_image_url) {
        setProfileImage(response.data.profile_image_url);
      }
      
      // 사용자 정보 설정
      setNickname(response.data.nickname || user?.nickname || '');
      setGender(response.data.gender || '');
      
      setLoading(false);
    } catch (error) {
      console.error('프로필 데이터 로드 실패:', error);
      
      // 개발 환경에서는 모의 데이터 사용
      if (__DEV__) {
        setNickname(user?.nickname || '사용자');
        setGender('남성');
      }
      
      setLoading(false);
    }
  };

  // 프로필 이미지 선택
  const pickImage = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        t('common.notice') || '알림',
        t('auth.loginRequired') || '로그인이 필요합니다',
        [
          {
            text: t('common.cancel') || '취소',
            style: 'cancel'
          },
          {
            text: t('auth.login') || '로그인',
            onPress: () => router.push('/auth/login')
          }
        ]
      );
      return;
    }
    
    try {
      // 이미지 라이브러리 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('common.error') || '오류', 
          t('profile.permissionDenied') || '갤러리 접근 권한이 필요합니다'
        );
        return;
      }
      
      // 이미지 선택기 실행
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // 이미지 업로드 처리
        await uploadProfileImage(selectedImage.uri);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert(
        t('common.error') || '오류', 
        t('profile.imagePickerError') || '이미지 선택 중 오류가 발생했습니다'
      );
    }
  };

  // 프로필 이미지 업로드
  const uploadProfileImage = async (imageUri: string) => {
    try {
      setLoading(true);
      
      // 파일 이름 생성
      const fileName = imageUri.split('/').pop() || 'image.jpg';
      const fileType = fileName.split('.').pop() || 'jpg';
      
      // FormData 생성
      const formData = new FormData();
      // @ts-ignore - React Native의 FormData는 TypeScript 정의와 약간 다름
      formData.append('profile_image', {
        uri: imageUri,
        name: fileName,
        type: `image/${fileType}`,
      });
      
      // API 요청
      const response = await axiosInstance.post('/api/users/profile_image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // 성공 시 이미지 URL 업데이트
      if (response.data.profile_image_url) {
        setProfileImage(response.data.profile_image_url);
        Alert.alert(
          t('common.success') || '성공', 
          t('profile.imageUpdated') || '프로필 이미지가 업데이트되었습니다'
        );
      }
      
      setLoading(false);
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      
      // 개발 환경에서는 모의 응답 처리
      if (__DEV__) {
        setProfileImage(imageUri);
        Alert.alert(
          t('common.success') || '성공', 
          t('profile.imageUpdated') || '프로필 이미지가 업데이트되었습니다'
        );
      } else {
        Alert.alert(
          t('common.error') || '오류', 
          t('profile.imageUploadError') || '이미지 업로드 중 오류가 발생했습니다'
        );
      }
      
      setLoading(false);
    }
  };

  // 프로필 정보 저장
  const saveProfileInfo = async () => {
    if (!isAuthenticated) {
      return;
    }
    
    try {
      setSaving(true);
      
      // API 요청
      const response = await axiosInstance.put('/api/users/profile', {
        nickname,
        gender
      });
      
      // 성공 시 사용자 정보 업데이트
      if (response.data) {
        // Auth 컨텍스트의 사용자 정보 업데이트
        if (updateUser) {
          updateUser({
            nickname,
            gender
          });
        }
        
        setIsEditing(false);
        Alert.alert(
          t('common.success') || '성공', 
          t('profile.profileUpdated') || '프로필 정보가 업데이트되었습니다'
        );
      }
      
      setSaving(false);
    } catch (error) {
      console.error('프로필 정보 저장 실패:', error);
      
      // 개발 환경에서는 모의 응답 처리
      if (__DEV__) {
        // Auth 컨텍스트의 사용자 정보 업데이트
        if (updateUser) {
          updateUser({
            nickname,
            gender
          });
        }
        
        setIsEditing(false);
        Alert.alert(
          t('common.success') || '성공', 
          t('profile.profileUpdated') || '프로필 정보가 업데이트되었습니다'
        );
      } else {
        Alert.alert(
          t('common.error') || '오류', 
          t('profile.profileUpdateError') || '프로필 정보 업데이트 중 오류가 발생했습니다'
        );
      }
      
      setSaving(false);
    }
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
              await logout();
              router.replace('/');
            } catch (error) {
              console.error('로그아웃 실패:', error);
              Alert.alert(
                t('common.error') || '오류', 
                t('auth.logoutError') || '로그아웃 중 오류가 발생했습니다'
              );
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  // 로그인 화면으로 이동
  const goToLogin = () => {
    router.push('/auth/login');
  };

  // 편집 모드 토글
  const toggleEditMode = () => {
    if (isEditing) {
      // 편집 모드 종료 시 원래 값으로 복원
      setNickname(user?.nickname || '');
      setGender(user?.gender || '');
    }
    setIsEditing(!isEditing);
  };

  // 성별 선택
  const selectGender = (selectedGender: string) => {
    setGender(selectedGender);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={pickImage} disabled={loading}>
            <View style={styles.profileImageContainer}>
              {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
              ) : profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={60} color="#CCCCCC" />
                </View>
              )}
              {isAuthenticated && (
                <View style={styles.editIconContainer}>
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          {isAuthenticated ? (
            <>
              {isEditing ? (
                <View style={styles.editContainer}>
                  <ThemedText style={styles.editLabel}>닉네임</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="닉네임을 입력하세요"
                    placeholderTextColor="#999999"
                    maxLength={20}
                  />
                  
                  <ThemedText style={styles.editLabel}>성별</ThemedText>
                  <View style={styles.genderContainer}>
                    <TouchableOpacity
                      style={[
                        styles.genderOption,
                        gender === '남성' && styles.genderOptionSelected
                      ]}
                      onPress={() => selectGender('남성')}
                    >
                      <ThemedText
                        style={[
                          styles.genderText,
                          gender === '남성' && styles.genderTextSelected
                        ]}
                      >
                        남성
                      </ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.genderOption,
                        gender === '여성' && styles.genderOptionSelected
                      ]}
                      onPress={() => selectGender('여성')}
                    >
                      <ThemedText
                        style={[
                          styles.genderText,
                          gender === '여성' && styles.genderTextSelected
                        ]}
                      >
                        여성
                      </ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.genderOption,
                        gender === '기타' && styles.genderOptionSelected
                      ]}
                      onPress={() => selectGender('기타')}
                    >
                      <ThemedText
                        style={[
                          styles.genderText,
                          gender === '기타' && styles.genderTextSelected
                        ]}
                      >
                        기타
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.buttonContainer}>
                    <StylishButton
                      title={t('common.cancel') || '취소'}
                      onPress={toggleEditMode}
                      type="secondary"
                      size="small"
                      style={styles.cancelButton}
                    />
                    <StylishButton
                      title={t('common.save') || '저장'}
                      onPress={saveProfileInfo}
                      type="primary"
                      size="small"
                      style={styles.saveButton}
                      loading={saving}
                    />
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.profileInfoContainer}>
                    <ThemedText style={styles.username}>
                      {nickname || user?.nickname || t('profile.anonymous') || '사용자'}
                    </ThemedText>
                    {gender && (
                      <ThemedText style={styles.genderInfo}>
                        {gender}
                      </ThemedText>
                    )}
                    <TouchableOpacity
                      style={styles.editProfileButton}
                      onPress={toggleEditMode}
                    >
                      <Ionicons name="create-outline" size={16} color="#007AFF" />
                      <ThemedText style={styles.editProfileText}>
                        {t('profile.editProfile') || '프로필 수정'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                  
                  <StylishButton
                    title={t('auth.logout') || '로그아웃'}
                    onPress={handleLogout}
                    type="secondary"
                    size="small"
                    style={styles.logoutButton}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <ThemedText style={styles.loginPrompt}>
                {t('profile.loginPrompt') || '로그인하여 프로필을 관리하세요'}
              </ThemedText>
              
              <StylishButton
                title={t('auth.login') || '로그인'}
                onPress={goToLogin}
                type="primary"
                size="medium"
                style={styles.loginButton}
              />
            </>
          )}
        </ThemedView>
        
        {isAuthenticated && !isEditing && (
          <ThemedView style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/settings/account')}
            >
              <Ionicons name="person-circle" size={24} color="#007AFF" />
              <ThemedText style={styles.menuText}>{t('profile.accountSettings') || '계정 설정'}</ThemedText>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/settings/notifications')}
            >
              <Ionicons name="notifications" size={24} color="#FF9500" />
              <ThemedText style={styles.menuText}>{t('profile.notifications') || '알림 설정'}</ThemedText>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings" size={24} color="#34C759" />
              <ThemedText style={styles.menuText}>{t('profile.settings') || '설정'}</ThemedText>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          </ThemedView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  genderInfo: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  editProfileText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 5,
  },
  loginPrompt: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loginButton: {
    marginTop: 10,
    width: 150,
  },
  logoutButton: {
    marginTop: 10,
    width: 120,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 15,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  menuText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
  },
  loader: {
    position: 'absolute',
  },
  editContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  textInput: {
    width: '100%',
    height: 45,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  genderOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F2FF',
  },
  genderText: {
    fontSize: 14,
    color: '#333333',
  },
  genderTextSelected: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelButton: {
    marginRight: 10,
    width: 100,
  },
  saveButton: {
    width: 100,
  },
}); 