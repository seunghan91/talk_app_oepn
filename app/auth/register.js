import { View, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import axiosInstance from '../lib/axios';
import { formatKoreanPhoneNumber, isValidKoreanPhoneNumber } from '../../utils/phoneUtils';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, login } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [userData, setUserData] = useState(null);
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGenderSelection, setShowGenderSelection] = useState(false);
  const [selectedGender, setSelectedGender] = useState('unspecified');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [randomNickname, setRandomNickname] = useState('');

  // 이미 인증된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  // 랜덤 닉네임 생성 함수 - 서버와 동일한 로직 사용
  const generateRandomNickname = () => {
    // 서버와 동일한 단어 목록 사용
    const firstWords = [
      '행복한', '즐거운', '신나는', '귀여운', '멋진', '화려한', '웃는', '매력적인', '활기찬',
      '따뜻한', '명랑한', '기분좋은', '환상적인', '영리한', '엉뚱한', '재미있는', '사랑스러운',
      '용감한', '똑똑한', '부지런한', '늠름한', '훌륭한', '소중한', '깜찍한', '상냥한', '푸른'
    ];
    
    const secondWords = [
      '토끼', '호랑이', '강아지', '고양이', '코끼리', '사자', '표범', '판다', '여우', '늑대',
      '곰', '기린', '하마', '앵무새', '코알라', '펭귄', '거북이', '원숭이', '너구리', '다람쥐',
      '독수리', '공룡', '해달', '물개', '얼룩말', '꽃사슴', '악어', '고래', '상어', '돌고래'
    ];
    
    const thirdWords = [
      '친구', '천사', '요정', '꿈나무', '마법사', '용사', '영웅', '기사', '왕자', '공주',
      '대장', '선생님', '박사', '대표', '가수', '우주인', '요리사', '화가', '감독', '작가'
    ];
    
    // 서버와 동일한 확률로 2단어 또는 3단어 조합 생성
    const useThreeWords = Math.random() < 0.3;
    
    const firstWord = firstWords[Math.floor(Math.random() * firstWords.length)];
    const secondWord = secondWords[Math.floor(Math.random() * secondWords.length)];
    
    if (useThreeWords) {
      const thirdWord = thirdWords[Math.floor(Math.random() * thirdWords.length)];
      return `${firstWord}${secondWord}${thirdWord}`;
    } else {
      return `${firstWord}${secondWord}`;
    }
  };

  // 전화번호 유효성 검사 함수
  const validatePhoneNumber = (number) => {
    if (!isValidKoreanPhoneNumber(number)) {
      setPhoneNumberError(t('auth.invalidPhoneNumber') + ' (예: 010-1234-5678)');
      return false;
    }
    
    setPhoneNumberError('');
    return true;
  };

  // 비밀번호 유효성 검사 함수
  const validatePassword = () => {
    if (password.length < 6) {
      setPasswordError(t('auth.passwordTooShort'));
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError(t('auth.passwordMismatch'));
      return false;
    }
    setPasswordError('');
    return true;
  };

  // 전화번호 입력 처리
  const handlePhoneNumberChange = (number) => {
    // 숫자와 하이픈만 허용
    const formattedNumber = number.replace(/[^\d-]/g, '');
    // 자동 포맷팅 적용
    const formattedPhoneNumber = formatKoreanPhoneNumber(formattedNumber);
    setPhoneNumber(formattedPhoneNumber);
    validatePhoneNumber(formattedPhoneNumber);
  };

  // 1) 인증코드 요청 (POST /auth/request_code)
  const requestCode = async () => {
    // 전화번호 유효성 검사
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 하이픈 제거한 숫자만 서버로 전송
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      // 테스트 모드에서는 서버 요청을 시도하되, 실패하더라도 테스트 인증번호를 표시
      let serverResponse = null;
      let serverError = null;
      
      try {
        const res = await axiosInstance.post('/api/auth/request_code', {
          user: {
            phone_number: digitsOnly,
          }
        });
        serverResponse = res.data;
        console.log('인증코드 요청 성공:', serverResponse);
      } catch (err) {
        serverError = err;
        console.log('인증코드 요청 실패:', 
          'Status:', err.response?.status, 
          'Data:', err.response?.data, 
          'Message:', err.message
        );
      }
      
      // 테스트용 인증번호 생성 (실제 서버 응답에서 가져오거나 테스트용 고정값 사용)
      const testCode = serverResponse?.code || '123456';
      
      // 항상 테스트 인증번호를 표시 (서버 요청 성공 여부와 관계없이)
      Alert.alert(
        serverError ? t('common.notice') : t('common.success'), 
        `${serverError ? '테스트 모드: 서버 연결 없이 진행합니다.' : t('auth.requestSuccess')}\n\n테스트 인증번호: ${testCode}\n\n또는 고정 코드 '1111111'을 사용할 수 있습니다.`
      );
      
      // 테스트 모드에서는 자동으로 인증번호 입력
      setCode(testCode);
      
    } catch (err) {
      console.error('예상치 못한 오류:', err);
      Alert.alert(t('common.error'), t('auth.requestError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 2) 인증코드 검증 (POST /auth/verify_code)
  const verifyCode = async () => {
    // 전화번호 유효성 검사
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }
    
    setIsLoading(true);
    
    // 개발 모드이고 코드가 '111111'인 경우 서버 인증을 시도하거나 로컬 인증 처리
    if (__DEV__ && code === '111111') {
      console.log('[테스트 모드] 고정 테스트 인증 코드 111111 사용하여 인증 시도');
      
      // 하이픈 제거한 숫자만 서버로 전송
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      // 서버 검증 먼저 시도
      try {
        const res = await axiosInstance.post('/api/auth/verify_code', {
          user: {
            phone_number: digitsOnly,
            code: '111111',
          }
        });
        
        console.log('인증 완료, 서버 응답:', res.data);
        
        // 서버 응답 데이터 활용
        setIsVerified(true);
        setShowGenderSelection(true);
        
        // 서버에서 받은 닉네임 또는 새로 생성
        const nickname = res.data?.user?.nickname || generateRandomNickname();
        setRandomNickname(nickname);
        
        // 사용자 정보 설정
        setUserData({
          nickname: nickname,
          phone_number: digitsOnly,
        });
        
        Alert.alert(
          t('common.success'),
          t('auth.verificationSuccess') + '\n\n' + t('auth.autoGeneratedNickname') + '\n\n' + nickname + '\n\n' + t('auth.nicknameNotice')
        );
        
        setIsLoading(false);
        return;
      } catch (err) {
        console.log('서버 인증 실패, 로컬 처리로 진행:', err.message);
        
        // 서버 요청이 실패했을 경우 로컬 처리
        setIsVerified(true);
        setShowGenderSelection(true);
        
        // 랜덤 닉네임 생성
        const nickname = generateRandomNickname();
        setRandomNickname(nickname);
        
        // 사용자 정보 설정
        setUserData({
          nickname: nickname,
          phone_number: digitsOnly,
        });
        
        Alert.alert(
          t('common.notice'),
          '테스트 모드: 서버 연결 실패\n테스트 코드로 인증되었습니다.\n\n' + t('auth.autoGeneratedNickname') + '\n\n' + nickname + '\n\n' + t('auth.nicknameNotice')
        );
        
        setIsLoading(false);
        return; // 다른 서버 검증 건너뛰기
      }
    }
    
    try {
      // 하이픈 제거한 숫자만 서버로 전송
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      // 테스트 모드에서는 서버 요청을 시도하되, 실패하더라도 진행
      let serverResponse = null;
      try {
        const res = await axiosInstance.post('/api/auth/verify_code', {
          user: {
            phone_number: digitsOnly,
            code,
          }
        });
        serverResponse = res.data;
        console.log('인증 완료, 서버 응답:', res.data);
      } catch (err) {
        console.log('인증코드 검증 실패 (서버):', 
          'Status:', err.response?.status, 
          'Data:', err.response?.data, 
          'Message:', err.message
        );
        
        // 개발 모드에서는 오류 발생 시에도 다음 단계로 넘어갈 수 있도록 처리
        if (__DEV__) {
          console.log('서버 인증 실패 (개발 모드), 다음 단계 진행');
          serverResponse = null;
        } else {
          const errorMessage = err.response?.data?.error || t('auth.verificationFailed');
          Alert.alert(t('common.error'), errorMessage);
          setIsLoading(false);
          return;
        }
      }
      
      // 인증 완료 후 성별 선택 단계로 이동
      setIsVerified(true);
      setShowGenderSelection(true);
      
      // 서버에서 받은 닉네임이 있으면 사용, 없으면 클라이언트에서 생성
      let nickname = '';
      if (serverResponse && serverResponse.user && serverResponse.user.nickname) {
        nickname = serverResponse.user.nickname;
      } else {
        nickname = generateRandomNickname();
      }
      
      setRandomNickname(nickname);
      
      // 사용자 정보 설정
      setUserData({
        nickname: nickname,
        phone_number: digitsOnly,
      });
      
      // 랜덤 닉네임 생성 알림
      Alert.alert(
        t('common.notice'),
        t('auth.autoGeneratedNickname') + '\n\n' + nickname + '\n\n' + t('auth.nicknameNotice')
      );
      
    } catch (err) {
      console.error('예상치 못한 오류:', err);
      Alert.alert(t('common.error'), t('auth.verificationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 4) 회원가입 완료 (POST /auth/register)
  const completeRegistration = async () => {
    // 비밀번호 유효성 검사
    if (!validatePassword()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 하이픈 제거한 숫자만 서버로 전송
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      // 회원가입 요청 데이터 (서버 기대 형식으로 수정)
      const registerData = {
        user: {
          phone_number: digitsOnly,
          password: password,
          gender: selectedGender,
          nickname: randomNickname
        }
      };
      
      console.log('[회원가입] 요청 데이터:', registerData);
      
      // 테스트 모드에서는 서버 요청을 시도하되, 실패하더라도 테스트 응답 생성
      let serverResponse = null;
      let serverError = null;
      
      try {
        const res = await axiosInstance.post('/api/auth/register', registerData);
        serverResponse = res.data;
        console.log('[회원가입] 서버 응답 성공:', serverResponse);
      } catch (err) {
        serverError = err;
        console.log('[회원가입] 서버 오류:', 
          'Status:', err.response?.status, 
          'Data:', err.response?.data, 
          'Message:', err.message
        );
        
        // 자세한 오류 메시지 출력
        if (err.response?.data) {
          console.log('서버 오류 메시지:', JSON.stringify(err.response.data, null, 2));
          
          // 이미 등록된.사용자 오류 처리 (500 Internal Server Error)
          if (err.response.status === 500 && 
              err.response.data.error && 
              err.response.data.error.includes('User has already been taken')) {
            Alert.alert(
              '계정 중복',
              '이미 등록된 전화번호입니다. 다른 번호를 사용하거나 로그인해 주세요.',
              [
                { text: '확인', onPress: () => setIsLoading(false) }
              ]
            );
            return;
          }
        }
      }
      
      // 서버 응답이 있는 경우에만 로그인 처리
      if (serverResponse && serverResponse.token && serverResponse.user) {
        // 로그인 처리
        await login(serverResponse.token, serverResponse.user);
        
        // 회원가입 성공 메시지
        Alert.alert(
          t('auth.registerSuccess'),
          t('auth.welcome') + ', ' + serverResponse.user.nickname + '님!',
          [
            { 
              text: t('auth.goToHome'), 
              onPress: () => router.replace('/') 
            }
          ]
        );
      } else {
        throw new Error('서버 응답이 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('예상치 못한 오류:', err);
      Alert.alert(t('common.error'), t('auth.registerFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인 화면으로 이동
  const goToLogin = () => {
    router.push('/auth/login');
  };

  // 성별 선택 처리
  const selectGender = (gender) => {
    console.log('성별 선택:', gender);
    setSelectedGender(gender);
    
    // 선택된 성별 로깅
    if (gender === 'unspecified') {
      console.log('성별 선택 안함 선택됨');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>
              {isVerified ? t('auth.additionalInfo') : t('auth.register')}
            </ThemedText>
            
            {!isVerified ? (
              <ThemedView style={styles.formContainer}>
                <ThemedText style={styles.label}>{t('auth.phoneNumber')}</ThemedText>
                <TextInput
                  placeholder={t('auth.enterPhoneNumber')}
                  style={[styles.input, phoneNumberError ? styles.inputError : null]}
                  value={phoneNumber}
                  onChangeText={handlePhoneNumberChange}
                  keyboardType="phone-pad"
                  maxLength={13} // 하이픈 포함 최대 13자리
                />
                {phoneNumberError ? (
                  <ThemedText style={styles.errorText}>{phoneNumberError}</ThemedText>
                ) : null}
                
                <StylishButton
                  title={isLoading && !code ? t('auth.processing') : t('auth.requestCode')}
                  onPress={requestCode}
                  disabled={isLoading || phoneNumberError !== ''} 
                  type="primary"
                  size="medium"
                  style={styles.button}
                />

                <ThemedText style={styles.label}>{t('auth.verificationCode')}</ThemedText>
                <TextInput
                  placeholder={t('auth.enterVerificationCode')}
                  style={styles.input}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                
                <StylishButton
                  title={isLoading && code ? t('auth.processing') : t('auth.verifyCode')}
                  onPress={verifyCode}
                  disabled={isLoading || !code || code.length < 6} 
                  type="primary"
                  size="medium"
                  style={styles.button}
                />
                
                {isLoading && (
                  <ActivityIndicator 
                    style={styles.loader} 
                    size="large" 
                    color="#007AFF" 
                  />
                )}
                
                <ThemedView style={styles.footer}>
                  <ThemedText>{t('auth.haveAccount')}</ThemedText>
                  <TouchableOpacity onPress={goToLogin}>
                    <ThemedText style={styles.link}>{t('auth.login')}</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            ) : (
              <ThemedView style={styles.formContainer}>
                <ThemedText style={styles.label}>{t('auth.nickname')}</ThemedText>
                <TextInput
                  placeholder={t('auth.enterNickname')}
                  style={styles.input}
                  value={randomNickname}
                  onChangeText={setRandomNickname}
                  editable={false} // 닉네임은 자동 생성되므로 편집 불가
                />
                <ThemedText style={styles.infoText}>{t('auth.nicknameNotice')}</ThemedText>
                
                <ThemedText style={styles.label}>{t('auth.gender')}</ThemedText>
                <ThemedView style={styles.genderContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.genderOption, 
                      selectedGender === 'male' && styles.selectedGender
                    ]}
                    onPress={() => selectGender('male')}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="male" 
                      size={24} 
                      color={selectedGender === 'male' ? '#007AFF' : '#666'} 
                    />
                    <ThemedText 
                      style={[
                        styles.genderText, 
                        selectedGender === 'male' && styles.selectedGenderText
                      ]}
                    >
                      {t('auth.male')}
                    </ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.genderOption, 
                      selectedGender === 'female' && styles.selectedGender
                    ]}
                    onPress={() => selectGender('female')}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="female" 
                      size={24} 
                      color={selectedGender === 'female' ? '#FF2D55' : '#666'} 
                    />
                    <ThemedText 
                      style={[
                        styles.genderText, 
                        selectedGender === 'female' && styles.selectedGenderText
                      ]}
                    >
                      {t('auth.female')}
                    </ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.genderOption, 
                      selectedGender === 'unspecified' && styles.selectedGender
                    ]}
                    onPress={() => selectGender('unspecified')}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="person" 
                      size={24} 
                      color={selectedGender === 'unspecified' ? '#8E8E93' : '#666'} 
                    />
                    <ThemedText 
                      style={[
                        styles.genderText, 
                        selectedGender === 'unspecified' && styles.selectedGenderText
                      ]}
                    >
                      {t('auth.unspecified')}
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
                <ThemedText style={styles.infoText}>
                  성별을 선택하지 않으면 '선택 안함'으로 설정됩니다.
                </ThemedText>
                
                <ThemedText style={styles.label}>{t('auth.password')}</ThemedText>
                <TextInput
                  placeholder={t('auth.enterPassword')}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                />
                
                <ThemedText style={styles.label}>{t('auth.confirmPassword')}</ThemedText>
                <TextInput
                  placeholder={t('auth.enterConfirmPassword')}
                  style={[styles.input, passwordError ? styles.inputError : null]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={true}
                />
                {passwordError ? (
                  <ThemedText style={styles.errorText}>{passwordError}</ThemedText>
                ) : null}
                
                <StylishButton
                  title={isLoading ? t('auth.processing') : t('auth.completeRegistration')}
                  onPress={completeRegistration}
                  disabled={isLoading || !password || !confirmPassword} 
                  type="primary"
                  size="medium"
                  style={styles.button}
                />
                
                {isLoading && (
                  <ActivityIndicator 
                    style={styles.loader} 
                    size="large" 
                    color="#007AFF" 
                  />
                )}
              </ThemedView>
            )}
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 30,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  infoText: {
    color: '#666',
    marginBottom: 15,
    fontSize: 14,
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    gap: 5,
  },
  link: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  genderOption: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  selectedGender: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  genderText: {
    marginTop: 5,
    color: '#666',
  },
  selectedGenderText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
}); 