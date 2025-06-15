// app.config.js
export default ({ config }) => {
  // 기본값 설정 (app.json의 값들과 app.config.js 기존 값들 통합)
  const appName = process.env.APP_NAME || "TALKK";
  const appSlug = process.env.APP_SLUG || "talk-app";

  return {
    ...config, // Expo CLI가 전달하는 기본 설정을 먼저 적용
    name: appName,
    slug: appSlug,
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "talkk", // from app.json
    userInterfaceStyle: "automatic", // from app.json
    description: "음성 메시지를 통해 새로운 인연을 만나는 소셜 네트워킹 앱", // from app.json
    owner: "seunghan91", // from app.json

    splash: { // app.config.js 우선, app.json 참고하여 일관성
      image: "./assets/images/splash-icon.png", // from app.config.js (app.json과 동일하게 맞춤)
      resizeMode: "contain",
      backgroundColor: "#ffffff", // from app.json (일관성을 위해 흰색으로)
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ["**/*"], // from app.json (app.config.js와 동일)
    experiments: { // from app.json
      typedRoutes: true,
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.talkapp.talkk2025",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false, // from app.config.js
      },
      // runtimeVersion은 top-level로 이동
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff", // from app.json (일관성을 위해 흰색으로)
      },
      package: "com.talkapp.talkk2025",
      // runtimeVersion은 top-level로 이동
    },
    web: { // from app.json
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png", // from app.config.js (app.json과 동일)
    },

    extra: { // app.config.js 우선
      router: { // from app.json (extra 내부에 있었음)
        origin: false,
      },
      apiUrl: process.env.API_URL || 'https://talkk-api.onrender.com',
      eas: {
        projectId: "a6b66f7d-73bf-4df8-9cc4-c78af6984b8b",
      },
    },

    plugins: [ // 두 파일의 플러그인 병합 및 정리
      "expo-router",
      [
        "expo-splash-screen", // from app.json
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "expo-font", // from app.json
      "expo-asset", // from app.json

      // "expo-router" 중복 제거됨
    ],
    runtimeVersion: { // from app.json, top-level로 이동
      policy: "appVersion",
    },
    // newArchEnabled는 최상위 expo 객체 레벨에 있어야 하지만,
    // app.config.js에서는 보통 export하는 객체 최상위에 둡니다.
    // Expo CLI가 빌드 시 expo 객체 안으로 넣어줍니다.
    newArchEnabled: false, // from app.json
  };
};