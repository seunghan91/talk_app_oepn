import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  const { t } = useTranslation();
  
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
        }}
      />
      
      <Tabs.Screen
        name="messages"
        options={{
          title: '대화방',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="feedback/index"
        options={{
          title: '피드백',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create-outline" size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="mypage"
        options={{
          href: null,  // 탭 바에서 숨김
        }}
      />
      
      <Tabs.Screen
        name="notice"
        options={{
          href: null,  // 탭 바에서 숨김
        }}
      />
    </Tabs>
  );
} 