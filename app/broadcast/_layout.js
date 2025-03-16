import { Stack } from 'expo-router';

export default function BroadcastLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true, // 헤더 표시
        headerTitle: '', // 타이틀은 숨김
        headerBackVisible: true, // 뒤로가기 버튼 표시
        headerBackTitle: '', // 뒤로가기 텍스트 숨김
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="record" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
} 