import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useAuth } from '../context/AuthContext';
import StylishButton from '../../components/StylishButton';

// 거래 내역 타입 정의
interface Transaction {
  id: number;
  type: string;
  type_korean: string;
  amount: number;
  formatted_amount: string;
  description: string;
  payment_method: string;
  status: string;
  created_at: string;
  formatted_date: string;
}

// 지갑 화면 컴포넌트
export default function WalletScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, user, updateUser } = useAuth();

  // 로그인 화면으로 이동
  const goToLogin = () => {
    router.push('/auth' as any);
  };

  // 로그인되지 않은 경우 로그인 유도 화면 표시
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: '지갑' }} />
        <ThemedView style={styles.loginContainer}>
          <Ionicons name="wallet-outline" size={64} color="#CCCCCC" />
          <ThemedText style={styles.loginTitle}>로그인이 필요합니다</ThemedText>
          <ThemedText style={styles.loginDescription}>
            지갑 기능을 사용하려면 로그인이 필요합니다.
          </ThemedText>
          <StylishButton 
            title="로그인하기"
            onPress={goToLogin}
            style={styles.loginButton}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  // 월렛 기능 준비 중 화면
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: '내 지갑',
        }} 
      />
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.comingSoonContainer}>
          <Ionicons name="wallet-outline" size={80} color="#CCCCCC" />
          <ThemedText style={styles.comingSoonTitle}>준비 중인 기능</ThemedText>
          <ThemedText style={styles.comingSoonDescription}>
            월렛 기능은 사용자가 늘어나면 오픈할 예정입니다.{'\n'}
            조금만 기다려주세요! 🙏
          </ThemedText>
          <ThemedText style={styles.comingSoonSubtext}>
            • 캐시 충전 기능{'\n'}
            • 결제 내역 관리{'\n'}
            • 포인트 적립 시스템
          </ThemedText>
          <StylishButton
            title="홈으로 돌아가기"
            onPress={() => router.push('/(tabs)' as any)}
            style={styles.backButton}
            type="secondary"
          />
        </ThemedView>
        </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  container: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  loginDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    minWidth: 200,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333333',
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  backButton: {
    minWidth: 200,
  },
});
