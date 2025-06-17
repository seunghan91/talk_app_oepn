const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 기본 Expo 설정 사용 (커스텀 설정 제거로 JS 번들 오류 해결)
// 이전의 커스텀 hermesCommand, createModuleIdFactory 등이 
// Release 빌드에서 RCTEventEmitter 등록 실패를 야기했음

module.exports = config;