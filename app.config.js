// app.config.js
export default ({ config }) => {
  // 기본값 설정
  const appName = process.env.APP_NAME || "TALKK";
  const appSlug = process.env.APP_SLUG || "talk-app";
  
  // Production API URL 강제 설정
  const apiUrl = process.env.API_URL || 'https://talkk-api.onrender.com';
  
  console.log(' App Config - API URL:', apiUrl);
  console.log(' App Config - NODE_ENV:', process.env.NODE_ENV);

  return {
    ...config, // app.json의 기본 설정을 먼저 적용
    name: appName,
    slug: appSlug,
    
    // extra 설정 - API URL을 강제로 설정
    extra: {
      ...config.extra,
      apiUrl: apiUrl,
      // 디버깅용 추가 정보
      buildTime: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'development',
    },

    // iOS 관련 설정만 오버라이드
    ios: {
      ...config.ios,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // Push Notifications를 일시적으로 비활성화
        UIBackgroundModes: []
      },
      entitlements: {
        // Push Notifications 관련 entitlements 제거
      },
    },

    // Android 설정은 app.json 그대로 사용
    android: config.android,
    
    // 기타 설정들도 app.json 우선
    web: config.web,
    plugins: config.plugins,
    runtimeVersion: config.runtimeVersion,
    newArchEnabled: config.newArchEnabled,
  };
};