// app/_layout.js

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import LogRocket from 'logrocket';

// i18n 설정 import
import './i18n';

// AuthProvider import
import { AuthProvider } from './context/AuthContext';

// LogRocket 초기화
if (!__DEV__) { // 개발 모드가 아닐 때만 LogRocket 초기화
  LogRocket.init('8dwgka/talkk');
}

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
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#333',
            headerShown: true,
            headerBackTitle: '', // 뒤로가기 버튼 옆의 텍스트 제거
          }}
        >
          {/* 루트 경로 리디렉션 설정 */}
          <Stack.Screen name="index" options={{ 
            headerShown: false,
          }} />
          
          {/* 첫 화면에 Tabs 라우트(폴더) 쓰고 싶다면 이렇게 */}
          <Stack.Screen name="(tabs)" options={{ 
            headerShown: false,
            title: '' // 빈 문자열로 설정하여 타이틀 숨기기
          }} />
          {/* 기타 화면 */}
          <Stack.Screen name="+not-found" />
          {/* 방송 화면 */}
          <Stack.Screen name="broadcast" options={{ 
            headerShown: false, // 헤더 완전히 숨기기
            title: "" 
          }} />
          {/* 프로필 화면 */}
          <Stack.Screen name="profile" options={{ 
            headerShown: false, // 헤더 완전히 숨기기
            title: "프로필" 
          }} />
          {/* 관리자 화면 */}
          <Stack.Screen name="admin" options={{ title: "관리자" }} />
          {/* auth 디렉토리에 _layout.js가 있어 여기서는 정의하지 않습니다 */}
          <Stack.Screen name="conversations/[id]" options={{ 
            title: "대화",
            headerBackTitle: ""
          }} />
          <Stack.Screen name="notifications" options={{ 
            title: "알림",
            headerBackTitle: ""
          }} />
          <Stack.Screen name="settings" options={{ 
            title: "설정",
            headerBackTitle: ""
          }} />
          <Stack.Screen name="account" options={{ 
            title: "계정",
            headerBackTitle: ""
          }} />
          <Stack.Screen name="feedback" options={{ 
            title: "피드백",
            headerBackTitle: ""
          }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}