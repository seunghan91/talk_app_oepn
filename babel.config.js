module.exports = function (api) {
  api.cache(true);
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  const plugins = [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@app': './app',
          '@components': './components',
          '@hooks': './hooks',
          '@constants': './constants',
          '@assets': './assets',
          '@utils': './utils',
          '@lib': './app/lib',
          '@screens': './app/screens',
          '@navigation': './app/navigation',
          '@context': './app/context',
          '@types': './types',
        },
      },
    ],
    'react-native-reanimated/plugin', // 반드시 마지막에 위치
  ];

  // 프로덕션 빌드에서 console.log 제거 및 개발 전용 모듈 제거
  if (isProduction) {
    plugins.push(
      ['transform-remove-console', { exclude: ['error', 'warn'] }],
      ['babel-plugin-transform-remove-debugger']
    );
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};