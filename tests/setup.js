/* eslint-env jest */
// Jest 테스트 설정 파일
import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
global.jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Animated API는 jest-expo에서 자동으로 처리됨

// Mock AsyncStorage
global.jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo modules
global.jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'https://test-api.example.com'
      }
    }
  }
}));

global.jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: global.jest.fn(),
    replace: global.jest.fn(),
    back: global.jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }) => children,
}));

// Mock expo-av
global.jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: global.jest.fn(() => Promise.resolve({ status: 'granted' })),
    setAudioModeAsync: global.jest.fn(() => Promise.resolve()),
    Recording: global.jest.fn(() => ({
      prepareToRecordAsync: global.jest.fn(() => Promise.resolve()),
      startAsync: global.jest.fn(() => Promise.resolve()),
      stopAndUnloadAsync: global.jest.fn(() => Promise.resolve()),
      getURI: global.jest.fn(() => 'mock-uri'),
    })),
  },
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: global.jest.fn(),
  error: global.jest.fn(),
}; 