import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import StylishButton from '../../components/StylishButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 기본 설정값
const DEFAULT_SETTINGS = {
  maxRecordingDuration: 30, // 기본 최대 녹음 시간 (초)
  maxUploadSize: 10, // 기본 최대 업로드 크기 (MB)
  enableDevMode: false, // 개발자 모드 활성화 여부
};

export default function AdminScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 관리자 권한 확인 및 설정 로드
  useEffect(() => {
    const checkAdminAndLoadSettings = async () => {
      try {
        // 관리자 권한 확인 (실제 앱에서는 서버에서 확인해야 함)
        const userInfo = await AsyncStorage.getItem('user_info');
        const user = userInfo ? JSON.parse(userInfo) : null;
        
        // 개발 환경에서는 항상 관리자로 설정
        const isAdminUser = __DEV__ ? true : (user?.isAdmin || false);
        setIsAdmin(isAdminUser);
        
        if (!isAdminUser) {
          Alert.alert('접근 제한', '관리자 권한이 필요합니다.');
          router.back();
          return;
        }
        
        // 저장된 설정 로드
        const savedSettings = await AsyncStorage.getItem('app_settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('관리자 확인 오류:', error);
        Alert.alert('오류', '설정을 로드하는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminAndLoadSettings();
  }, [router]);
  
  // 설정 저장
  const saveSettings = async () => {
    try {
      // 유효성 검사
      const maxDuration = parseInt(settings.maxRecordingDuration);
      if (isNaN(maxDuration) || maxDuration < 10 || maxDuration > 300) {
        Alert.alert('유효하지 않은 값', '녹음 시간은 10초에서 300초 사이여야 합니다.');
        return;
      }
      
      const maxSize = parseInt(settings.maxUploadSize);
      if (isNaN(maxSize) || maxSize < 1 || maxSize > 50) {
        Alert.alert('유효하지 않은 값', '업로드 크기는 1MB에서 50MB 사이여야 합니다.');
        return;
      }
      
      // 설정 저장
      await AsyncStorage.setItem('app_settings', JSON.stringify(settings));
      
      Alert.alert('성공', '설정이 저장되었습니다. 앱을 재시작하면 적용됩니다.');
    } catch (error) {
      console.error('설정 저장 오류:', error);
      Alert.alert('오류', '설정을 저장하는 중 오류가 발생했습니다.');
    }
  };
  
  // 설정 초기화
  const resetSettings = () => {
    Alert.alert(
      '설정 초기화',
      '모든 설정을 기본값으로 되돌리시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '초기화', 
          style: 'destructive',
          onPress: async () => {
            setSettings(DEFAULT_SETTINGS);
            await AsyncStorage.removeItem('app_settings');
            Alert.alert('성공', '설정이 초기화되었습니다.');
          }
        }
      ]
    );
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>로딩 중...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>녹음 설정</ThemedText>
            
            <ThemedView style={styles.settingItem}>
              <ThemedText style={styles.settingLabel}>최대 녹음 시간 (초)</ThemedText>
              <TextInput
                style={styles.input}
                value={String(settings.maxRecordingDuration)}
                onChangeText={(value) => setSettings({...settings, maxRecordingDuration: value})}
                keyboardType="number-pad"
                maxLength={3}
              />
            </ThemedView>
            
            <ThemedText style={styles.settingDescription}>
              사용자가 녹음할 수 있는 최대 시간을 초 단위로 설정합니다. (10-300초)
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>업로드 설정</ThemedText>
            
            <ThemedView style={styles.settingItem}>
              <ThemedText style={styles.settingLabel}>최대 업로드 크기 (MB)</ThemedText>
              <TextInput
                style={styles.input}
                value={String(settings.maxUploadSize)}
                onChangeText={(value) => setSettings({...settings, maxUploadSize: value})}
                keyboardType="number-pad"
                maxLength={2}
              />
            </ThemedView>
            
            <ThemedText style={styles.settingDescription}>
              사용자가 업로드할 수 있는 최대 파일 크기를 MB 단위로 설정합니다. (1-50MB)
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>개발자 옵션</ThemedText>
            
            <TouchableOpacity 
              style={styles.toggleItem}
              onPress={() => setSettings({...settings, enableDevMode: !settings.enableDevMode})}
            >
              <ThemedText style={styles.settingLabel}>개발자 모드 활성화</ThemedText>
              <View style={[styles.toggle, settings.enableDevMode ? styles.toggleOn : styles.toggleOff]}>
                <View style={[styles.toggleHandle, settings.enableDevMode ? styles.toggleHandleOn : styles.toggleHandleOff]} />
              </View>
            </TouchableOpacity>
            
            <ThemedText style={styles.settingDescription}>
              개발자 모드를 활성화하면 추가 디버깅 정보와 테스트 기능을 사용할 수 있습니다.
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.buttonContainer}>
            <StylishButton
              title="설정 저장"
              onPress={saveSettings}
              type="primary"
              size="medium"
              style={styles.button}
            />
            
            <StylishButton
              title="설정 초기화"
              onPress={resetSettings}
              type="secondary"
              size="medium"
              style={styles.button}
            />
          </ThemedView>
        </ThemedView>
      </ScrollView>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    width: 80,
    textAlign: 'center',
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleOn: {
    backgroundColor: '#34C759',
  },
  toggleOff: {
    backgroundColor: '#ddd',
  },
  toggleHandle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
  },
  toggleHandleOn: {
    transform: [{ translateX: 20 }],
  },
  toggleHandleOff: {
    transform: [{ translateX: 0 }],
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    marginBottom: 15,
  },
}); 