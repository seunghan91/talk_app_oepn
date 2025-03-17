import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../lib/axios';
import { SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 에러 타입 정의
type ErrorType = 'network' | 'server' | 'auth' | 'unknown';

// 프로필 업데이트 함수 타입 정의
type UpdateProfileParams = {
  field: 'nickname' | 'gender';
  value: string;
  endpoint: string;
  successMessage: string;
  errorMessage: string;
  onSuccess?: () => void;
};

// 성별 옵션 정의 변경
const GENDER_OPTIONS = ['남성', '여성', '선택안함'] as const;
type Gender = typeof GENDER_OPTIONS[number];

// 성별 옵션을 서버 값으로 매핑하는 함수 추가
const genderToServerValue = (gender: Gender): string => {
  switch (gender) {
    case '남성': return 'male';
    case '여성': return 'female';
    case '선택안함': return 'unknown';
    default: return 'unknown';
  }
};

// 서버 값을 UI 표시용 성별로 매핑하는 함수 추가
const serverValueToGender = (value: string): Gender => {
  switch (value) {
    case 'male': return '남성';
    case 'female': return '여성';
    case 'unknown': return '선택안함';
    default: return '선택안함';
  }
};

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout, isAuthenticated, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [isChangingNickname, setIsChangingNickname] = useState(false);
  const [isChangingGender, setIsChangingGender] = useState(false);
  const [randomNickname, setRandomNickname] = useState('');
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // 화면 새로고침을 위한 키

  // 프로필 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadProfileData();
    }
  }, [isAuthenticated, refreshKey]);

  // 프로필 데이터 로드 함수
  const loadProfileData = async () => {
    try {
      setLoading(true);
      setErrorType(null);
      
      // 실제 API 호출
      const response = await axiosInstance.get('/api/users/profile');
      
      // 사용자 정보 설정
      setNickname(response.data.nickname || user?.nickname || '');
      // 서버에서 받은 성별 값을 UI 표시용으로 변환
      setGender(serverValueToGender(response.data.gender || ''));
      
      setLoading(false);
    } catch (error: any) {
      console.error('프로필 데이터 로드 실패:', error);
      
      // 에러 타입 설정
      if (error.response) {
        if (error.response.status === 401) {
          setErrorType('auth');
        } else {
          setErrorType('server');
        }
      } else if (error.request) {
        setErrorType('network');
      } else {
        setErrorType('unknown');
      }
      
      // 개발 환경에서는 모의 데이터 사용
      if (__DEV__) {
        setNickname(user?.nickname || '사용자');
        setGender('남성');
      }
      
      setLoading(false);
    }
  };

  // 화면 새로고침
  const refreshProfile = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 랜덤 닉네임 생성
  const generateRandomNickname = async () => {
    try {
      setSaving(true);
      setErrorType(null);
      
      // 실제 API 호출
      const response = await axiosInstance.get('/api/users/random_nickname');
      
      if (response.data.nickname) {
        setRandomNickname(response.data.nickname);
      } else {
        // 개발 환경에서는 모의 데이터 사용
        generateRandomNicknameLocally();
      }
      
      setSaving(false);
    } catch (error: any) {
      console.error('랜덤 닉네임 생성 실패:', error);
      
      // 에러 타입 설정
      if (error.response) {
        setErrorType('server');
      } else if (error.request) {
        setErrorType('network');
      } else {
        setErrorType('unknown');
      }
      
      // 개발 환경에서는 모의 데이터 사용
      if (__DEV__) {
        generateRandomNicknameLocally();
      }
      
      setSaving(false);
    }
  };

  // 로컬에서 랜덤 닉네임 생성 (개발 환경용)
  const generateRandomNicknameLocally = () => {
    const adjectives = ['즐거운', '행복한', '명랑한', '귀여운', '멋진', '용감한', '영리한', '재치있는', '유쾌한', '친절한'];
    const nouns = ['곰돌이', '토끼', '사자', '호랑이', '고양이', '강아지', '여우', '판다', '코끼리', '기린'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    setRandomNickname(`${randomAdj}${randomNoun}${randomNum}`);
  };

  // 프로필 정보 업데이트 (공통 함수)
  const updateProfileInfo = async ({
    field,
    value,
    endpoint,
    successMessage,
    errorMessage,
    onSuccess
  }: UpdateProfileParams) => {
    try {
      setSaving(true);
      setErrorType(null);
      
      // API 요청
      const requestBody = field === 'nickname' ? { nickname: value } : { gender: value };
      const response = await axiosInstance.post(endpoint, requestBody);
      
      // 성공 시 사용자 정보 업데이트
      if (response.data.success || __DEV__) {
        // Auth 컨텍스트의 사용자 정보 업데이트
        if (updateUser) {
          updateUser({
            [field]: value
          });
        }
        
        // 상태 업데이트
        if (field === 'nickname') {
          setNickname(value);
          setRandomNickname('');
          setIsChangingNickname(false);
        } else if (field === 'gender') {
          setGender(value as Gender);
          setIsChangingGender(false);
        }
        
        // 성공 메시지 표시
        Alert.alert(
          t('common.success') || '성공', 
          successMessage,
          [
            {
              text: '확인',
              onPress: refreshProfile // 확인 버튼 클릭 시 프로필 새로고침
            }
          ]
        );
        
        // 추가 성공 콜백 실행
        if (onSuccess) {
          onSuccess();
        }
      }
      
      setSaving(false);
    } catch (error: any) {
      console.error(`${field} 업데이트 실패:`, error);
      
      // 에러 타입 설정
      if (error.response) {
        if (error.response.status === 401) {
          setErrorType('auth');
        } else {
          setErrorType('server');
        }
      } else if (error.request) {
        setErrorType('network');
      } else {
        setErrorType('unknown');
      }
      
      // 개발 환경에서는 모의 응답 처리
      if (__DEV__) {
        // Auth 컨텍스트의 사용자 정보 업데이트
        if (updateUser) {
          updateUser({
            [field]: value
          });
        }
        
        // 상태 업데이트
        if (field === 'nickname') {
          setNickname(value);
          setRandomNickname('');
          setIsChangingNickname(false);
        } else if (field === 'gender') {
          setGender(value as Gender);
          setIsChangingGender(false);
        }
        
        // 성공 메시지 표시
        Alert.alert(
          t('common.success') || '성공', 
          successMessage,
          [
            {
              text: '확인',
              onPress: refreshProfile // 확인 버튼 클릭 시 프로필 새로고침
            }
          ]
        );
      } else {
        // 에러 메시지 표시
        const errorTitle = t('common.error') || '오류';
        let errorMsg = errorMessage;
        
        // 에러 타입에 따른 메시지 추가
        if (errorType === 'network') {
          errorMsg += '\n네트워크 연결을 확인해주세요.';
        } else if (errorType === 'server') {
          errorMsg += '\n서버에 문제가 발생했습니다.';
        } else if (errorType === 'auth') {
          errorMsg += '\n로그인이 필요합니다.';
        }
        
        Alert.alert(errorTitle, errorMsg);
      }
      
      setSaving(false);
    }
  };

  // 닉네임 변경
  const saveNickname = async () => {
    if (!randomNickname) {
      Alert.alert(
        t('common.notice') || '알림',
        t('profile.generateNicknameFirst') || '먼저 랜덤 닉네임 생성 버튼을 눌러주세요.'
      );
      return;
    }
    
    await updateProfileInfo({
      field: 'nickname',
      value: randomNickname,
      endpoint: '/api/users/change_nickname',
      successMessage: t('profile.nicknameUpdated') || '닉네임이 업데이트되었습니다',
      errorMessage: t('profile.nicknameUpdateError') || '닉네임 업데이트 중 오류가 발생했습니다'
    });
  };

  // 성별 변경
  const updateGender = async (newGender: Gender) => {
    // 서버에 전송할 값으로 변환
    const serverGenderValue = genderToServerValue(newGender);
    
    await updateProfileInfo({
      field: 'gender',
      value: serverGenderValue,
      endpoint: '/api/users/update_profile',
      successMessage: t('profile.genderUpdated') || '성별이 업데이트되었습니다',
      errorMessage: t('profile.genderUpdateError') || '성별 업데이트 중 오류가 발생했습니다'
    });
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
              // 로그아웃 함수 호출 전 콘솔 로그 추가
              console.log('로그아웃 시도...');
              
              // AsyncStorage에서 직접 토큰 제거 (백업 방법)
              try {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                await AsyncStorage.removeItem('userToken');
                console.log('AsyncStorage에서 토큰 제거 완료');
              } catch (storageError) {
                console.error('AsyncStorage 토큰 제거 실패:', storageError);
              }
              
              // AuthContext의 logout 함수 호출
              await logout();
              console.log('로그아웃 성공');
              
              // 홈 화면으로 이동
              router.replace('/');
            } catch (error) {
              console.error('로그아웃 실패:', error);
              Alert.alert(
                t('common.error') || '오류', 
                t('auth.logoutError') || '로그아웃 중 오류가 발생했습니다'
              );
            } finally {
              setLoading(false);
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

  // 홈으로 이동
  const goToHome = () => {
    router.replace('/');
  };

  // 에러 메시지 렌더링
  const renderErrorMessage = () => {
    if (!errorType) return null;
    
    let message = '';
    switch (errorType) {
      case 'network':
        message = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
        break;
      case 'server':
        message = '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
        break;
      case 'auth':
        message = '인증에 실패했습니다. 다시 로그인해주세요.';
        break;
      default:
        message = '알 수 없는 오류가 발생했습니다.';
    }
    
    return (
      <ThemedView 
        style={styles.errorContainer}
        accessibilityRole="alert"
      >
        <Ionicons name="alert-circle" size={20} color="#FF3B30" />
        <ThemedText style={styles.errorText}>{message}</ThemedText>
        <TouchableOpacity 
          onPress={refreshProfile}
          accessibilityLabel="새로고침"
          accessibilityHint="프로필 정보를 다시 불러옵니다"
        >
          <Ionicons name="refresh" size={20} color="#007AFF" />
        </TouchableOpacity>
      </ThemedView>
    );
  };

  // 성별 라디오 버튼 렌더링
  const renderGenderRadioButton = (genderOption: Gender) => {
    const isSelected = gender === genderOption;
    
    return (
      <TouchableOpacity 
        key={genderOption}
        style={[
          styles.genderOption,
          isSelected && styles.genderOptionSelected
        ]}
        onPress={() => setGender(genderOption)}
        disabled={saving}
        accessibilityRole="radio"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`성별 ${genderOption} 선택`}
      >
        <View style={styles.radioContainer}>
          <View style={styles.radioOuter}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
          <ThemedText 
            style={[
              styles.genderOptionText,
              isSelected && styles.genderOptionTextSelected
            ]}
          >
            {genderOption}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={goToHome}
            accessibilityLabel="뒤로 가기"
            accessibilityHint="홈 화면으로 돌아갑니다"
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>마이페이지</ThemedText>
          <View style={styles.placeholder}></View>
        </ThemedView>
        
        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <ThemedText style={styles.loadingText}>프로필 정보를 불러오는 중...</ThemedText>
          </ThemedView>
        ) : (
          <>
            {isAuthenticated ? (
              <ThemedView style={styles.profileContent}>
                {/* 닉네임 섹션 */}
                <ThemedView 
                  style={styles.profileSection}
                  accessibilityLabel="닉네임 섹션"
                >
                  <ThemedText style={styles.sectionTitle}>닉네임</ThemedText>
                  
                  {isChangingNickname ? (
                    <ThemedView style={styles.changeContainer}>
                      <ThemedView style={styles.randomNicknameContainer}>
                        <ThemedText style={styles.randomNickname}>
                          {randomNickname || '랜덤 닉네임 생성 버튼을 눌러주세요'}
                        </ThemedText>
                        <TouchableOpacity 
                          style={styles.refreshButton}
                          onPress={generateRandomNickname}
                          disabled={saving}
                          accessibilityLabel="랜덤 닉네임 생성"
                          accessibilityHint="새로운 랜덤 닉네임을 생성합니다"
                        >
                          <Ionicons name="refresh" size={20} color="#007AFF" />
                        </TouchableOpacity>
                      </ThemedView>
                      
                      <ThemedText style={styles.infoText}>
                        * 닉네임은 랜덤으로만 생성할 수 있습니다.
                      </ThemedText>
                      
                      <ThemedView style={styles.buttonContainer}>
                        <StylishButton
                          title="취소"
                          onPress={() => {
                            setIsChangingNickname(false);
                            setRandomNickname('');
                          }}
                          type="secondary"
                          size="small"
                          style={styles.cancelButton}
                        />
                        <StylishButton
                          title="저장"
                          onPress={saveNickname}
                          type="primary"
                          size="small"
                          style={styles.saveButton}
                          loading={saving}
                        />
                      </ThemedView>
                    </ThemedView>
                  ) : (
                    <ThemedView style={styles.infoRow}>
                      <ThemedText style={styles.infoValue}>{nickname}</ThemedText>
                      <TouchableOpacity 
                        style={styles.changeButton}
                        onPress={() => setIsChangingNickname(true)}
                        accessibilityLabel="닉네임 변경"
                        accessibilityHint="닉네임을 변경하기 위한 화면으로 전환합니다"
                      >
                        <ThemedText style={styles.changeButtonText}>변경</ThemedText>
                      </TouchableOpacity>
                    </ThemedView>
                  )}
                </ThemedView>
                
                {/* 성별 섹션 */}
                <ThemedView 
                  style={styles.profileSection}
                  accessibilityLabel="성별 섹션"
                >
                  <ThemedText style={styles.sectionTitle}>성별</ThemedText>
                  
                  {isChangingGender ? (
                    <ThemedView style={styles.changeContainer}>
                      <ThemedView style={styles.genderOptions}>
                        {GENDER_OPTIONS.map(genderOption => renderGenderRadioButton(genderOption))}
                      </ThemedView>
                      
                      <ThemedView style={styles.buttonContainer}>
                        <StylishButton
                          title="취소"
                          onPress={() => setIsChangingGender(false)}
                          type="secondary"
                          size="small"
                          style={styles.cancelButton}
                        />
                        <StylishButton
                          title="저장"
                          onPress={() => {
                            if (gender) {
                              updateGender(gender);
                            } else {
                              Alert.alert(
                                t('common.notice') || '알림',
                                t('profile.selectGenderFirst') || '성별을 선택해주세요.'
                              );
                            }
                          }}
                          type="primary"
                          size="small"
                          style={styles.saveButton}
                          loading={saving}
                        />
                      </ThemedView>
                    </ThemedView>
                  ) : (
                    <ThemedView style={styles.infoRow}>
                      <ThemedText style={styles.infoValue}>{gender || '미설정'}</ThemedText>
                      <TouchableOpacity 
                        style={styles.changeButton}
                        onPress={() => setIsChangingGender(true)}
                        accessibilityLabel="성별 변경"
                        accessibilityHint="성별을 변경하기 위한 화면으로 전환합니다"
                      >
                        <ThemedText style={styles.changeButtonText}>변경</ThemedText>
                      </TouchableOpacity>
                    </ThemedView>
                  )}
                </ThemedView>
                
                <ThemedView style={styles.infoTextContainer}>
                  <ThemedText style={styles.infoText}>
                    정식 서비스에서는 나이, 지역 등 다양한 옵션이 추가될 예정입니다!
                  </ThemedText>
                </ThemedView>
                
                <StylishButton
                  title="로그아웃"
                  onPress={handleLogout}
                  type="danger"
                  style={styles.logoutButton}
                  loading={loading}
                />
              </ThemedView>
            ) : (
              <ThemedView style={styles.loginContainer}>
                <ThemedText style={styles.loginPrompt}>
                  로그인하여 프로필을 관리하세요
                </ThemedText>
                <StylishButton
                  title="로그인"
                  onPress={goToLogin}
                  type="primary"
                  style={styles.loginButton}
                />
              </ThemedView>
            )}
          </>
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
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEEEE',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF3B30',
    marginHorizontal: 8,
  },
  profileContent: {
    padding: 16,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
  },
  changeButton: {
    backgroundColor: '#E8F1FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  changeButtonText: {
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 14,
  },
  changeContainer: {
    marginTop: 8,
  },
  randomNicknameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  randomNickname: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  refreshButton: {
    padding: 8,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  genderOption: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  genderOptionSelected: {
    backgroundColor: '#E8F1FF',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  genderOptionTextSelected: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    width: '100%',
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  logoutButton: {
    marginTop: 32,
  },
  loginContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    height: '80%',
  },
  loginPrompt: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#555555',
  },
  loginButton: {
    width: 200,
  },
  infoTextContainer: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
  },
}); 