import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  
  // 웹에서만 표시할 로그아웃 함수
  const handleWebLogout = async () => {
    // 웹 환경에서 작동하는 확인창 사용
    if (typeof window !== 'undefined' && window.confirm('로그아웃 하시겠습니까?')) {
      try {
        await logout();
        // 웹에서 새로고침하여 UI 상태 업데이트
        window.location.reload();
      } catch (error) {
        console.error('로그아웃 실패:', error);
        
        // 수동으로 로그아웃 시도
        try {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('userToken');
          
          if (window.localStorage) {
            window.localStorage.removeItem('token');
            window.localStorage.removeItem('user');
            window.localStorage.removeItem('userToken');
            window.location.reload();
          }
        } catch (manualError) {
          console.error('수동 로그아웃 실패:', manualError);
          window.alert('로그아웃 처리에 실패했습니다.');
        }
      }
    }
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
          title: '홈',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          // 웹에서 로그아웃 버튼 추가
          headerRight: () => (
            <TouchableOpacity style={styles.logoutButton} onPress={handleWebLogout}>
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
              <Text style={styles.logoutText}>로그아웃</Text>
            </TouchableOpacity>
          ),
          headerShown: true, // 웹에서는 헤더 표시
        }}
      />
      
      <Tabs.Screen
        name="messages"
        options={{
          title: '대화방',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="feedback"
        options={{
          title: '피드백',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
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