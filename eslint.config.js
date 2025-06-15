import js from '@eslint/js';
import reactNative from '@react-native/eslint-config';

export default [
  js.configs.recommended,
  ...reactNative,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.expo/**',
      'ios/**',
      'android/**',
      'coverage/**',
      '*.config.js',
      'metro.config.js',
      'babel.config.js',
      'app.json',
      'eas.json',
      'package-lock.json',
      'yarn.lock'
    ]
  },
  {
    languageOptions: {
      globals: {
        // Node.js globals
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        AbortController: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        console: 'readonly',
        global: 'readonly',
        __DEV__: 'readonly',
        
        // Jest globals
        jest: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      }
    },
    rules: {
      // 경고를 에러로 처리하지 않음
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'import/named': 'warn',
      'import/namespace': 'warn',
      
      // 전역 변수들 허용
      'no-undef': 'off',
      
      // React Native에서 자주 사용되는 패턴들 허용
      'react-hooks/rules-of-hooks': 'warn',
    }
  }
]; 