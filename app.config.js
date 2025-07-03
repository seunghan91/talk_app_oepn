module.exports = {
  expo: {
    name: "TALKK",
    slug: "talk-app",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "talkk",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    privacy: "unlisted",
    description: "음성 메시지를 통해 새로운 인연을 만나는 소셜 네트워킹 앱",
    primaryColor: "#ff5a60",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    runtimeVersion: "1.0.1",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.talkkapp.talkk",
      buildNumber: "47"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.talkkapp.talkk"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
      build: {
        babel: {
          include: ["expo-router"]
        }
      }
    },
    assetBundlePatterns: [
      "**/*",
      "assets/*",
      "assets/fonts/*",
      "assets/images/*"
    ],
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-font",
      "expo-asset"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "a6b66f7d-73bf-4df8-9cc4-c78af6984b8b"
      }
    },
    owner: "seunghan91"
  }
}; 