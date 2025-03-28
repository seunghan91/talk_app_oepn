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
      
      // 로그인 요청 데이터
      const loginData = {
        phone_number: digitsOnly,
        password: password
      };
      
      console.log('[로그인] 요청 데이터:', loginData);
      
      try {
        console.log('[로그인] API 서버에 로그인 요청 시도...');
        const res = await axiosInstance.post('/api/auth/login', loginData);
        console.log('[로그인] 서버 응답 성공:', res.data);
        
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
        console.log('[로그인] API 서버 오류:', 
          'Status:', err.response?.status, 
          'Data:', err.response?.data, 
          'Message:', err.message
        );
        
        // API 서버 응답 확인
        if (err.response?.status === 401) {
          Alert.alert('오류', '전화번호 또는 비밀번호가 올바르지 않습니다.');
        } else {
          Alert.alert('오류', `서버 연결 오류: ${err.message}`);
        }
        
        // 테스트 계정 로그인 시도 (개발 환경에서만)
        if (__DEV__) {
          console.log('[로그인] 개발 환경에서 테스트 계정 시도');
          
          // 테스트 환경에서는 특정 전화번호와 비밀번호 조합으로 로그인 허용
          if (digitsOnly === '01012345678' && password === 'password') {
            console.log('[로그인] 테스트 계정으로 로그인 성공');
            
            const userData = {
              id: 1,
              nickname: '테스트사용자',
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