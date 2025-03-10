// app/utils/_pushNotificationHelper.util.js

import React from 'react';
import { View, Text, Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// 개발 환경인지 확인
const isDev = __DEV__;

// Expo Go 환경인지 확인
const isExpoGo = Constants.appOwnership === 'expo';

// 푸시 알림 설정
export const configurePushNotifications = () => {
  try {
    // Expo Go에서는 일부 기능이 제한됨
    if (isExpoGo) {
      console.log('Expo Go 환경에서는 푸시 알림 기능이 제한됩니다.');
      
      // 개발 환경에서는 로컬 알림 핸들러만 설정
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      
      return;
    }

    // 프로덕션 환경에서의 알림 핸들러 설정
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    console.error('푸시 알림 설정 실패:', error);
  }
};

// 푸시 알림 권한 요청 및 토큰 획득
export const registerForPushNotificationsAsync = async () => {
  try {
    // Expo Go에서는 일부 기능이 제한됨
    if (isExpoGo) {
      console.log('Expo Go 환경에서는 푸시 알림 토큰 획득이 제한됩니다.');
      
      // 개발 환경에서는 모의 토큰 반환
      if (isDev) {
        return { data: 'EXPO_GO_MOCK_TOKEN' };
      }
      
      return null;
    }

    // 웹 환경에서는 지원하지 않음
    if (Platform.OS === 'web') {
      console.log('웹 환경에서는 푸시 알림을 지원하지 않습니다.');
      return null;
    }

    // 권한 확인
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 권한이 없으면 요청
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // 권한이 거부된 경우
    if (finalStatus !== 'granted') {
      console.log('푸시 알림 권한이 거부되었습니다.');
      return null;
    }

    // 토큰 획득
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      // projectId가 없는 경우 (개발 환경)
      if (!projectId && isDev) {
        console.log('개발 환경: 프로젝트 ID가 없어 모의 토큰을 반환합니다.');
        return { data: 'DEV_MOCK_TOKEN' };
      }
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      
      console.log('푸시 알림 토큰:', token);
      return token;
    } catch (tokenError) {
      console.error('푸시 알림 토큰 획득 중 오류:', tokenError);
      
      // 개발 환경에서는 모의 토큰 반환
      if (isDev) {
        console.log('개발 환경: 토큰 획득 실패로 모의 토큰을 반환합니다.');
        return { data: 'ERROR_MOCK_TOKEN' };
      }
      
      return null;
    }
  } catch (error) {
    console.error('푸시 알림 토큰 획득 실패:', error);
    return null;
  }
};

// 테스트 알림 전송
export const sendTestNotification = async () => {
  try {
    // 로컬 알림 전송
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '테스트 알림',
        body: '이것은 테스트 알림입니다.',
        data: { data: '알림 데이터' },
      },
      trigger: null, // 즉시 알림 표시
    });
    
    console.log('테스트 알림이 전송되었습니다.');
    
    // Expo Go 환경에서는 안내 메시지 표시
    if (isExpoGo) {
      setTimeout(() => {
        Alert.alert(
          '알림 제한 안내',
          'Expo Go 환경에서는 로컬 알림만 사용할 수 있습니다. 원격 푸시 알림을 테스트하려면 개발 빌드를 사용하세요.',
          [{ text: '확인', style: 'default' }]
        );
      }, 1000);
    }
  } catch (error) {
    console.error('테스트 알림 전송 실패:', error);
    Alert.alert('오류', '테스트 알림 전송에 실패했습니다.');
  }
};

// 푸시 알림 헬퍼 컴포넌트
export default function PushNotificationHelper() {
  return (
    <View style={{ display: 'none' }}>
      <Text>푸시 알림 헬퍼</Text>
    </View>
  );
}