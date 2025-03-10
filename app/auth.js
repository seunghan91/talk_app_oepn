// app/auth.js

import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Link, useRouter, useLocalSearchParams } from 'expo-router'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import axiosInstance from './lib/axios';  // 주의: 실제 경로를 맞춰야 함 (./lib/axios or ../lib/axios)
import { formatKoreanPhoneNumber, isValidKoreanPhoneNumber } from '../utils/phoneUtils';
import { useAuth } from './context/AuthContext';

export default function AuthScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, login } = useAuth();
  const params = useLocalSearchParams();
  const fromHome = params.fromHome === 'true';

  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [isVerified, setIsVerified] = useState(false); 
  const [userData, setUserData] = useState(null);
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 이미 인증된 사용자는 홈으로 리다이렉트
  // fromHome 파라미터가 true인 경우에는 리다이렉트하지 않음
  useEffect(() => {
    // 홈에서 명시적으로 이동한 경우가 아니라면 인증된 사용자는 홈으로 리다이렉트
    if (isAuthenticated && !fromHome) {
      router.replace('/');
    }
  }, [isAuthenticated, router, fromHome]);

  // 전화번호 유효성 검사 함수
  const validatePhoneNumber = (number) => {
    if (!isValidKoreanPhoneNumber(number)) {
      setPhoneNumberError(t('auth.phoneNumberError'));
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
          phone_number: digitsOnly,
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
      const testCode = serverResponse?.test_code || '123456';
      
      // 항상 테스트 인증번호를 표시 (서버 요청 성공 여부와 관계없이)
      Alert.alert(
        serverError ? t('common.notice') : t('common.success'), 
        `${serverError ? '테스트 모드: 서버 연결 없이 진행합니다.' : t('auth.requestSuccess')}\n\ntest:${testCode}`
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
    
    try {
      // 하이픈 제거한 숫자만 서버로 전송
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      // 테스트 모드에서는 서버 요청을 시도하되, 실패하더라도 테스트 로그인 처리
      let serverResponse = null;
      let serverError = null;
      
      try {
        const res = await axiosInstance.post('/api/auth/verify_code', {
          phone_number: digitsOnly,
          code,
        });
        serverResponse = res.data;
        console.log('인증 완료, 서버 응답:', serverResponse);
      } catch (err) {
        serverError = err;
        console.log('인증코드 검증 실패 (서버):', 
          'Status:', err.response?.status, 
          'Data:', err.response?.data, 
          'Message:', err.message
        );
      }
      
      // 테스트 모드: 서버 응답이 없거나 실패한 경우 테스트 사용자 정보 생성
      const userData = serverResponse?.user || {
        id: 1,
        nickname: '테스트사용자',
        phone_number: digitsOnly,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const token = serverResponse?.token || 'test_token_' + Math.random().toString(36).substring(2);
      
      // AuthContext를 통해 로그인 처리
      await login(token, userData);
      
      // 사용자 정보 저장 및 인증 상태 업데이트
      setIsVerified(true);
      setUserData(userData);
      
      // 인증 성공 메시지와 함께 닉네임 표시
      Alert.alert(
        serverError ? t('common.notice') : t('auth.verifySuccess'), 
        serverError 
          ? `테스트 모드: ${userData.nickname}님으로 로그인되었습니다.` 
          : t('auth.welcome', { nickname: userData.nickname }), 
        [
          { 
            text: t('auth.goToProfile'), 
            onPress: () => router.push('/profile') 
          },
          { 
            text: t('auth.goToHome'), 
            onPress: () => router.push('/') 
          }
        ]
      );
    } catch (err) {
      console.error('예상치 못한 오류:', err);
      Alert.alert(t('common.error'), t('auth.verifyError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.title')}</Text>

      {isVerified ? (
        <View style={styles.verifiedContainer}>
          <Text style={styles.welcomeText}>
            {t('auth.welcome', { nickname: userData?.nickname })}
          </Text>
          <Button 
            title={t('auth.goToProfile')} 
            onPress={() => router.push('/profile')} 
          />
          <Button 
            title={t('auth.goToHome')} 
            onPress={() => router.push('/')} 
          />
        </View>
      ) : (
        <>
          <TextInput
            placeholder={t('auth.phoneNumber')}
            style={[styles.input, phoneNumberError ? styles.inputError : null]}
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            keyboardType="phone-pad"
            maxLength={13} // 하이픈 포함 최대 13자리
          />
          {phoneNumberError ? (
            <Text style={styles.errorText}>{phoneNumberError}</Text>
          ) : null}
          <Button 
            title={isLoading ? t('auth.processing') : t('auth.requestCode')} 
            onPress={requestCode}
            disabled={isLoading || phoneNumberError !== ''} 
          />

          <TextInput
            placeholder={t('auth.verificationCode')}
            style={styles.input}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6} // 인증코드는 보통 6자리
          />
          <Button 
            title={isLoading ? t('auth.processing') : t('auth.verifyCode')} 
            onPress={verifyCode}
            disabled={isLoading || code.length < 4 || phoneNumberError !== ''} 
          />
          
          {isLoading && (
            <ActivityIndicator 
              style={styles.loader} 
              size="large" 
              color="#0000ff" 
            />
          )}
        </>
      )}

      <View style={{ marginTop: 16 }}>
        <Link href="/">{t('auth.goBack')}</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 8,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
  verifiedContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});