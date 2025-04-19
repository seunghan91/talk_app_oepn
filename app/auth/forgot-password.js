import { View, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import axiosInstance from '../lib/axios';
import { formatKoreanPhoneNumber, isValidKoreanPhoneNumber } from '../../utils/phoneUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [step, setStep] = useState(1); // 1: 전화번호 입력, 2: 인증코드 확인, 3: 새 비밀번호 설정

  // 전화번호 유효성 검사 함수
  const validatePhoneNumber = (number) => {
    if (!isValidKoreanPhoneNumber(number)) {
      setPhoneNumberError(t('auth.invalidPhoneNumber') || '유효하지 않은 전화번호 형식입니다. (예: 010-1234-5678)');
      return false;
    }
    
    setPhoneNumberError('');
    return true;
  };

  // 비밀번호 유효성 검사 함수
  const validatePassword = () => {
    if (password.length < 6) {
      setPasswordError(t('auth.passwordTooShort') || '비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }
    
    if (password !== confirmPassword) {
      setPasswordError(t('auth.passwordMismatch') || '비밀번호가 일치하지 않습니다.');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  // 전화번호 입력 처리
  const handlePhoneNumberChange = (number) => {
    const formattedNumber = formatKoreanPhoneNumber(number);
    setPhoneNumber(formattedNumber);
    
    if (phoneNumberError) {
      validatePhoneNumber(formattedNumber);
    }
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
      const digitsOnly = phoneNumber.replace(/\\D/g, '');
      
      const response = await axiosInstance.post('/api/auth/request_code', {
        user: {
          phone_number: digitsOnly
        }
      });
      
      console.log('인증코드 요청 성공:', response.data);
      
      // 가입된 사용자인지 확인
      if (response.data && !response.data.user_exists) {
        // 가입되지 않은 사용자인 경우
        Alert.alert(
          t('auth.userNotExists') || '가입되지 않은 번호',
          t('auth.userNotExistsMessage') || '이 번호로 가입된 계정이 없습니다. 회원가입을 진행하시겠습니까?',
          [
            {
              text: t('auth.cancel') || '취소',
              style: 'cancel'
            },
            {
              text: t('auth.register') || '회원가입',
              onPress: () => router.replace('/auth/register')
            }
          ]
        );
        setIsLoading(false);
        return;
      }
      
      // 서버 응답 확인
      if (response.data && response.data.code) {
        // 테스트 환경에서는 코드를 자동으로 입력 (실제 환경에서는 SMS로 전송)
        setCode(response.data.code);
        
        Alert.alert(
          t('auth.codeSent') || '인증번호 발송',
          t('auth.checkYourPhone') || '휴대폰으로 발송된 인증번호를 입력해주세요.' + 
          (response.data.note ? '\n\n' + response.data.note : '')
        );
        
        // 다음 단계로 이동
        setStep(2);
      } else {
        throw new Error('서버 응답이 올바르지 않습니다.');
      }
    } catch (err) {
      console.log('인증코드 요청 실패:', err.response?.status, err.response?.data, err.message);
      Alert.alert(t('common.error') || '오류', t('auth.requestCodeFailed') || '인증코드 요청에 실패했습니다.');
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
    
    if (!code.trim()) {
      Alert.alert(t('auth.codeRequired') || '인증번호 필요', t('auth.pleaseEnterCode') || '인증번호를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 하이픈 제거한 숫자만 서버로 전송
      const digitsOnly = phoneNumber.replace(/\\D/g, '');
      
      const response = await axiosInstance.post('/api/auth/verify_code', {
        user: {
          phone_number: digitsOnly,
          code: code
        }
      });
      
      console.log('인증코드 검증 성공:', response.data);
      
      if (response.data && response.data.verified) {
        setIsVerified(true);
        // 다음 단계로 이동
        setStep(3);
      } else {
        Alert.alert(t('auth.verificationFailed') || '인증 실패', t('auth.invalidCode') || '유효하지 않은 인증번호입니다.');
      }
    } catch (err) {
      console.log('인증코드 검증 실패:', err.response?.status, err.response?.data, err.message);
      Alert.alert(t('common.error') || '오류', t('auth.verificationFailed') || '인증번호 확인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3) 비밀번호 재설정 (POST /api/auth/reset_password)
  const resetPassword = async () => {
    // 비밀번호 유효성 검사
    if (!validatePassword()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 하이픈 제거한 숫자만 서버로 전송
      const digitsOnly = phoneNumber.replace(/\\D/g, '');
      
      const response = await axiosInstance.post('/api/auth/reset_password', {
        user: {
          phone_number: digitsOnly,
          password: password
        }
      });
      
      console.log('비밀번호 재설정 성공:', response.data);
      
      Alert.alert(
        t('auth.passwordResetSuccess') || '비밀번호 재설정 완료',
        t('auth.passwordResetSuccessMessage') || '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.',
        [
          {
            text: t('auth.goToLogin') || '로그인하기',
            onPress: () => router.replace('/auth/login')
          }
        ]
      );
    } catch (err) {
      console.log('비밀번호 재설정 실패:', err.response?.status, err.response?.data, err.message);
      Alert.alert(t('common.error') || '오류', t('auth.passwordResetFailed') || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인 화면으로 이동
  const goToLogin = () => {
    router.push('/auth/login');
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
            <ThemedText style={styles.title}>
              {step === 1 && (t('auth.forgotPassword') || '비밀번호 찾기')}
              {step === 2 && (t('auth.verifyCode') || '인증번호 확인')}
              {step === 3 && (t('auth.resetPassword') || '새 비밀번호 설정')}
            </ThemedText>
            
            <ThemedView style={styles.formContainer}>
              {step === 1 && (
                <>
                  <ThemedText style={styles.label}>{t('auth.phoneNumber') || '전화번호'}</ThemedText>
                  <TextInput
                    placeholder={t('auth.enterPhoneNumber') || '전화번호를 입력하세요 (예: 010-1234-5678)'}
                    style={[styles.input, phoneNumberError ? styles.inputError : null]}
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    keyboardType="phone-pad"
                    editable={!isLoading}
                  />
                  {phoneNumberError ? (
                    <ThemedText style={styles.errorText}>{phoneNumberError}</ThemedText>
                  ) : null}
                  
                  <StylishButton
                    title={isLoading ? t('auth.processing') || '처리 중...' : t('auth.requestCode') || '인증번호 요청'}
                    onPress={requestCode}
                    disabled={isLoading || !phoneNumber}
                    type="primary"
                    size="medium"
                    style={styles.button}
                  />
                </>
              )}
              
              {step === 2 && (
                <>
                  <ThemedText style={styles.label}>{t('auth.verificationCode') || '인증번호'}</ThemedText>
                  <TextInput
                    placeholder={t('auth.enterVerificationCode') || '인증번호를 입력하세요'}
                    style={styles.input}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    editable={!isLoading}
                  />
                  
                  <StylishButton
                    title={isLoading ? t('auth.processing') || '처리 중...' : t('auth.verifyCode') || '인증번호 확인'}
                    onPress={verifyCode}
                    disabled={isLoading || !code}
                    type="primary"
                    size="medium"
                    style={styles.button}
                  />
                  
                  <StylishButton
                    title={t('auth.resendCode') || '인증번호 재전송'}
                    onPress={requestCode}
                    disabled={isLoading}
                    type="secondary"
                    size="medium"
                    style={styles.button}
                  />
                </>
              )}
              
              {step === 3 && (
                <>
                  <ThemedText style={styles.label}>{t('auth.newPassword') || '새 비밀번호'}</ThemedText>
                  <TextInput
                    placeholder={t('auth.enterNewPassword') || '새 비밀번호를 입력하세요'}
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    editable={!isLoading}
                  />
                  
                  <ThemedText style={styles.label}>{t('auth.confirmPassword') || '비밀번호 확인'}</ThemedText>
                  <TextInput
                    placeholder={t('auth.enterConfirmPassword') || '비밀번호를 다시 입력하세요'}
                    style={[styles.input, passwordError ? styles.inputError : null]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={true}
                    editable={!isLoading}
                  />
                  {passwordError ? (
                    <ThemedText style={styles.errorText}>{passwordError}</ThemedText>
                  ) : null}
                  
                  <StylishButton
                    title={isLoading ? t('auth.processing') || '처리 중...' : t('auth.resetPassword') || '비밀번호 재설정'}
                    onPress={resetPassword}
                    disabled={isLoading || !password || !confirmPassword}
                    type="primary"
                    size="medium"
                    style={styles.button}
                  />
                </>
              )}
              
              {isLoading && (
                <ActivityIndicator 
                  style={styles.loader} 
                  size="large" 
                  color="#007AFF" 
                />
              )}
              
              <ThemedView style={styles.footer}>
                <ThemedText>{t('auth.alreadyHaveAccount') || '이미 계정이 있으신가요?'}</ThemedText>
                <TouchableOpacity onPress={goToLogin}>
                  <ThemedText style={styles.link}>{t('auth.login') || '로그인'}</ThemedText>
                </TouchableOpacity>
              </ThemedView>
              
              <ThemedView style={styles.footer}>
                <ThemedText>{t('auth.dontHaveAccount') || '계정이 없으신가요?'}</ThemedText>
                <TouchableOpacity onPress={goToRegister}>
                  <ThemedText style={styles.link}>{t('auth.register') || '회원가입'}</ThemedText>
                </TouchableOpacity>
              </ThemedView>
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
    marginTop: 15,
    gap: 5,
  },
  link: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
