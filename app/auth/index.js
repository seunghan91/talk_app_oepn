import { View, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router'; 
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { SafeAreaView } from 'react-native';
import StylishButton from '../../components/StylishButton';

export default function AuthIndexScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  // 이미 인증된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  // 로그인 화면으로 이동
  const goToLogin = () => {
    router.push('/auth/login');
  };

  // 회원가입 화면으로 이동
  const goToRegister = () => {
    router.push('/auth/register');
  };

  // 홈으로 돌아가기
  const goToHome = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>{t('auth.welcome')}</ThemedText>
        
        <ThemedView style={styles.descriptionContainer}>
          <ThemedText style={styles.description}>
            {t('auth.chooseOption')}
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.buttonsContainer}>
          <StylishButton
            title={t('auth.login')}
            onPress={goToLogin}
            type="primary"
            size="large"
            icon={<Ionicons name="log-in" size={20} color="#FFFFFF" />}
            style={styles.button}
          />
          
          <ThemedText style={styles.orText}>{t('auth.or')}</ThemedText>
          
          <StylishButton
            title={t('auth.register')}
            onPress={goToRegister}
            type="secondary"
            size="large"
            icon={<Ionicons name="person-add" size={20} color="#FFFFFF" />}
            style={styles.button}
          />
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginBottom: 40,
    width: '80%',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '80%',
    alignItems: 'center',
  },
  button: {
    marginBottom: 20,
    width: '100%',
  },
  orText: {
    marginVertical: 10,
    fontSize: 16,
  },
  backButton: {
    marginTop: 40,
    padding: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  }
}); 