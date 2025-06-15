module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // 경고를 에러로 처리하지 않음
    'no-unused-vars': 'warn',
    'no-undef': 'off', // React Native 전역 변수들 때문에 끔
    'no-console': 'off',
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-empty-interface': 'warn',
      },
    },
    {
      files: ['**/*.test.{js,jsx,ts,tsx}', '**/tests/**/*.{js,jsx,ts,tsx}'],
      env: {
        jest: true,
      },
      globals: {
        jest: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.expo/',
    'ios/',
    'android/',
    '*.config.js',
    'metro.config.js',
    'babel.config.js',
  ],
}; 