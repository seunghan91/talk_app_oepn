import { View, Text, StyleSheet, Button, TextInput, Alert, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from './lib/axios';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changingNickname, setChangingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [randomNickname, setRandomNickname] = useState('');

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
      setRandomNickname(res.data.nickname);
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
      
      // 실제 서비스에서는:
      // Alert.alert('안내', '닉네임 변경은 결제 후 가능합니다. 결제 페이지로 이동하시겠습니까?', [
      //   { text: '취소', style: 'cancel' },
      //   { text: '결제하기', onPress: () => router.push('/payment') }
      // ]);
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 프로필</Text>
      
      {user && (
        <View style={styles.profileInfo}>
          <Text style={styles.label}>전화번호</Text>
          <Text style={styles.value}>{user.phone_number}</Text>
          
          <Text style={styles.label}>닉네임</Text>
          {changingNickname ? (
            <View style={styles.nicknameEditContainer}>
              <TextInput
                style={styles.input}
                value={newNickname}
                onChangeText={setNewNickname}
              />
              
              <TouchableOpacity 
                style={styles.randomButton}
                onPress={generateRandomNickname}
              >
                <Text style={styles.randomButtonText}>랜덤</Text>
              </TouchableOpacity>
              
              <View style={styles.buttonRow}>
                <Button title="취소" onPress={() => setChangingNickname(false)} />
                <Button title="저장" onPress={changeNickname} />
              </View>
              
              <Text style={styles.paymentNotice}>
                * 실제 서비스에서는 결제 후 닉네임을 변경할 수 있습니다.
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.value}>{user.nickname}</Text>
              <Button 
                title="닉네임 변경" 
                onPress={() => {
                  setNewNickname(user.nickname);
                  setChangingNickname(true);
                }}
              />
            </View>
          )}
        </View>
      )}
      
      <View style={styles.navigation}>
        <Link href="/" style={styles.link}>홈으로 돌아가기</Link>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileInfo: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    marginBottom: 16,
  },
  nicknameEditContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentNotice: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  navigation: {
    marginTop: 30,
  },
  link: {
    color: 'blue',
    fontSize: 16,
    marginBottom: 10,
  },
  logoutButton: {
    color: 'red',
    fontSize: 16,
  },
  randomButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  randomButtonText: {
    color: '#333',
  },
}); 