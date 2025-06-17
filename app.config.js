// app.config.js
export default ({ config }) => {
  // 기본값 설정
  const appName = process.env.APP_NAME || "TALKK";
  const appSlug = process.env.APP_SLUG || "talk-app";

  return {
    ...config, // app.json의 기본 설정을 먼저 적용
    name: appName,
    slug: appSlug,
    
    // extra 설정 - API URL을 환경변수로 오버라이드 가능
    extra: {
      ...config.extra,
      apiUrl: process.env.API_URL || config.extra?.apiUrl || 'https://talkk-api.onrender.com',
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