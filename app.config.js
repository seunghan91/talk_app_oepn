module.exports = {
  name: "TALKK",
  slug: "talkk-app",
  version: "1.0.0",
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
    fallbackToCacheTimeout: 0,
    url: "https://u.expo.dev/3cd35644-e5e7-4288-b9ff-be27477bbf47"
  },
  runtimeVersion: "1.0.0",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.talkkapp.talkk"
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
      projectId: "3cd35644-e5e7-4288-b9ff-be27477bbf47"
    }
  },
  owner: "seunghan91"
}; 