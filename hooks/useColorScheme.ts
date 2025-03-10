import { useColorScheme as _useColorScheme } from 'react-native';

// 항상 light 테마만 사용하도록 수정
export function useColorScheme() {
  // 시스템 테마 무시하고 항상 'light' 반환
  return 'light';
}
