import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '@lib/axios';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { useAuth } from '../context/AuthContext';

// 브로드캐스트 타입 정의
interface Broadcast {
  id: number;
  user_id: number;
  audio_url: string;
  created_at: string;
  user: {
    nickname: string;
    gender?: string;
    age_group?: string;
    region?: string;
  };
  is_favorite?: boolean;
  duration?: number; // 오디오 길이(초)
  recipient_status?: 'delivered' | 'read' | 'replied'; // 수신 상태
  received_at?: string; // 수신 시간
}

type BroadcastFilter = 'all' | 'sent' | 'received';

export default function BroadcastScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  // 새 브로드캐스트 녹음 화면으로 이동
  const goToRecordScreen = () => {
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    
    router.push('/broadcast/record');
  };
    
    return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.headerContainer}>
        <ThemedText style={styles.title}>{t('broadcast.title')}</ThemedText>
        <ThemedText style={styles.description}>
          음성 메시지를 녹음하여 불특정 다수에게 전송할 수 있습니다.
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mic-circle" size={120} color="#007AFF" />
        </View>
        
        <ThemedText style={styles.infoText}>
          녹음 버튼을 눌러 음성 메시지를 녹음하세요.
          {'\n'}녹음된 메시지는 랜덤한 사용자들에게 전송됩니다.
        </ThemedText>
      
      <StylishButton
        title={t('broadcast.record')}
          icon={<Ionicons name="mic" size={24} color="#FFF" />}
        onPress={goToRecordScreen}
        type="primary"
          size="large"
          style={styles.recordButton}
          />
        </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  infoText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  recordButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
});