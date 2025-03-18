import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';

/**
 * 404 페이지 컴포넌트
 * 사용자가 존재하지 않는 페이지에 접근했을 때 표시됩니다.
 */
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '페이지를 찾을 수 없음' }} />
      <ThemedView style={styles.container}>
        <Ionicons name="help-circle-outline" size={120} color="#8E8E93" style={styles.icon} />
        <ThemedText style={styles.title}>페이지를 찾을 수 없습니다</ThemedText>
        <ThemedText style={styles.description}>
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </ThemedText>
        <Link href="/(tabs)" asChild>
          <TouchableOpacity style={styles.button}>
            <ThemedText style={styles.buttonText}>홈으로 이동</ThemedText>
          </TouchableOpacity>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    maxWidth: '80%',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
