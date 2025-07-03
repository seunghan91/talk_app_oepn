// app/_layout.js

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

// i18n 설정 import
import './i18n';

// AuthProvider import
import { AuthProvider } from './context/AuthContext';
// Redux StoreProvider import
import { StoreProvider } from './store/StoreProvider';

// 컴포넌트 import
import { HapticTab } from '../components/HapticTab';
import TabBarBackground from '../components/ui/TabBarBackground';
import { Colors } from '../constants/Colors';

// SplashScreen이 자동으로 사라지지 않도록 설정
SplashScreen.preventAutoHideAsync();

// 앱 전체 레이아웃 정의
export default function RootLayout() {
  const colorScheme = useColorScheme();
 
  // 폰트 로딩 - 폰트 파일이 없으면 주석 처리
  const [loaded] = useFonts({
    // SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // 폰트·리소스가 로딩된 후 SplashScreen.hideAsync() 호출
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    // 폰트 로딩이 완료되지 않았다면, 일단 null 반환(스플래시 유지)
    return null;
  }

  return (
    <StoreProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: Colors.light.tint,
              headerShown: false,
              tabBarButton: HapticTab,
              tabBarBackground: TabBarBackground,
              tabBarStyle: Platform.select({
                ios: {
                  position: 'absolute',
                },
                default: {},
              }),
            }}
          >
            {/* 홈 탭 */}
            <Tabs.Screen
              name="index"
              options={{
                title: '홈',
                tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
              }}
            />
            
            {/* 메시지 탭 */}
            <Tabs.Screen
              name="messages"
              options={{
                title: '메시지',
                tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
              }}
            />
            
            {/* 프로필 탭 */}
            <Tabs.Screen
              name="profile"
              options={{
                title: '프로필',
                tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
              }}
            />
            
            {/* 설정 탭 */}
            <Tabs.Screen
              name="settings"
              options={{
                title: '설정',
                tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
              }}
            />
            
            {/* 숨겨진 화면들 - 탭바에 표시되지 않지만 탭바는 유지됨 */}
            <Tabs.Screen
              name="(tabs)"
              options={{
                href: null, // 탭바에서 숨김
              }}
            />
            <Tabs.Screen
              name="broadcast"
              options={{
                href: null, // 탭바에서 숨김
              }}
            />
            <Tabs.Screen
              name="auth"
              options={{
                href: null, // 탭바에서 숨김
              }}
            />
            <Tabs.Screen
              name="conversations"
              options={{
                href: null, // 탭바에서 숨김
              }}
            />
            <Tabs.Screen
              name="notifications"
              options={{
                href: null, // 탭바에서 숨김
              }}
            />
            <Tabs.Screen
              name="admin"
              options={{
                href: null, // 탭바에서 숨김
              }}
            />
            <Tabs.Screen
              name="feedback"
              options={{
                href: null, // 탭바에서 숨김
              }}
            />
            <Tabs.Screen
              name="wallet"
              options={{
                href: null, // 탭바에서 숨김
              }}
            />
            <Tabs.Screen
              name="+not-found"
              options={{
                href: null, // 탭바에서 숨김
              }}
            />
          </Tabs>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </StoreProvider>
  );
}