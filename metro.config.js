const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Hermes dSYM 문제 해결을 위한 설정
config.transformer = {
  ...config.transformer,
  hermesCommand: './node_modules/react-native/sdks/hermesc/osx-bin/hermesc',
  enableBabelRCLookup: false,
  enableBabelRuntime: false,
};

// dSYM 생성 활성화
config.serializer = {
  ...config.serializer,
  createModuleIdFactory: function () {
    return function (path) {
      // 안정적인 모듈 ID 생성
      let name = path.substr(path.lastIndexOf('/') + 1);
      if (name === 'index.js') {
        name = path.substr(path.lastIndexOf('/', path.lastIndexOf('/') - 1) + 1);
      }
      return name.replace(/\W/g, '');
    };
  },
};

module.exports = config;