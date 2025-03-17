import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#333',
        headerShown: true,
        headerBackTitle: '', // 뒤로가기 버튼 옆의 텍스트 제거
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '프로필',
          headerBackTitle: '',
        }}
      />
    </Stack>
  );
} 