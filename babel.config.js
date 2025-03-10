module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
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
    ],
  };
}; 