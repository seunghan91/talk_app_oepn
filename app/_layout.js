// app/_layout.js

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nextProvider } from 'react-i18next';
import 'react-native-reanimated';

import { useAuth, AuthProvider } from './context/AuthContext';
import { useColorScheme } from '../hooks/useColorScheme';
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
  });
}

// AuthProvider 내부에서 실행되는 인증 라우팅 컴포넌트
function AuthRedirectHandler() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // 🔍 디버그: 상태 변화 실시간 추적
  useEffect(() => {
    console.log('🔍 [DEBUG] InitialLayout 상태 변화:', { 
      isLoading, 
      isAuthenticated, 
      user: user ? user.nickname : 'null',
      segments,
      timestamp: new Date().toISOString()
    });
  }, [isLoading, isAuthenticated, user, segments]);

  // 🔍 디버그: 10초 후 강제 네비게이션 (빈 화면 방지)
  useEffect(() => {
    const forceNavigationTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('🚨 [DEBUG] 10초 타임아웃 - 강제 네비게이션 실행');
        console.warn('🚨 [DEBUG] AuthContext 로딩이 완료되지 않아 강제로 라우팅 진행');
        try {
          router.replace('/(tabs)');
        } catch (error) {
          console.error('🚨 [DEBUG] 강제 네비게이션 실패:', error);
        }
      }
    }, 10000);

    return () => clearTimeout(forceNavigationTimeout);
  }, [isLoading, router]);

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

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}

// 루트 레이아웃 컴포넌트
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = loadFontsAsync();

  // 앱 로딩 완료 시 스플래시 화면 숨기기
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  console.log('RootLayout 렌더링 시작 - 폰트 로딩 완료');

  const onLayoutRootView = () => {
    // 레이아웃 완료 콜백
  };

  if (!loaded) {
    return null; // 폰트 로딩 중에는 아무것도 렌더링하지 않음
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthProvider>
            <AuthRedirectHandler />
            <Stack screenOptions={{ headerShown: false }} />
          </AuthProvider>
        </ThemeProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

// 커스텀 오류 경계 처리
export function CustomErrorBoundary() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="error" options={{ title: 'Oops!' }} />
    </Stack>
  );
}