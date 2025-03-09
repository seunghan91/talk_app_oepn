import { View, StyleSheet, Button, TextInput, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../lib/axios';
import { ThemedView, ThemedText } from '../../components/ThemedView';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changingNickname, setChangingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  // 사용자 정보 로드
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('jwt_token');
        if (!token) {
          router.replace('/auth');
          return;
        }

        // 토큰이 있으면 사용자 정보 요청
        const res = await axiosInstance.get('/api/me');
        setUser(res.data.user);
      } catch (err) {
        console.log('사용자 정보 로드 실패:', err.response?.data || err.message);
        Alert.alert('오류', '사용자 정보를 불러오는데 실패했습니다.');
        // 인증 오류인 경우 로그인 화면으로
        if (err.response?.status === 401) {
          await AsyncStorage.removeItem('jwt_token');
          router.replace('/auth');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // 랜덤 닉네임 생성
  const generateRandomNickname = async () => {
    try {
      const res = await axiosInstance.get('/api/generate_random_nickname');
      setNewNickname(res.data.nickname);
    } catch (err) {
      console.log('랜덤 닉네임 생성 실패:', err.response?.data);
      Alert.alert('오류', '랜덤 닉네임을 생성하는데 실패했습니다.');
    }
  };

  // 닉네임 변경 (실제 서비스에서는 결제 후 가능)
  const changeNickname = async () => {
    try {
      const res = await axiosInstance.post('/api/change_nickname', {
        nickname: newNickname
      });
      
      // 사용자 정보 업데이트
      setUser({ ...user, nickname: res.data.user.nickname });
      setChangingNickname(false);
      Alert.alert('성공', '닉네임이 변경되었습니다.');
    } catch (err) {
      console.log('닉네임 변경 실패:', err.response?.data);
      Alert.alert('오류', '닉네임 변경에 실패했습니다.');
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    await AsyncStorage.removeItem('jwt_token');
    router.replace('/auth');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">프로필</ThemedText>
      
      {loading ? (
        <ThemedText>로딩 중...</ThemedText>
      ) : user ? (
        <ThemedView style={styles.profileInfo}>
          <ThemedView style={styles.stepContainer}>
            <ThemedText type="subtitle">전화번호</ThemedText>
            <ThemedText>{user.phone_number}</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.stepContainer}>
            <ThemedText type="subtitle">닉네임</ThemedText>
            {changingNickname ? (
              <ThemedView style={styles.nicknameEditContainer}>
                <TextInput
                  style={styles.input}
                  value={newNickname}
                  onChangeText={setNewNickname}
                />
                
                <TouchableOpacity 
                  style={styles.randomButton}
                  onPress={generateRandomNickname}
                >
                  <ThemedText>랜덤 닉네임 생성</ThemedText>
                </TouchableOpacity>
                
                <ThemedView style={styles.buttonRow}>
                  <Button title="취소" onPress={() => setChangingNickname(false)} />
                  <Button title="저장" onPress={changeNickname} />
                </ThemedView>
                
                <ThemedText style={styles.paymentNotice}>
                  * 실제 서비스에서는 결제 후 닉네임을 변경할 수 있습니다.
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView>
                <ThemedText>{user.nickname}</ThemedText>
                <Button 
                  title="닉네임 변경" 
                  onPress={() => {
                    setNewNickname(user.nickname);
                    setChangingNickname(true);
                  }}
                />
              </ThemedView>
            )}
          </ThemedView>
          
          <ThemedView style={styles.stepContainer}>
            <Button title="로그아웃" onPress={handleLogout} color="#FF3B30" />
          </ThemedView>
        </ThemedView>
      ) : (
        <ThemedView style={styles.stepContainer}>
          <ThemedText>로그인이 필요합니다.</ThemedText>
          <Button title="로그인" onPress={() => router.push('/auth')} />
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileInfo: {
    marginTop: 20,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 20,
  },
  nicknameEditContainer: {
    gap: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  paymentNotice: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  randomButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
});