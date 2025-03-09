// app/settings/notifications.js
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { registerForPushNotificationsAsync } from '../utils/_pushNotificationHelper.util';
// ✔ axiosInstance import
import axiosInstance from '../lib/axios';

export default function NotificationsSettings() {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // ...
  }, []);

  const toggleSwitch = async () => {
    const newVal = !isEnabled;
    setIsEnabled(newVal);

    if (newVal) {
      // 1) 푸시 토큰 발급
      const token = await registerForPushNotificationsAsync();
      if (token) {
        console.log('Push token:', token);
        try {
          // 2) Rails 서버에 토큰 전송
          //    HEADERS: { Authorization: Bearer <jwt_token> } 자동
          const response = await axiosInstance.post('/api/users/update_push_token', { token });
          console.log('update_push_token 결과:', response.data);
          Alert.alert('알림 설정', '푸시 알림을 켰습니다! 서버 응답: ' + JSON.stringify(response.data));
        } catch (error) {
          console.log('토큰 저장 실패:', error);
          Alert.alert('오류', '토큰 저장에 실패했습니다: ' + error.message);
          setIsEnabled(false);
        }
      } else {
        // 토큰 발급 실패 or 권한 거부
        setIsEnabled(false);
      }
    } else {
      // OFF 처리
      Alert.alert('알림 설정', '알림을 끄셨습니다.');
      // TODO: axiosInstance.post('/api/users/disable_push') ... 
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 16 }}>알림 설정</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
        <Text style={{ marginRight: 8 }}>푸시 알림 켜기</Text>
        <Switch value={isEnabled} onValueChange={toggleSwitch} />
      </View>

      <Button title="뒤로가기" onPress={() => router.back()} />
    </View>
  );
}