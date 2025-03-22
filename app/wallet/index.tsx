import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import axios from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function WalletScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [balance, setBalance] = useState<number>(0);
  const [formattedBalance, setFormattedBalance] = useState<string>('₩0');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 지갑 잔액 조회
  const fetchWalletBalance = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // API 호출
      const response = await axios.get('/api/v1/wallet');
      
      setBalance(response.data.balance);
      setFormattedBalance(response.data.formatted_balance || `₩${response.data.balance.toLocaleString()}`);
      
      console.log('[지갑] 잔액 조회 성공:', response.data);
    } catch (err) {
      console.error('[지갑] 잔액 조회 실패:', err);
      setError(t('wallet.loadError'));
      
      // 테스트용 더미 데이터 설정 (실제 앱에서는 제거)
      if (__DEV__) {
        setBalance(5000);
        setFormattedBalance('₩5,000');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // 충전 요청 함수
  const handleDeposit = async (amount: number) => {
    if (!isAuthenticated) {
      Alert.alert(
        t('common.loginRequired'),
        t('common.loginToPerformAction'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { 
            text: t('common.login'), 
            onPress: () => router.push('/auth/login')
          }
        ]
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 실제 API 호출 구현
      const response = await axios.post('/api/v1/wallet/deposit', { amount });
      
      // 성공 시 잔액 업데이트
      setBalance(response.data.balance);
      setFormattedBalance(response.data.formatted_balance || `₩${response.data.balance.toLocaleString()}`);
      
      Alert.alert(
        t('wallet.depositSuccess'),
        response.data.message || t('wallet.depositCompleted'),
        [{ text: t('common.ok') }]
      );
      
      console.log('[지갑] 충전 성공:', response.data);
    } catch (err) {
      console.error('[지갑] 충전 실패:', err);
      
      Alert.alert(
        t('wallet.depositFailed'),
        t('wallet.depositError'),
        [{ text: t('common.ok') }]
      );
      
      // 테스트 모드에서 더미 충전 처리 (실제 앱에서는 제거)
      if (__DEV__) {
        const newBalance = balance + amount;
        setBalance(newBalance);
        setFormattedBalance(`₩${newBalance.toLocaleString()}`);
        
        Alert.alert(
          t('wallet.depositSuccess'),
          `${amount.toLocaleString()}원이 충전되었습니다.`,
          [{ text: t('common.ok') }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 지갑 정보 조회
  useEffect(() => {
    if (isAuthenticated) {
      fetchWalletBalance();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);
  
  // 로그인 필요 화면
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: t('wallet.title') }} />
        
        <View style={styles.loginRequiredContainer}>
          <FontAwesome5 name="lock" size={48} color="#9BA1A6" />
          <Text style={styles.loginRequiredText}>{t('common.loginRequired')}</Text>
          <Text style={styles.loginRequiredSubText}>{t('common.loginToPerformAction')}</Text>
          
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>{t('common.login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('wallet.title') }} />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchWalletBalance}
          >
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>{t('wallet.currentBalance')}</Text>
            <Text style={styles.balanceAmount}>{formattedBalance}</Text>
          </View>
          
          <View style={styles.depositContainer}>
            <Text style={styles.depositTitle}>{t('wallet.deposit')}</Text>
            
            <View style={styles.depositAmountRow}>
              {[5000, 10000, 30000, 50000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.depositButton}
                  onPress={() => handleDeposit(amount)}
                >
                  <Text style={styles.depositButtonText}>{`₩${amount.toLocaleString()}`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>{t('wallet.transactionHistory')}</Text>
            
            {/* 거래 내역은 추후 구현 */}
            <Text style={styles.emptyHistoryText}>{t('wallet.noTransactions')}</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceContainer: {
    backgroundColor: '#0a7ea4',
    padding: 24,
    alignItems: 'center',
    borderRadius: 12,
    margin: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  depositContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E3E5',
  },
  depositTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  depositAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  depositButton: {
    width: '48%',
    backgroundColor: '#F2F3F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E3E5',
  },
  depositButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  historyContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#9BA1A6',
    textAlign: 'center',
    padding: 20,
  },
  loginRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginRequiredText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  loginRequiredSubText: {
    fontSize: 16,
    color: '#687076',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
