// app/_layout.js

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '../hooks/useColorScheme';

// i18n 설정 import
import './i18n';

// AuthProvider import
import { AuthProvider } from './context/AuthContext';

// SplashScreen이 자동으로 사라지지 않도록 설정
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 폰트 로딩
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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
    // AuthProvider로 앱 전체 감싸기
    <AuthProvider>
      {/* 라이트·다크 테마 적용 */}
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* expo-router에서 제공하는 Stack */}
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#333',
          }}
        >
          {/* 첫 화면에 Tabs 라우트(폴더) 쓰고 싶다면 이렇게 */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* 기타 화면 */}
          <Stack.Screen name="+not-found" />
          {/* 인증 화면 */}
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}