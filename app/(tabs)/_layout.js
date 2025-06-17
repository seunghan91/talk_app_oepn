import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '../../components/HapticTab';
import TabBarBackground from '../../components/ui/TabBarBackground';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

// 라우팅 설정 추가 - 서브 경로 명시
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function TabLayout() {
  // 항상 light 테마 사용
  const colorScheme = 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          ...Platform.select({
            ios: {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderTopWidth: 1,
              borderTopColor: '#ECECEC',
            },
            android: {
              backgroundColor: 'white',
              borderTopWidth: 1,
              borderTopColor: '#ECECEC',
            },
          }),
          height: 60,
          paddingBottom: 5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '대화방',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="feedback/index"
        options={{
          title: '피드백',
          tabBarIcon: ({ color }) => <Ionicons name="create-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          href: null,  // 탭 바에서 숨김
        }}
      />
      <Tabs.Screen
        name="notice"
        options={{
          href: null,  // 탭 바에서 숨김
        }}
      />
    </Tabs>
  );
}