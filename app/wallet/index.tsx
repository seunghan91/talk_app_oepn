import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../lib/axios';

// 충전 금액 옵션
const PAYMENT_OPTIONS = [
  { amount: 1000, label: '1,000원' },
  { amount: 5000, label: '5,000원' },
  { amount: 10000, label: '10,000원' },
  { amount: 100000, label: '100,000원' },
];

export default function WalletScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);

  // 잔액 로드
  useEffect(() => {
    if (isAuthenticated) {
      fetchWalletBalance();
    }
  }, [isAuthenticated]);

  // 잔액 조회
  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      
      // 실제 API 호출
      // const response = await axiosInstance.get('/api/wallet/balance');
      // setBalance(response.data.balance);
      
      // 테스트용 더미 데이터
      setBalance(5000);
      
      setLoading(false);
    } catch (error) {
      console.error('지갑 잔액 조회 실패:', error);
      
      // 테스트용 더미 데이터
      setBalance(5000);
      
      setLoading(false);
    }
  };

  // 결제 프로세스 시작
  const startPaymentProcess = async (amount: number) => {
    try {
      setPaymentLoading(true);
      
      // 실제 구현에서는 실제 결제 프로세스 연동
      // 앱스토어/구글플레이 인앱결제 API 연동 필요
      
      // 테스트용 성공 처리
      setTimeout(() => {
        // 결제 성공으로 처리
        setBalance(prev => prev + amount);
        
        Alert.alert(
          '충전 완료',
          `${amount.toLocaleString()}원이 충전되었습니다.`,
          [{ text: '확인', onPress: () => console.log('충전 확인') }]
        );
        
        setPaymentLoading(false);
      }, 1500);
    } catch (error) {
      console.error('결제 처리 실패:', error);
      
      Alert.alert(
        '결제 오류',
        '결제 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
        [{ text: '확인', onPress: () => setPaymentLoading(false) }]
      );
    }
  };

  // 홈으로 이동
  const goBack = () => {
    router.back();
  };

  // 로그인 화면으로 이동
  const goToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* 헤더 */}
        <ThemedView style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>내 지갑</ThemedText>
          <View style={styles.rightPlaceholder} />
        </ThemedView>
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {isAuthenticated ? (
            <>
              {/* 잔액 표시 */}
              <ThemedView style={styles.balanceCard}>
                <ThemedText style={styles.balanceLabel}>현재 잔액</ThemedText>
                <ThemedView style={styles.balanceContainer}>
                  <Ionicons name="wallet-outline" size={32} color="#007AFF" />
                  <ThemedText style={styles.balanceAmount}>
                    {balance.toLocaleString()}원
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.balanceInfo}>
                  * 충전된 금액은 닉네임 변경 등의 서비스 이용에 사용됩니다.
                </ThemedText>
              </ThemedView>
              
              {/* 충전 옵션 */}
              <ThemedView style={styles.chargeSection}>
                <ThemedText style={styles.sectionTitle}>충전하기</ThemedText>
                
                <ThemedView style={styles.chargeOptions}>
                  {PAYMENT_OPTIONS.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.chargeOption}
                      onPress={() => startPaymentProcess(option.amount)}
                      disabled={paymentLoading}
                    >
                      <Ionicons 
                        name="cash-outline" 
                        size={24} 
                        color="#34C759" 
                      />
                      <ThemedText style={styles.chargeAmount}>
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ThemedView>
                
                <ThemedText style={styles.chargeInfo}>
                  * 결제는 {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} 스토어를 통해 진행됩니다.
                </ThemedText>
                <ThemedText style={styles.chargeInfo}>
                  * 충전 후 환불은 고객센터를 통해 문의해주세요.
                </ThemedText>
              </ThemedView>
              
              {/* 거래 내역 (향후 구현) */}
              <ThemedView style={styles.transactionSection}>
                <ThemedText style={styles.sectionTitle}>최근 거래 내역</ThemedText>
                
                <ThemedView style={styles.emptyState}>
                  <Ionicons name="receipt-outline" size={48} color="#CCCCCC" />
                  <ThemedText style={styles.emptyStateText}>
                    거래 내역이 없습니다.
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </>
          ) : (
            <ThemedView style={styles.loginContainer}>
              <Ionicons name="wallet-outline" size={64} color="#CCCCCC" />
              <ThemedText style={styles.loginMessage}>
                로그인이 필요한 서비스입니다.
              </ThemedText>
              <StylishButton
                title="로그인하기"
                onPress={goToLogin}
                type="primary"
                style={styles.loginButton}
              />
            </ThemedView>
          )}
        </ScrollView>
        
        {paymentLoading && (
          <ThemedView style={styles.loadingOverlay}>
            <ThemedView style={styles.loadingContainer}>
              <Ionicons name="card-outline" size={48} color="#007AFF" />
              <ThemedText style={styles.loadingText}>결제 처리 중...</ThemedText>
            </ThemedView>
          </ThemedView>
        )}
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
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rightPlaceholder: {
    width: 40,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  balanceInfo: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  chargeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chargeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chargeOption: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  chargeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  chargeInfo: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  transactionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
  },
  loginContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  loginMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: '#666666',
  },
  loginButton: {
    width: 200,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#333333',
  }
}); 