import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Platform, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  
  // 웹에서만 표시할 로그아웃 함수
  const handleWebLogout = async () => {
    if (Platform.OS !== 'web') return;
    
    Alert.alert(
      '로그아웃',
      '로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '로그아웃', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // 웹에서 새로고침하여 UI 상태 업데이트
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            } catch (error) {
              console.error('로그아웃 실패:', error);
              
              // 수동으로 로그아웃 시도
              try {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                await AsyncStorage.removeItem('userToken');
                
                if (typeof window !== 'undefined' && window.localStorage) {
                  window.localStorage.removeItem('token');
                  window.localStorage.removeItem('user');
                  window.localStorage.removeItem('userToken');
                  window.location.reload();
                }
              } catch (manualError) {
                console.error('수동 로그아웃 실패:', manualError);
                Alert.alert('오류', '로그아웃 처리에 실패했습니다.');
              }
            }
          }
        }
      ]
    );
  };
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingTop: 5,
          paddingBottom: 5,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('common.appName'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          // 웹에서 로그아웃 버튼 추가
          headerRight: Platform.OS === 'web' ? () => (
            <TouchableOpacity style={styles.logoutButton} onPress={handleWebLogout}>
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
              <Text style={styles.logoutText}>로그아웃</Text>
            </TouchableOpacity>
          ) : undefined,
          headerShown: Platform.OS === 'web', // 웹에서는 헤더 표시
        }}
      />
      
      <Tabs.Screen
        name="messages"
        options={{
          title: t('messages.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    padding: 8,
  },
  logoutText: {
    marginLeft: 5,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
}); 