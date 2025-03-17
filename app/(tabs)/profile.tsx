import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';

export default function ProfileTab() {
  const router = useRouter();

  // 컴포넌트가 마운트되면 프로필 화면으로 자동 이동
  useEffect(() => {
    router.replace('/profile');
  }, [router]);

  // 이 화면은 실제로 보이지 않고 바로 프로필 화면으로 이동합니다
  return (
    <ThemedView style={styles.container}>
      <ThemedText>프로필 화면으로 이동 중...</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 