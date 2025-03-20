// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. expo-router 추가
const { transformer, resolver } = config;
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

// 2. 이미지 및 SVG 확장자 처리
const assetExts = resolver.assetExts.filter(ext => ext !== 'svg');
const sourceExts = [...resolver.sourceExts, 'svg', 'mjs', 'cjs'];

config.resolver = {
  ...resolver,
  assetExts,
  sourceExts,
  extraNodeModules: {
    // Node.js 모듈 폴리필
    crypto: require.resolve('react-native-crypto'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    // 경로 별칭 설정
    '@': path.resolve(__dirname, 'app'),
    'assets': path.resolve(__dirname, 'assets'),
  },
  // 에셋 경로 처리
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === 'missing-asset-registry-path') {
      return {
        filePath: path.resolve(__dirname, 'assets/images/placeholder.png'),
        type: 'sourceFile',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config; 