import { View, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

import axiosInstance from '../lib/axios';
import { formatKoreanPhoneNumber, isValidKoreanPhoneNumber } from '../../utils/phoneUtils';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, login } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumberError, setPhoneNumberError] = useState('');

  // 이미 인증된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  // 전화번호 유효성 검사 함수
  const validatePhoneNumber = (number) => {
    if (!isValidKoreanPhoneNumber(number)) {
      setPhoneNumberError(t('auth.invalidPhoneNumber') + ' (예: 010-1234-5678)');
      return false;
    }
    
    setPhoneNumberError('');
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

  // 로그인 처리
  const handleLogin = async () => {
    // 전화번호 유효성 검사
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }
    
    // 비밀번호 확인
    if (!password || password.trim().length < 1) {
      Alert.alert('오류', '비밀번호를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 하이픈 제거한 숫자만 서버로 전송
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      // 로그인 요청 데이터 - 서버 기대 형식: {"user":{"phone_number":"01011111111","password":"password"}}
      const loginData = {
        user: {
          phone_number: digitsOnly,
          password: password
        }
      };
      
      console.log('[로그인] 요청 데이터:', JSON.stringify(loginData));
      
      try {
        console.log('[로그인] API 서버에 로그인 요청 시도...');
        console.log('[로그인] 요청 URL:', axiosInstance.defaults.baseURL + '/api/auth/login');
        
        // 요청 직전에 세부 정보 로깅
        console.log('===== 로그인 요청 전체 정보 =====');
        console.log('1. 요청 URL:', axiosInstance.defaults.baseURL + '/api/auth/login');
        console.log('2. 요청 헤더:', JSON.stringify({
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }, null, 2));
        console.log('3. 요청 데이터 JSON 문자열:', JSON.stringify(loginData));
        console.log('4. 요청 데이터 구조 확인:');
        console.log('   - user 객체 포함 여부:', Object.prototype.hasOwnProperty.call(loginData, 'user'));
        console.log('   - user.phone_number 값:', loginData.user?.phone_number);
        console.log('   - user.password 값:', loginData.user?.password ? '[비밀번호 입력됨]' : '[비밀번호 없음]');
        console.log('5. __DEV__ 모드:', __DEV__ ? '활성화' : '비활성화');
        console.log('6. 플랫폼:', Platform.OS);
        console.log('7. 앱 버전:', Constants.expoConfig?.version || '알 수 없음');
        console.log('8. 환경:', __DEV__ ? '개발' : '프로덕션');
        console.log('==============================');
        
        // HTTP 요청 시 명시적으로 content-type 헤더 설정
        const res = await axiosInstance.post('/api/auth/login', loginData, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        console.log('[로그인] 서버 응답 성공, 상태:', res.status);
        console.log('[로그인] 서버 응답 데이터:', JSON.stringify(res.data, null, 2));
        
        const userData = res.data.user;
        const token = res.data.token;
        
        // 로그인 처리
        await login(token, userData);
        
        // 로그인 성공 메시지
        Alert.alert(
          '로그인 성공',
          `${userData.nickname}님, 환영합니다!`,
          [
            { 
              text: '홈으로 이동', 
              onPress: () => router.replace('/') 
            }
          ]
        );
        
        // 알림 후 자동으로 홈 화면으로 이동
        setTimeout(() => {
          router.replace('/');
        }, 500);
        
      } catch (err) {
        console.log('[로그인] API 서버 오류 발생');
        console.log('상태 코드:', err.response?.status);
        console.log('오류 응답:', JSON.stringify(err.response?.data, null, 2));
        console.log('오류 메시지:', err.message);
        
        // 상세 오류 정보 로깅
        if (err.response) {
          console.log('헤더:', JSON.stringify(err.response.headers, null, 2));
          console.log('요청 구성:', JSON.stringify(err.config, null, 2));
          
          // 원시 응답 데이터 확인 시도
          try {
            console.log('===== 원시 응답 데이터 분석 =====');
            if (err.response.request?._response) {
              console.log('원시 응답 문자열:', err.response.request._response);
              try {
                const parsed = JSON.parse(err.response.request._response);
                console.log('원시 응답 파싱 성공:', JSON.stringify(parsed, null, 2));
              } catch (e) {
                console.log('원시 응답 JSON 파싱 실패, HTML일 가능성 있음');
              }
            } else {
              console.log('원시 응답 데이터 없음');
            }
            console.log('==============================');
          } catch (parseError) {
            console.log('원시 응답 확인 중 오류:', parseError);
          }
        }
        
        // API 서버 응답 확인
        if (err.response?.status === 401) {
          Alert.alert('오류', '전화번호 또는 비밀번호가 올바르지 않습니다.');
        } else if (err.response?.status === 400) {
          // 서버 오류 메시지 확인
          let errorMessage = '요청 형식이 잘못되었습니다. 개발자에게 문의하세요.';
          if (err.response?.data?.error) {
            errorMessage = `오류: ${err.response.data.error}`;
          } else if (err.response?.data?.errors) {
            const errors = err.response.data.errors;
            errorMessage = Object.keys(errors)
              .map(key => `${key}: ${errors[key].join(', ')}`)
              .join('\n');
          }
          Alert.alert('요청 오류', errorMessage);
        } else {
          Alert.alert('오류', `서버 연결 오류: ${err.message}`);
        }
        
        // 테스트 계정 로그인 시도 (개발 환경에서만)
        if (__DEV__) {
          console.log('[로그인] 개발 환경에서 테스트 계정 시도');
          
          // 테스트 환경에서는 특정 전화번호와 비밀번호 조합으로 로그인 허용
          if ((digitsOnly === '01011111111' && password === 'password') || 
              (digitsOnly === '01022222222' && password === 'password') ||
              (digitsOnly === '01033333333' && password === 'password') ||
              (digitsOnly === '01044444444' && password === 'password') ||
              (digitsOnly === '01055555555' && password === 'password')) {
              
            console.log('[로그인] 테스트 계정으로 로그인 성공');
            
            // 테스트 계정 정보 매핑
            const testAccounts = {
              '01011111111': { id: 1, nickname: 'A - 김철수', gender: 'male' },
              '01022222222': { id: 2, nickname: 'B - 이영희', gender: 'female' },
              '01033333333': { id: 3, nickname: 'C - 박지민', gender: 'male' },
              '01044444444': { id: 4, nickname: 'D - 최수진', gender: 'female' },
              '01055555555': { id: 5, nickname: 'E - 정민준', gender: 'male' }
            };
            
            const accountInfo = testAccounts[digitsOnly];
            
            const userData = {
              id: accountInfo.id,
              nickname: accountInfo.nickname,
              gender: accountInfo.gender,
              phone_number: digitsOnly,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const token = 'test_token_' + Math.random().toString(36).substring(2);
            
            // 로그인 처리
            await login(token, userData);
            
            // 로그인 성공 메시지
            Alert.alert(
              '테스트 로그인 성공',
              `${userData.nickname}님, 환영합니다! (테스트 모드)`,
              [
                { 
                  text: '홈으로 이동', 
                  onPress: () => router.replace('/') 
                }
              ]
            );
            
            // 알림 후 자동으로 홈 화면으로 이동
            setTimeout(() => {
              router.replace('/');
            }, 500);
          } else {
            console.log('[로그인] 테스트 계정 정보가 일치하지 않음');
            Alert.alert('테스트 계정 오류', '테스트 계정 정보가 일치하지 않습니다. 제공된 테스트 계정 정보를 사용해주세요.');
          }
        }
      }
    } catch (err) {
      console.error('[로그인] 예상치 못한 오류:', err);
      Alert.alert('오류', '로그인 처리 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 화면으로 이동
  const goToRegister = () => {
    router.push('/auth/register');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <ThemedView style={styles.container}>
            <ThemedView style={styles.formContainer}>
              <ThemedText style={styles.title}>로그인</ThemedText>
              
              {/* 테스트 계정 정보 표시 */}
              <ThemedView style={styles.testAccountsContainer}>
                <ThemedText style={styles.testAccountsTitle}>베타 테스트 계정</ThemedText>
                <ThemedText style={styles.testAccountDesc}>아래 버튼을 클릭하면 자동으로 정보가 입력됩니다</ThemedText>
                
                <TouchableOpacity 
                  style={styles.testAccountButton}
                  onPress={() => {
                    setPhoneNumber('010-1111-1111');
                    setPassword('password');
                  }}
                >
                  <ThemedText style={styles.testAccountButtonText}>사용자 A (김철수)</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.testAccountButton}
                  onPress={() => {
                    setPhoneNumber('010-2222-2222');
                    setPassword('password');
                  }}
                >
                  <ThemedText style={styles.testAccountButtonText}>사용자 B (이영희)</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.testAccountButton}
                  onPress={() => {
                    setPhoneNumber('010-3333-3333');
                    setPassword('password');
                  }}
                >
                  <ThemedText style={styles.testAccountButtonText}>사용자 C (박지민)</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.testAccountButton}
                  onPress={() => {
                    setPhoneNumber('010-4444-4444');
                    setPassword('password');
                  }}
                >
                  <ThemedText style={styles.testAccountButtonText}>사용자 D (최수진)</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.testAccountButton}
                  onPress={() => {
                    setPhoneNumber('010-5555-5555');
                    setPassword('password');
                  }}
                >
                  <ThemedText style={styles.testAccountButtonText}>사용자 E (정민준)</ThemedText>
                </TouchableOpacity>
              </ThemedView>
              
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
              
              <ThemedText style={styles.label}>{t('auth.password')}</ThemedText>
              <TextInput
                placeholder={t('auth.enterPassword')}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
              
              <StylishButton
                title={isLoading ? t('common.processing') : t('auth.login')}
                onPress={handleLogin}
                disabled={isLoading || phoneNumberError !== ''} 
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
            
            <ThemedView style={styles.footer}>
              <ThemedText>{t('auth.noAccount')}</ThemedText>
              <TouchableOpacity onPress={goToRegister}>
                <ThemedText style={styles.link}>{t('auth.register')}</ThemedText>
              </TouchableOpacity>
            </ThemedView>
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
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  testAccountsContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  testAccountsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  testAccountDesc: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
  },
  testAccountButton: {
    padding: 12,
    backgroundColor: '#E8F4FF',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDE0FE',
  },
  testAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0070C0',
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
  button: {
    marginTop: 10,
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
}); 