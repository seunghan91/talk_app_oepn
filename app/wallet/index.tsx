import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../lib/axios';
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
  const [balance, setBalance] = useState<number>(0);
  const [formattedBalance, setFormattedBalance] = useState<string>('0원');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 지갑 정보와 거래 내역 로드
  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      if (!isAuthenticated) {
        return;
      }
      
      // 실제 API 호출 (API 서버 연결이 안 될 경우 테스트 데이터 사용)
      try {
        // 지갑 정보 조회
        const walletResponse = await axiosInstance.get('/api/v1/wallet');
        if (walletResponse.data) {
          const walletBalance = walletResponse.data.balance || 0;
          setBalance(walletBalance);
          setFormattedBalance(walletResponse.data.formatted_balance || `${walletBalance.toLocaleString()}원`);
          
          // 지갑 잔액을 AuthContext에 업데이트
          updateUser({ cash_amount: walletBalance });
        }
        
        // 거래 내역 조회
        const transactionsResponse = await axiosInstance.get('/api/v1/wallet/transactions');
        if (transactionsResponse.data) {
          setTransactions(transactionsResponse.data);
        }
      } catch (error) {
        console.error('지갑 데이터 로드 실패:', error);
        
        // 테스트 데이터 사용
        const testBalance = 5000;
        setBalance(testBalance);
        setFormattedBalance('₩5,000');
        // 테스트 데이터도 AuthContext에 업데이트
        updateUser({ cash_amount: testBalance });
        
        // 테스트용 거래 내역
        const testTransactions = [
          {
            id: 1,
            type: 'deposit',
            type_korean: '충전',
            amount: 5000,
            formatted_amount: '₩5,000',
            description: '초기 충전',
            payment_method: '신용카드',
            status: 'completed',
            created_at: new Date().toISOString(),
            formatted_date: new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          }
        ];
        setTransactions(testTransactions);
      }
    } catch (error) {
      console.error('지갑 데이터 로드 중 오류 발생:', error);
      Alert.alert(
        '오류 발생',
        '지갑 정보를 불러오는 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 화면 로드 시 데이터 로드
  useEffect(() => {
    loadWalletData();
  }, [isAuthenticated]);

  // 새로고침 처리
  const handleRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  // 충전 화면으로 이동
  const goToDeposit = () => {
    // 실제 구현에서는 충전 화면으로 이동
    // router.push('/wallet/deposit' as any);
    
    // 임시 구현: 알림창 표시
    Alert.alert(
      '준비 중인 기능',
      '충전 기능은 현재 개발 중입니다.',
      [{ text: '확인' }]
    );
  };

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: '내 지갑',
          headerRight: () => (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh" size={24} color="#007AFF" />
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        {/* 지갑 잔액 표시 */}
        <ThemedView style={styles.balanceContainer}>
          <ThemedText style={styles.balanceLabel}>현재 잔액</ThemedText>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <ThemedText style={styles.balanceAmount}>{formattedBalance}</ThemedText>
          )}
          <StylishButton
            title="충전하기"
            onPress={goToDeposit}
            style={styles.depositButton}
            loading={loading}
          />
        </ThemedView>
        
        {/* 거래 내역 목록 */}
        <ThemedView style={styles.transactionsContainer}>
          <ThemedText style={styles.sectionTitle}>거래 내역</ThemedText>
          
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          ) : transactions.length > 0 ? (
            transactions.map((transaction) => (
              <ThemedView key={transaction.id} style={styles.transactionItem}>
                <ThemedView style={styles.transactionHeader}>
                  <ThemedText style={styles.transactionType}>
                    {transaction.type_korean}
                  </ThemedText>
                  <ThemedText 
                    style={[
                      styles.transactionAmount,
                      transaction.type === 'deposit' ? styles.depositAmount : styles.withdrawalAmount
                    ]}
                  >
                    {transaction.type === 'deposit' ? '+' : '-'}{transaction.formatted_amount}
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.transactionDesc}>{transaction.description}</ThemedText>
                <ThemedText style={styles.transactionDate}>{transaction.formatted_date}</ThemedText>
              </ThemedView>
            ))
          ) : (
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#CCCCCC" />
              <ThemedText style={styles.emptyText}>거래 내역이 없습니다</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>
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
  refreshButton: {
    padding: 8,
  },
  balanceContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
  },
  depositButton: {
    minWidth: 200,
  },
  transactionsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  transactionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  depositAmount: {
    color: '#4CAF50',
  },
  withdrawalAmount: {
    color: '#F44336',
  },
  transactionDesc: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
    marginBottom: 20,
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
});
