import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

// 번역 파일 import
import ko from './locales/ko.json';
import en from './locales/en.json';

// 기기 언어 감지
const getDeviceLanguage = () => {
  try {
    if (Platform.OS === 'ios') {
      // iOS에서는 SettingsManager를 통해 언어 설정을 가져옴
      const iosLocale = 
        NativeModules.SettingsManager?.settings?.AppleLocale || 
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 
        'ko'; // 기본값으로 한국어 사용
      return iosLocale.split('_')[0];
    } else if (Platform.OS === 'android') {
      // Android에서는 I18nManager를 통해 언어 설정을 가져옴
      const androidLocale = NativeModules.I18nManager?.localeIdentifier || 'ko';
      return androidLocale.split('_')[0];
    } else {
      // 웹이나 다른 플랫폼에서는 기본값으로 한국어 사용
      return 'ko';
    }
  } catch (error) {
    console.error('기기 언어 감지 실패:', error);
    return 'ko'; // 오류 발생 시 기본값으로 한국어 사용
  }
};

// 저장된 언어 설정 불러오기 (동기 버전)
const getStoredLanguage = () => {
  try {
    // 웹 환경에서는 localStorage 사용
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('user_language') || null;
    }
    // 기본값 반환
    return null;
  } catch (error) {
    console.error('저장된 언어 설정 불러오기 실패 (동기):', error);
    return null;
  }
};

// 언어 설정 저장하기
export const saveLanguage = async (langCode) => {
  try {
    // 웹 환경에서는 localStorage 사용
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('user_language', langCode);
    }
    // 네이티브 환경에서는 AsyncStorage 사용
    await AsyncStorage.setItem('user_language', langCode);
  } catch (error) {
    console.error('언어 설정 저장 실패:', error);
  }
};

// 기본 언어 결정
const getDefaultLanguage = () => {
  const storedLanguage = getStoredLanguage();
  if (storedLanguage) return storedLanguage;
  
  return getDeviceLanguage() || 'ko';
};

// i18n 초기화 (동기 방식)
i18n
  .use(initReactI18next)
  .init({
    resources: {
      ko: {
        translation: ko,
      },
      en: {
        translation: en,
      },
    },
    lng: 'ko', // 항상 한국어로 시작
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// 비동기 방식으로 저장된 언어 설정 불러오기 (앱 시작 후)
const loadSavedLanguageAsync = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('user_language');
    // 저장된 언어가 있고, 현재 언어와 다르면 변경
    // 단, 저장된 언어가 없으면 한국어 유지
    if (savedLanguage && i18n.language !== savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    } else if (!savedLanguage) {
      // 저장된 언어가 없으면 한국어로 저장
      saveLanguage('ko');
    }
  } catch (error) {
    console.error('비동기 언어 설정 불러오기 실패:', error);
  }
};

// 앱 시작 후 비동기로 언어 설정 불러오기 시도
if (Platform.OS !== 'web') {
  loadSavedLanguageAsync();
}

export default i18n; 