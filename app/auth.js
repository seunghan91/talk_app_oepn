// app/auth.js

import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import React, { useState } from 'react';
import { Link, useRouter } from 'expo-router'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

import axiosInstance from './lib/axios';  // 주의: 실제 경로를 맞춰야 함 (./lib/axios or ../lib/axios)

export default function AuthScreen() {
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [isVerified, setIsVerified] = useState(false); 
  const [userData, setUserData] = useState(null);
  const [phoneNumberError, setPhoneNumberError] = useState('');

  // 전화번호 유효성 검사 함수
  const validatePhoneNumber = (number) => {
    // 숫자만 추출 (하이픈 제거)
    const digitsOnly = number.replace(/\D/g, '');
    
    // 한국 휴대전화 번호 패턴 검사 (010, 011, 016, 017, 018, 019로 시작하는 10-11자리)
    const koreanPhonePattern = /^01[0-9]{8,9}$/;
    
    if (!koreanPhonePattern.test(digitsOnly)) {
      setPhoneNumberError('유효한 휴대전화 번호를 입력해주세요 (01X-XXXX-XXXX)');
      return false;
    }
    
    setPhoneNumberError('');
    return true;
  };

  // 전화번호 입력 처리
  const handlePhoneNumberChange = (number) => {
    // 숫자와 하이픈만 허용
    const formattedNumber = number.replace(/[^\d-]/g, '');
    setPhoneNumber(formattedNumber);
    validatePhoneNumber(formattedNumber);
  };

  // 1) 인증코드 요청 (POST /auth/request_code)
  const requestCode = async () => {
    // 전화번호 유효성 검사
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }
    
    try {
      // 하이픈 제거한 숫자만 서버로 전송
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      const res = await axiosInstance.post('/api/auth/request_code', {
        phone_number: digitsOnly,
      });
      console.log('인증코드 요청 성공:', res.data);
      Alert.alert('성공', '인증코드가 발송되었습니다.');
    } catch (err) {
      console.log('인증코드 요청 실패:', 
        'Status:', err.response?.status, 
        'Data:', err.response?.data, 
        'Message:', err.message
      );
      Alert.alert('오류', '인증코드 요청에 실패했습니다.');
    }
  };

  // 2) 인증코드 검증 (POST /auth/verify_code)
  const verifyCode = async () => {
    // 전화번호 유효성 검사
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }
    
    try {
      // 하이픈 제거한 숫자만 서버로 전송
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      const res = await axiosInstance.post('/api/auth/verify_code', {
        phone_number: digitsOnly,
        code,
      });
      // { token, user, ... } 라고 가정
      const { token, user } = res.data;

      // AsyncStorage에 JWT 저장
      await AsyncStorage.setItem('jwt_token', token);

      console.log('인증 완료, 사용자 정보:', user);
      
      // 사용자 정보 저장 및 인증 상태 업데이트
      setIsVerified(true);
      setUserData(user);
      
      // 인증 성공 메시지와 함께 닉네임 표시
      Alert.alert(
        '인증 완료', 
        `환영합니다, ${user.nickname}님!`, 
        [
          { 
            text: '프로필로 이동', 
            onPress: () => router.push('/profile') 
          },
          { 
            text: '홈으로 이동', 
            onPress: () => router.push('/') 
          }
        ]
      );
    } catch (err) {
      console.log('인증코드 검증 실패:', err.response?.data);
      Alert.alert('오류', '인증코드 검증에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>전화번호 인증</Text>

      {isVerified ? (
        <View style={styles.verifiedContainer}>
          <Text style={styles.welcomeText}>
            환영합니다, {userData?.nickname}님!
          </Text>
          <Button 
            title="프로필로 이동" 
            onPress={() => router.push('/profile')} 
          />
          <Button 
            title="홈으로 이동" 
            onPress={() => router.push('/')} 
          />
        </View>
      ) : (
        <>
          <TextInput
            placeholder="전화번호 (01X-XXXX-XXXX)"
            style={[styles.input, phoneNumberError ? styles.inputError : null]}
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            keyboardType="phone-pad"
            maxLength={13} // 하이픈 포함 최대 13자리
          />
          {phoneNumberError ? (
            <Text style={styles.errorText}>{phoneNumberError}</Text>
          ) : null}
          <Button title="인증코드 요청" onPress={requestCode} />

          <TextInput
            placeholder="인증코드"
            style={styles.input}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6} // 인증코드는 보통 6자리
          />
          <Button title="인증코드 검증" onPress={verifyCode} />
        </>
      )}

      <View style={{ marginTop: 16 }}>
        <Link href="/">홈으로 돌아가기</Link>
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
});