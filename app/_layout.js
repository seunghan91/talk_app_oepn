// app/_layout.js

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, Redirect, Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useColorScheme, Platform, View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nextProvider } from 'react-i18next';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Asset } from 'expo-asset';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// i18n 설정 import
import './i18n';
import i18n from './i18n';

// SplashScreen이 자동으로 사라지지 않도록 설정
SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
  
  // 모든 라우터 경로 명시적 정의
  routes: {
    // 기본 탭 경로
    '(tabs)': {
      initialRouteName: 'index',
      screens: {
        index: 'home',
        explore: 'explore',
        record: 'record',
        notifications: 'notifications',
        settings: 'settings',
      }
    },
    // 인증 관련 경로
    'auth': {
      initialRouteName: 'index',
      screens: {
        index: 'auth',
        login: 'login',
        register: 'register',
      }
    },
    // 설정 관련 경로
    'settings': {
      screens: {
        index: 'settings',
        account: 'account',
        notifications: 'notifications',
      }
    },
    // 방송 관련 경로
    'broadcast': {
      screens: {
        index: 'broadcast',
        record: 'record',
        view: 'view',
      }
    },
    // 프로필 관련 경로
    'profile': {
      screens: {
        index: 'profile',
        edit: 'edit',
      }
    },
    // 공지사항 관련 경로
    'announcements': {
      screens: {
        index: 'announcements',
        '[id]': 'announcement-detail',
      }
    },
    // 알림 없음 경로
    '+not-found': {
      name: 'Not Found',
    }
  },
};

// 폰트 및 아이콘 로드
function loadFontsAsync() {
  // 폰트가 없으면 빈 객체 반환
  return useFonts({
    ...FontAwesome.font,
  });
}

// 사용자 인증 상태에 따른 라우팅 처리
function InitialLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // 세그먼트 분석 및 리디렉션
  useEffect(() => {
    console.log('InitialLayout 상태:', { isLoading, isAuthenticated, segments });
    
    if (isLoading) {
      console.log('로딩 중... 라우팅 대기');
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    console.log('현재 세그먼트:', segments, '인증 그룹 여부:', inAuthGroup);
    
    try {
      // 리디렉션 로직
      if (!isAuthenticated && !inAuthGroup) {
        console.log('인증되지 않음 - 로그인 페이지로 이동');
        router.replace('/auth');
      } else if (isAuthenticated && inAuthGroup) {
        console.log('인증됨 - 메인 탭으로 이동');
        router.replace('/(tabs)');
      } else {
        console.log('현재 위치 유지');
      }
    } catch (routerError) {
      console.error('라우터 오류:', routerError);
    }
  }, [isAuthenticated, segments, isLoading, router]);

  // 로딩 중일 때 로딩 화면 표시
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#007AFF' }}>TALKK</Text>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>로딩 중...</Text>
      </View>
    );
  }

  return <Slot />;
}

// 루트 레이아웃 컴포넌트
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = loadFontsAsync();

  // 앱 로딩 완료 처리
  const onLayoutRootView = useMemo(() => {
    return async () => {
      if (loaded) {
        try {
          await SplashScreen.hideAsync();
          console.log('SplashScreen 숨김 완료');
        } catch (error) {
          console.error('SplashScreen 숨김 오류:', error);
        }
      }
    };
  }, [loaded]);

  // 강제 SplashScreen 숨김 (3초 후)
  useEffect(() => {
    const forceSplashTimeout = setTimeout(async () => {
      try {
        console.log('강제 SplashScreen 숨김 실행 (3초 타임아웃)');
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn('강제 SplashScreen 숨김 실패:', error);
      }
    }, 3000);

    return () => clearTimeout(forceSplashTimeout);
  }, []);

  if (!loaded) {
    // 로딩 중 화면 - 하지만 너무 오래 기다리지 않도록 함
    console.log('폰트 로딩 중...');
    return null; // SplashScreen이 계속 표시됨
  }

  console.log('RootLayout 렌더링 시작 - 폰트 로딩 완료');

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthProvider>
            <InitialLayout />
          </AuthProvider>
        </ThemeProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

// 커스텀 오류 경계 처리
export function CustomErrorBoundary(props) {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="error" options={{ title: 'Oops!' }} />
    </Stack>
  );
}