import { View, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
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
      
      console.log('로그인 요청 데이터:', loginData);
      
      // 테스트 모드에서는 서버 요청을 시도하되, 실패하더라도 테스트 로그인 처리
      let serverResponse = null;
      let serverError = null;
      
      try {
        const res = await axiosInstance.post('/api/auth/login', loginData);
        serverResponse = res.data;
        console.log('로그인 성공, 서버 응답:', serverResponse);
      } catch (err) {
        serverError = err;
        console.log('로그인 실패 (서버):', 
          'Status:', err.response?.status, 
          'Data:', err.response?.data, 
          'Message:', err.message
        );
        
        // 실제 서버 응답에서 오류 메시지 표시
        if (err.response?.status === 401) {
          Alert.alert('오류', '전화번호 또는 비밀번호가 올바르지 않습니다.');
          setIsLoading(false);
          return;
        }
      }
      
      // 서버 응답이 없거나 실패한 경우 테스트 데이터 사용 (개발 환경에서만)
      if (serverError && __DEV__) {
        console.log('개발 환경에서 테스트 로그인 처리');
        
        // 테스트 환경에서는 특정 전화번호와 비밀번호 조합으로 로그인 허용
        if (digitsOnly === '01012345678' && password === 'password') {
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
            '로그인 성공',
            `${userData.nickname}님, 환영합니다!`,
            [
              { 
                text: '홈으로 이동', 
                onPress: () => router.replace('/') 
              }
            ]
          );
        } else {
          Alert.alert('오류', '로그인에 실패했습니다. 다시 시도해주세요.');
        }
      } else if (serverResponse) {
        // 서버 응답이 있으면 그 데이터로 로그인 처리
        const userData = serverResponse.user;
        const token = serverResponse.token;
        
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
      }
    } catch (err) {
      console.error('예상치 못한 오류:', err);
      Alert.alert('오류', '로그인에 실패했습니다. 다시 시도해주세요.');
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
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>로그인</ThemedText>
        
        <ThemedView style={styles.formContainer}>
          <ThemedText style={styles.label}>전화번호</ThemedText>
          <TextInput
            placeholder="전화번호를 입력하세요"
            style={[styles.input, phoneNumberError ? styles.inputError : null]}
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            keyboardType="phone-pad"
            maxLength={13} // 하이픈 포함 최대 13자리
          />
          {phoneNumberError ? (
            <ThemedText style={styles.errorText}>{phoneNumberError}</ThemedText>
          ) : null}
          
          <ThemedText style={styles.label}>비밀번호</ThemedText>
          <TextInput
            placeholder="비밀번호를 입력하세요"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
          />
          
          <StylishButton
            title={isLoading ? "처리 중..." : "로그인"}
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
          <ThemedText style={styles.footerText}>
            계정이 없으신가요?
          </ThemedText>
          <TouchableOpacity onPress={goToRegister}>
            <ThemedText style={styles.registerLink}>
              회원가입
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 30,
    marginTop: 20,
    textAlign: 'center',
  },
  formContainer: {
    width: '90%',
    alignItems: 'stretch',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    marginLeft: 4,
  },
  button: {
    marginBottom: 24,
  },
  loader: {
    marginTop: 20,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 40,
  },
  footerText: {
    fontSize: 16,
  },
  registerLink: {
    fontSize: 16,
    marginLeft: 8,
    color: '#007AFF',
  }
}); 